import React from 'react';
import {
  Input,
  Select,
  Radio,
  Checkbox,
  Switch,
  DatePicker,
  TimePicker,
  Upload,
  Slider,
  Rate,
  Cascader,
  Transfer,
  TreeSelect,
  InputNumber,
} from 'antd';
import { FieldType } from '../../types';

/**
 * 组件注册器
 * 用于管理和注册表单组件
 */
export class ComponentRegistry {
  private static instance: ComponentRegistry;
  private components: Record<string, React.ComponentType<any>> = {};

  /**
   * 私有构造函数，防止外部直接实例化
   */
  private constructor() {
    this.registerBuiltInComponents();
  }

  /**
   * 获取单例实例
   * @returns ComponentRegistry实例
   */
  public static getInstance(): ComponentRegistry {
    if (!ComponentRegistry.instance) {
      ComponentRegistry.instance = new ComponentRegistry();
    }
    return ComponentRegistry.instance;
  }

  /**
   * 注册组件
   * @param type 组件类型
   * @param component 组件
   */
  public register(type: string, component: React.ComponentType<any>): void {
    this.components[type] = component;
  }

  /**
   * 获取组件
   * @param type 组件类型
   * @returns 组件或undefined
   */
  public getComponent(type: string): React.ComponentType<any> | undefined {
    return this.components[type];
  }

  /**
   * 注册内置组件
   */
  private registerBuiltInComponents(): void {
    // 文本输入类
    this.register('input', Input);
    this.register('textarea', Input.TextArea);
    this.register('password', Input.Password);
    this.register('number', InputNumber);

    // 选择类
    this.register('select', Select);
    this.register('radio', Radio.Group);
    this.register('checkbox', Checkbox.Group);
    this.register('switch', Switch);
    this.register('slider', Slider);
    this.register('rate', Rate);
    this.register('cascader', Cascader);
    this.register('transfer', Transfer);
    this.register('tree-select', TreeSelect);

    // 日期时间类
    this.register('date-picker', DatePicker);
    this.register('time-picker', TimePicker);
    this.register('range-picker', DatePicker.RangePicker);

    // 上传类
    this.register('upload', Upload);
  }
}

/**
 * 获取表单组件
 * @param type 组件类型
 * @param props 组件属性
 * @returns React组件
 */
export const getFormComponent = (type: FieldType, props: any = {}): React.ReactNode => {
  const registry = ComponentRegistry.getInstance();
  const Component = registry.getComponent(type);

  if (!Component) {
    console.warn(`Component type '${type}' not found, fallback to Input`);
    return <Input {...props} />;
  }

  return <Component {...props} />;
};

/**
 * 注册自定义组件
 * @param type 组件类型
 * @param component 组件
 */
export const registerCustomComponent = (type: string, component: React.ComponentType<any>): void => {
  const registry = ComponentRegistry.getInstance();
  registry.register(type, component);
};