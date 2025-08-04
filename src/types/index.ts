/**
 * 表单配置类型定义
 */

// 表单布局类型
export type FormLayoutType = 'horizontal' | 'vertical' | 'inline' | 'tabs' | 'steps' | 'grid';

// 表单字段类型
export type FieldType = 
  | 'input'
  | 'textarea'
  | 'password'
  | 'number'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'switch'
  | 'slider'
  | 'date-picker'
  | 'time-picker'
  | 'range-picker'
  | 'upload'
  | 'rate'
  | 'cascader'
  | 'transfer'
  | 'tree-select'
  | 'group'
  | 'custom';

// 表单按钮类型
export type ButtonType = 'primary' | 'default' | 'dashed' | 'link' | 'text';

// 表单按钮动作类型
export type ButtonActionType = 'submit' | 'reset' | 'cancel' | 'custom';

// 表单API配置
export interface FormApiConfig {
  fetch?: string;
  submit?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
}

// API配置
export interface ApiConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  transformRequest?: ((data: any) => any) | string;
  onSuccess?: ((response: any, form: any) => void) | string;
  onError?: ((error: any, form: any) => void) | string;
}

// 表单布局配置
export interface FormLayoutConfig {
  type?: FormLayoutType;
  labelCol?: { span: number; offset?: number };
  wrapperCol?: { span: number; offset?: number };
  gutter?: number;
  spans?: number[];
  tabs?: {
    title: string;
    fields: number[];
  }[];
  steps?: {
    title: string;
    description?: string;
    fields: number[];
  }[];
}

// 表单校验规则
export interface ValidationRule {
  required?: boolean;
  message?: string;
  type?: string;
  min?: number;
  max?: number;
  len?: number;
  pattern?: RegExp | string;
  validator?: (rule: any, value: any) => Promise<void>;
  [key: string]: any;
}

// 表单选项
export interface OptionType {
  label: string;
  value: string | number;
  disabled?: boolean;
  children?: OptionType[];
  [key: string]: any;
}

// 表单字段配置
export interface FieldConfig {
  name: string;
  label?: string;
  type: FieldType;
  defaultValue?: any;
  placeholder?: string;
  rules?: ValidationRule[];
  props?: Record<string, any>;
  options?: OptionType[] | string; // 可以是选项数组或API路径
  dependencies?: string[];
  visible?: boolean | string; // 可见性条件，可以是布尔值或表达式
  disabled?: boolean | string; // 禁用条件，可以是布尔值或表达式
  fields?: FieldConfig[]; // 用于group类型
  customType?: string; // 用于custom类型
  width?: string | number; // 字段宽度
  labelWidth?: string | number; // 标签宽度
  help?: string; // 帮助信息
  extra?: string; // 额外信息
  [key: string]: any; // 其他自定义属性
}

// 表单按钮配置
export interface ButtonConfig {
  text: string;
  type?: ButtonType;
  action: ButtonActionType;
  props?: Record<string, any>;
  visible?: boolean | string; // 可见性条件
  disabled?: boolean | string; // 禁用条件
  handler?: string; // 自定义处理函数名
  icon?: string; // 按钮图标
}

// 完整表单配置
export interface FormConfig {
  formId: string;
  name?: string;
  layout?: FormLayoutConfig;
  api?: FormApiConfig;
  fields: FieldConfig[];
  buttons?: ButtonConfig[];
  props?: Record<string, any>; // 表单其他属性
  version?: string; // 配置版本号
  description?: string; // 表单描述
}

// 动态表单组件属性
export interface DynamicFormProps {
  config: FormConfig | string; // 可以是配置对象或配置文件路径
  initialValues?: Record<string, any>; // 初始值
  onSubmit?: (values: any, response?: any) => void; // 提交回调
  onCancel?: () => void; // 取消回调
  onValuesChange?: (changedValues: any, allValues: any) => void; // 值变化回调
  loading?: boolean; // 加载状态
  disabled?: boolean; // 禁用状态
  readOnly?: boolean; // 只读状态
  formRef?: any; // 表单引用
  plugins?: any[]; // 插件列表
  [key: string]: any; // 其他属性
}

// 表单上下文
export interface FormContext {
  config: FormConfig;
  form: any; // Form实例
  values: Record<string, any>;
  setValues: (values: Record<string, any>) => void;
  submit: () => Promise<any>;
  reset: () => void;
  setFieldsValue: (values: Record<string, any>) => void;
  getFieldValue: (name: string) => any;
  validateFields: (nameList?: string[]) => Promise<any>;
  [key: string]: any;
}

// 验证结果
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

// 插件接口
export interface FormPlugin {
  name: string;
  initialize: (context: FormContext) => void;
  beforeRender?: (config: FormConfig) => FormConfig;
  afterRender?: (form: any) => void;
  beforeSubmit?: (values: any) => any;
  afterSubmit?: (values: any, response: any) => void;
  onError?: (error: Error) => void;
  [key: string]: any;
}