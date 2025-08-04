import React, { useEffect, useState } from 'react';
import { Form, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { FieldConfig } from '../../types';
import { getFormComponent } from '../../core/registry/ComponentRegistry';
import { processValidationRules } from '../../core/registry/ValidationRegistry';
import { evaluateExpression } from '../../utils/expressionEvaluator';
import { evaluateFunction } from '../../utils/functionEvaluator';

interface FormFieldProps {
  field: FieldConfig;
  form: any;
  formValues: Record<string, any>;
}

/**
 * 表单字段组件
 * 根据字段配置渲染对应的表单控件
 */
const FormField: React.FC<FormFieldProps> = ({ field, form, formValues }) => {
  const [options, setOptions] = useState<any[]>([]);
  const [visible, setVisible] = useState<boolean>(true);
  const [disabled, setDisabled] = useState<boolean>(false);

  // 处理字段依赖和条件表达式
  useEffect(() => {
    // 处理可见性条件
    if (typeof field.visible === 'boolean') {
      setVisible(field.visible);
    } else if (typeof field.visible === 'string') {
      try {
        const result = evaluateExpression(field.visible, formValues);
        setVisible(!!result);
      } catch (error) {
        console.error(`Error evaluating visibility expression for field ${field.name}:`, error);
        setVisible(true);
      }
    }

    // 处理禁用条件
    if (typeof field.disabled === 'boolean') {
      setDisabled(field.disabled);
    } else if (typeof field.disabled === 'string') {
      try {
        const result = evaluateExpression(field.disabled, formValues);
        setDisabled(!!result);
      } catch (error) {
        console.error(`Error evaluating disabled expression for field ${field.name}:`, error);
        setDisabled(false);
      }
    }
  }, [field, formValues]);

  // 处理选项数据
  useEffect(() => {
    if (field.options) {
      if (Array.isArray(field.options)) {
        setOptions(field.options);
      } else if (typeof field.options === 'string' && field.options.startsWith('http')) {
        // 从API获取选项数据
        fetch(field.options)
          .then(response => response.json())
          .then(data => {
            setOptions(data);
          })
          .catch(error => {
            console.error(`Error fetching options for field ${field.name}:`, error);
            setOptions([]);
          });
      }
    }
  }, [field.options, field.name]);

  // 如果字段不可见，则不渲染
  if (!visible) {
    return null;
  }

  // 处理校验规则
  const rules = processValidationRules(field.rules);

  // 处理字段宽度
  const fieldStyle: React.CSSProperties = {};
  if (field.width) {
    fieldStyle.width = typeof field.width === 'number' ? `${field.width}px` : field.width;
  }

  // 处理标签宽度
  const labelCol = field.labelWidth ? { flex: `0 0 ${field.labelWidth}px` } : undefined;

  // 处理帮助提示
  const label = field.help ? (
    <span>
      {field.label}{' '}
      <Tooltip title={field.help}>
        <QuestionCircleOutlined />
      </Tooltip>
    </span>
  ) : (
    field.label
  );

  // 处理组件属性
  const componentProps: Record<string, any> = {
    ...field.props,
    disabled,
    placeholder: field.placeholder,
    style: fieldStyle,
  };
  
  // 处理formatter和parser函数
  if (field.props) {
    // 处理formatter
    if (field.props.formatter && typeof field.props.formatter === 'string') {
      const formatterFn = evaluateFunction(field.props.formatter);
      if (formatterFn) {
        componentProps.formatter = formatterFn;
      }
    }
    
    // 处理parser
    if (field.props.parser && typeof field.props.parser === 'string') {
      const parserFn = evaluateFunction(field.props.parser);
      if (parserFn) {
        componentProps.parser = parserFn;
      }
    }
  }

  // 处理选项类组件的属性
  if (['select', 'radio', 'checkbox', 'cascader', 'tree-select'].includes(field.type)) {
    componentProps.options = options;
  }

  // 处理自定义组件
  if (field.type === 'custom' && field.customType) {
    return (
      <Form.Item
        name={field.name}
        label={label}
        rules={rules}
        labelCol={labelCol}
        extra={field.extra}
      >
        {getFormComponent(field.customType as any, {
          ...componentProps,
          form,
          field,
          formValues,
        })}
      </Form.Item>
    );
  }

  // 处理组类型
  if (field.type === 'group' && field.fields) {
    return (
      <div className="form-field-group" style={fieldStyle}>
        {field.label && <div className="form-field-group-label">{field.label}</div>}
        {field.fields.map((subField) => (
          <FormField
            key={`${field.name}-${subField.name}`}
            field={{
              ...subField,
              name: `${field.name}.${subField.name}`,
            }}
            form={form}
            formValues={formValues}
          />
        ))}
      </div>
    );
  }

  // 渲染标准表单字段
  return (
    <Form.Item
      name={field.name}
      label={label}
      rules={rules}
      labelCol={labelCol}
      extra={field.extra}
    >
      {getFormComponent(field.type, componentProps)}
    </Form.Item>
  );
};

export default FormField;