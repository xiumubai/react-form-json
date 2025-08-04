/**
 * 表达式计算器
 * 用于处理表单中的条件表达式
 */

/**
 * 安全地评估表达式
 * @param expression 表达式字符串
 * @param context 上下文对象
 * @returns 表达式计算结果
 */
export const evaluateExpression = (expression: string, context: Record<string, any>): any => {
  // 简单表达式处理
  if (expression.includes('==')) {
    const [left, right] = expression.split('==').map(part => part.trim());
    return getValueFromPath(context, left) == getValueFromPath(context, right);
  }
  
  if (expression.includes('!=')) {
    const [left, right] = expression.split('!=').map(part => part.trim());
    return getValueFromPath(context, left) != getValueFromPath(context, right);
  }
  
  if (expression.includes('>')) {
    const [left, right] = expression.split('>').map(part => part.trim());
    return getValueFromPath(context, left) > getValueFromPath(context, right);
  }
  
  if (expression.includes('<')) {
    const [left, right] = expression.split('<').map(part => part.trim());
    return getValueFromPath(context, left) < getValueFromPath(context, right);
  }
  
  if (expression.includes('>=')) {
    const [left, right] = expression.split('>=').map(part => part.trim());
    return getValueFromPath(context, left) >= getValueFromPath(context, right);
  }
  
  if (expression.includes('<=')) {
    const [left, right] = expression.split('<=').map(part => part.trim());
    return getValueFromPath(context, left) <= getValueFromPath(context, right);
  }
  
  if (expression.includes('&&')) {
    const parts = expression.split('&&').map(part => part.trim());
    return parts.every(part => evaluateExpression(part, context));
  }
  
  if (expression.includes('||')) {
    const parts = expression.split('||').map(part => part.trim());
    return parts.some(part => evaluateExpression(part, context));
  }
  
  // 处理简单字段引用
  if (expression.startsWith('$')) {
    const path = expression.substring(1);
    return getValueFromPath(context, path);
  }
  
  // 处理字符串字面量
  if (expression.startsWith('\'') && expression.endsWith('\'')) {
    return expression.substring(1, expression.length - 1);
  }
  
  // 处理数字字面量
  if (!isNaN(Number(expression))) {
    return Number(expression);
  }
  
  // 处理布尔字面量
  if (expression === 'true') return true;
  if (expression === 'false') return false;
  
  // 处理空值
  if (expression === 'null') return null;
  if (expression === 'undefined') return undefined;
  
  // 默认返回原始表达式
  return expression;
};

/**
 * 从对象中获取嵌套属性值
 * @param obj 对象
 * @param path 属性路径
 * @returns 属性值
 */
export const getValueFromPath = (obj: Record<string, any>, path: string): any => {
  // 处理字符串字面量
  if (path.startsWith('\'') && path.endsWith('\'')) {
    return path.substring(1, path.length - 1);
  }
  
  // 处理数字字面量
  if (!isNaN(Number(path))) {
    return Number(path);
  }
  
  // 处理布尔字面量
  if (path === 'true') return true;
  if (path === 'false') return false;
  
  // 处理空值
  if (path === 'null') return null;
  if (path === 'undefined') return undefined;
  
  // 处理字段引用
  if (path.startsWith('$')) {
    path = path.substring(1);
  }
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === undefined || result === null) {
      return undefined;
    }
    result = result[key];
  }
  
  return result;
};