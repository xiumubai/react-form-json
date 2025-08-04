import { FormContext, FormPlugin } from '../../types';

/**
 * 基础插件抽象类
 * 所有自定义插件应该继承此类
 */
export abstract class BasePlugin implements FormPlugin {
  /**
   * 插件名称
   */
  abstract name: string;

  /**
   * 插件初始化方法
   * @param context 表单上下文
   */
  initialize(_context: FormContext): void {
    // 默认实现为空，子类可以覆盖
  }

  /**
   * 表单渲染前钩子
   * @param config 表单配置
   * @returns 处理后的表单配置
   */
  beforeRender?(config: any): any {
    return config;
  }

  /**
   * 表单渲染后钩子
   * @param form 表单实例
   */
  afterRender?(_form: any): void {
    // 默认实现为空，子类可以覆盖
  }

  /**
   * 表单提交前钩子
   * @param values 表单值
   * @returns 处理后的表单值
   */
  beforeSubmit?(values: any): any {
    return values;
  }

  /**
   * 表单提交后钩子
   * @param values 表单值
   * @param response 响应数据
   */
  afterSubmit?(_values: any, _response: any): void {
    // 默认实现为空，子类可以覆盖
  }

  /**
   * 错误处理钩子
   * @param error 错误对象
   */
  onError?(_error: Error): void {
    // 默认实现为空，子类可以覆盖
  }
}