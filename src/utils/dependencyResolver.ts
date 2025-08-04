import { FieldConfig } from '../types';

/**
 * 解析字段依赖关系，构建依赖图
 * @param fields 字段配置数组
 * @returns 依赖图，键为字段名，值为依赖该字段的字段名数组
 */
export const buildDependencyGraph = (fields: FieldConfig[]): Record<string, string[]> => {
  const dependencyGraph: Record<string, string[]> = {};
  
  // 递归处理字段及其子字段
  const processFields = (fieldList: FieldConfig[], parentPath = '') => {
    fieldList.forEach(field => {
      const fieldPath = parentPath ? `${parentPath}.${field.name}` : field.name;
      
      // 处理显式声明的依赖
      if (field.dependencies && Array.isArray(field.dependencies)) {
        field.dependencies.forEach(dependency => {
          if (!dependencyGraph[dependency]) {
            dependencyGraph[dependency] = [];
          }
          if (!dependencyGraph[dependency].includes(fieldPath)) {
            dependencyGraph[dependency].push(fieldPath);
          }
        });
      }
      
      // 处理可见性条件中的隐式依赖
      if (field.visible && typeof field.visible === 'string') {
        // 简单解析表达式中的字段引用
        const matches = field.visible.match(/formValues\.(\w+)/g);
        if (matches) {
          matches.forEach(match => {
            const dependency = match.replace('formValues.', '');
            if (!dependencyGraph[dependency]) {
              dependencyGraph[dependency] = [];
            }
            if (!dependencyGraph[dependency].includes(fieldPath)) {
              dependencyGraph[dependency].push(fieldPath);
            }
          });
        }
      }
      
      // 处理禁用条件中的隐式依赖
      if (field.disabled && typeof field.disabled === 'string') {
        // 简单解析表达式中的字段引用
        const matches = field.disabled.match(/formValues\.(\w+)/g);
        if (matches) {
          matches.forEach(match => {
            const dependency = match.replace('formValues.', '');
            if (!dependencyGraph[dependency]) {
              dependencyGraph[dependency] = [];
            }
            if (!dependencyGraph[dependency].includes(fieldPath)) {
              dependencyGraph[dependency].push(fieldPath);
            }
          });
        }
      }
      
      // 递归处理子字段
      if (field.type === 'group' && field.fields) {
        processFields(field.fields, fieldPath);
      }
      
      // 处理列表字段的子项
      if (field.type === 'list' && field.items) {
        processFields(field.items, `${fieldPath}[0]`);
      }
    });
  };
  
  processFields(fields);
  return dependencyGraph;
};

/**
 * 获取字段的所有依赖字段
 * @param fieldName 字段名
 * @param dependencyGraph 依赖图
 * @returns 依赖字段名数组
 */
export const getDependentFields = (fieldName: string, dependencyGraph: Record<string, string[]>): string[] => {
  const dependentFields: string[] = [];
  
  const addDependents = (field: string) => {
    const dependents = dependencyGraph[field] || [];
    dependents.forEach(dependent => {
      if (!dependentFields.includes(dependent)) {
        dependentFields.push(dependent);
        // 递归添加间接依赖
        addDependents(dependent);
      }
    });
  };
  
  addDependents(fieldName);
  return dependentFields;
};

/**
 * 获取需要重新计算的字段
 * @param changedFields 已更改的字段名数组
 * @param dependencyGraph 依赖图
 * @returns 需要重新计算的字段名数组
 */
export const getFieldsToRecalculate = (changedFields: string[], dependencyGraph: Record<string, string[]>): string[] => {
  const fieldsToRecalculate = new Set<string>();
  
  changedFields.forEach(field => {
    // 添加直接依赖该字段的字段
    const dependents = getDependentFields(field, dependencyGraph);
    dependents.forEach(dependent => fieldsToRecalculate.add(dependent));
  });
  
  return Array.from(fieldsToRecalculate);
};