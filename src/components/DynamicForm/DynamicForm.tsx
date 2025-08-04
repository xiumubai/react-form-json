import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Form, Row, Col, Button, Tabs, Steps, Spin, message } from 'antd';
import { FormConfig, DynamicFormProps, FormContext, ButtonConfig } from '../../types';
import FormField from '../FormFields/FormField';
import { ConfigParserFactory } from '../../core/parser/ConfigParser';
import { evaluateExpression } from '../../utils/expressionEvaluator';

const { TabPane } = Tabs;
const { Step } = Steps;

/**
 * 动态表单组件
 * 根据配置生成表单
 */
const DynamicForm: React.FC<DynamicFormProps & {
  configUrl?: string;
  configType?: 'json' | 'yaml';
}> = ({
  config,
  configUrl,
  configType = 'json',
  initialValues = {},
  onSubmit,
  onCancel,
  onValuesChange,
  loading = false,
  disabled = false,
  readOnly = false,
  formRef: externalFormRef,
  plugins = [],
  ...restProps
}) => {
  const [form] = Form.useForm();
  const formInstance = externalFormRef || form;
  const [parsedConfig, setParsedConfig] = useState<FormConfig | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>(initialValues);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [formLoading, setFormLoading] = useState<boolean>(true);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const contextRef = useRef<FormContext | null>(null);

  // 解析配置
  useEffect(() => {
    const parseConfig = async () => {
      try {
        let formConfig: FormConfig;

        // 如果提供了configUrl，从URL获取配置
        if (configUrl) {
          const response = await fetch(configUrl);
          const configText = await response.text();
          formConfig = ConfigParserFactory.parseConfig(configText, configType);
        } else if (typeof config === 'string') {
          // 如果是URL，从远程获取配置
          if (config.startsWith('http')) {
            const response = await fetch(config);
            const configText = await response.text();
            formConfig = ConfigParserFactory.parseConfig(configText);
          } else {
            // 否则作为配置字符串解析
            formConfig = ConfigParserFactory.parseConfig(config);
          }
        } else if (config) {
          // 直接使用对象配置
          formConfig = config;
        } else {
          throw new Error('必须提供config或configUrl');
        }

        // 应用插件的beforeRender钩子
        let processedConfig = formConfig;
        for (const plugin of plugins) {
          if (plugin.beforeRender) {
            processedConfig = plugin.beforeRender(processedConfig);
          }
        }

        setParsedConfig(processedConfig);
        setFormLoading(false);

        // 初始化表单上下文
        const context: FormContext = {
          config: processedConfig,
          form: formInstance,
          values: initialValues,
          setValues: (values) => setFormValues({ ...formValues, ...values }),
          submit: handleSubmit,
          reset: () => formInstance.resetFields(),
          setFieldsValue: (values) => formInstance.setFieldsValue(values),
          getFieldValue: (name) => formInstance.getFieldValue(name),
          validateFields: (nameList) => formInstance.validateFields(nameList),
        };

        contextRef.current = context;

        // 初始化插件
        for (const plugin of plugins) {
          plugin.initialize(context);
        }

        // 应用插件的afterRender钩子
        for (const plugin of plugins) {
          if (plugin.afterRender) {
            plugin.afterRender(formInstance);
          }
        }
      } catch (error: any) {
        console.error('Error parsing form config:', error);
        message.error(`配置解析错误: ${error.message}`);
        setFormLoading(false);
      }
    };

    parseConfig();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, plugins, configType, configUrl, formInstance, initialValues, formValues]);

  // 处理表单值变化
  const handleValuesChange = (changedValues: any, allValues: any) => {
    setFormValues(allValues);
    if (onValuesChange) {
      onValuesChange(changedValues, allValues);
    }
  };

  // 处理表单提交
  const handleSubmit = useCallback(async () => {
    if (!parsedConfig) return Promise.reject(new Error('表单配置未加载'));

    try {
      setSubmitLoading(true);
      const values = await formInstance.validateFields();

      // 应用插件的beforeSubmit钩子
      let processedValues = values;
      for (const plugin of plugins) {
        if (plugin.beforeSubmit) {
          processedValues = plugin.beforeSubmit(processedValues);
        }
      }

      // 如果配置了API提交
      if (parsedConfig.api?.submit) {
        const { submit, method = 'POST', headers = {} } = parsedConfig.api;
        const response = await fetch(submit, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: JSON.stringify(processedValues),
        });

        if (!response.ok) {
          throw new Error(`提交失败: ${response.statusText}`);
        }

        const responseData = await response.json();

        // 应用插件的afterSubmit钩子
        for (const plugin of plugins) {
          if (plugin.afterSubmit) {
            plugin.afterSubmit(processedValues, responseData);
          }
        }

        if (onSubmit) {
          onSubmit(processedValues, responseData);
        }

        message.success('提交成功');
        return responseData;
      } else {
        // 直接调用onSubmit回调
        if (onSubmit) {
          onSubmit(processedValues);
        }
        return processedValues;
      }
    } catch (error: any) {
      // 应用插件的onError钩子
      for (const plugin of plugins) {
        if (plugin.onError) {
          plugin.onError(error);
        }
      }

      console.error('Form submission error:', error);
      message.error(`提交失败: ${error.message}`);
      return Promise.reject(error);
    } finally {
      setSubmitLoading(false);
    }
  }, [parsedConfig, formInstance, plugins, setSubmitLoading, onSubmit]);

  // 处理按钮点击
  const handleButtonClick = (button: ButtonConfig) => {
    switch (button.action) {
      case 'submit':
        handleSubmit();
        break;
      case 'reset':
        formInstance.resetFields();
        break;
      case 'cancel':
        if (onCancel) onCancel();
        break;
      case 'custom':
        if (button.handler && typeof (window as Record<string, any>)[button.handler] === 'function') {
          (window as Record<string, any>)[button.handler](formInstance, formValues);
        }
        break;
      default:
        break;
    }
  };

  // 渲染按钮
  const renderButtons = () => {
    if (!parsedConfig?.buttons || parsedConfig.buttons.length === 0) {
      // 默认按钮
      return (
        <Button
          type="primary"
          onClick={handleSubmit}
          loading={submitLoading}
          disabled={disabled || readOnly}
        >
          提交
        </Button>
      );
    }

    return parsedConfig.buttons.map((button, index) => {
      // 处理按钮可见性
      let isVisible = true;
      if (typeof button.visible === 'boolean') {
        isVisible = button.visible;
      } else if (typeof button.visible === 'string') {
        try {
          isVisible = evaluateExpression(button.visible, formValues);
        } catch (error) {
          console.error(`Error evaluating button visibility:`, error);
        }
      }

      if (!isVisible) return null;

      // 处理按钮禁用状态
      let isDisabled = disabled || readOnly || (button.action === 'submit' && submitLoading);
      if (typeof button.disabled === 'boolean') {
        isDisabled = isDisabled || button.disabled;
      } else if (typeof button.disabled === 'string') {
        try {
          isDisabled = isDisabled || evaluateExpression(button.disabled, formValues);
        } catch (error) {
          console.error(`Error evaluating button disabled state:`, error);
        }
      }

      return (
        <Button
          key={`button-${index}`}
          type={button.type || 'default'}
          onClick={() => handleButtonClick(button)}
          disabled={isDisabled}
          loading={button.action === 'submit' && submitLoading}
          {...button.props}
        >
          {button.text}
        </Button>
      );
    });
  };

  // 渲染表单字段
  const renderFields = (fields: any[] = []) => {
    return fields.map((field) => (
      <FormField
        key={field.name}
        field={field}
        form={formInstance}
        formValues={formValues}
      />
    ));
  };

  // 渲染表单内容
  const renderFormContent = () => {
    if (!parsedConfig) return null;

    const { fields = [], layout } = parsedConfig;

    // 处理不同布局类型
    switch (layout?.type) {
      case 'tabs':
        return (
          <Tabs defaultActiveKey="0">
            {layout.tabs?.map((tab, index) => (
              <TabPane tab={tab.title} key={String(index)}>
                {renderFields(tab.fields.map(idx => fields[idx]))}
              </TabPane>
            ))}
          </Tabs>
        );

      case 'steps':
        return (
          <div>
            <Steps current={currentStep} style={{ marginBottom: 24 }}>
              {layout.steps?.map((step, index) => (
                <Step key={index} title={step.title} description={step.description} />
              ))}
            </Steps>
            <div>
              {layout.steps && renderFields(layout.steps[currentStep].fields.map(idx => fields[idx]))}
            </div>
            <div style={{ marginTop: 24 }}>
              {currentStep > 0 && (
                <Button style={{ marginRight: 8 }} onClick={() => setCurrentStep(currentStep - 1)}>
                  上一步
                </Button>
              )}
              {layout.steps && currentStep < layout.steps.length - 1 && (
                <Button type="primary" onClick={() => setCurrentStep(currentStep + 1)}>
                  下一步
                </Button>
              )}
              {layout.steps && currentStep === layout.steps.length - 1 && renderButtons()}
            </div>
          </div>
        );

      case 'grid':
        return (
          <Row gutter={layout.gutter || 24}>
            {fields.map((field, index) => {
              const span = layout.spans?.[index] || 24;
              return (
                <Col key={field.name} span={span}>
                  <FormField field={field} form={formInstance} formValues={formValues} />
                </Col>
              );
            })}
          </Row>
        );

      default:
        return renderFields(fields);
    }
  };

  // 设置表单布局
  const getFormLayout = () => {
    if (!parsedConfig?.layout) return {};

    // 处理layout为字符串的情况
    if (typeof parsedConfig.layout === 'string') {
      const layoutValue = parsedConfig.layout === 'inline' ? 'inline' :
                         parsedConfig.layout === 'vertical' ? 'vertical' :
                         parsedConfig.layout === 'horizontal' ? 'horizontal' : undefined;
      return { layout: layoutValue };
    }

    // 处理layout为对象的情况
    const { labelCol, wrapperCol, type } = parsedConfig.layout;

    return {
      labelCol: labelCol ? { span: labelCol.span, offset: labelCol.offset } : undefined,
      wrapperCol: wrapperCol ? { span: wrapperCol.span, offset: wrapperCol.offset } : undefined,
      layout: type === 'inline' ? 'inline' : 
              type === 'vertical' ? 'vertical' : 
              type === 'horizontal' ? 'horizontal' : undefined,
    };
  };

  if (formLoading || loading) {
    return (
      <div style={{ textAlign: 'center', padding: '30px' }}>
        <Spin tip="加载中...">
          <div style={{ padding: '30px', background: 'rgba(0, 0, 0, 0.05)', borderRadius: '4px' }}>
            正在加载表单配置...
          </div>
        </Spin>
      </div>
    );
  }

  return (
    <div className="dynamic-form-container">
      <Form
        form={formInstance}
        initialValues={initialValues}
        onValuesChange={handleValuesChange}
        onFinish={handleSubmit}
        {...getFormLayout()}
        disabled={disabled}
        {...parsedConfig?.props}
        {...restProps}
      >
        {renderFormContent()}
        {parsedConfig?.layout?.type !== 'steps' && (
          <Form.Item wrapperCol={{ offset: 8, span: 16 }} className="form-buttons">
            {renderButtons()}
          </Form.Item>
        )}
      </Form>
    </div>
  );
};

export default DynamicForm;