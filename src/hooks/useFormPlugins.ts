import { useRef, useEffect } from 'react';
import { BasePlugin } from '../core/plugins/BasePlugin';
import { FormConfig } from '../types';

/**
 * 自定义钩子，用于管理表单插件
 * @param plugins 插件实例数组
 * @param form 表单实例
 * @param config 表单配置
 * @returns 插件管理对象
 */
export const useFormPlugins = (
  plugins: BasePlugin[] = [],
  form: any,
  config: FormConfig | null
) => {
  // 使用ref存储插件实例，避免重复初始化
  const pluginsRef = useRef<BasePlugin[]>([]);

  // 初始化插件
  useEffect(() => {
    if (!config) return;

    // 初始化每个插件
    plugins.forEach(plugin => {
      if (!pluginsRef.current.includes(plugin)) {
        plugin.init(form, config);
        pluginsRef.current.push(plugin);
      }
    });

    // 清理函数
    return () => {
      pluginsRef.current = [];
    };
  }, [plugins, form, config]);

  // 调用所有插件的特定生命周期钩子
  const invokePluginHook = async <T>(hookName: keyof BasePlugin, ...args: any[]): Promise<T[]> => {
    const results: T[] = [];
    
    for (const plugin of pluginsRef.current) {
      const hook = plugin[hookName] as (...hookArgs: any[]) => Promise<T> | T;
      if (typeof hook === 'function') {
        try {
          const result = await hook.apply(plugin, args);
          if (result !== undefined) {
            results.push(result);
          }
        } catch (error) {
          console.error(`Error in plugin ${plugin.name} at ${hookName} hook:`, error);
          // 调用插件的错误处理钩子
          if (typeof plugin.onError === 'function') {
            plugin.onError(error, hookName, ...args);
          }
        }
      }
    }
    
    return results;
  };

  // 在表单渲染前调用插件
  const beforeRender = async (formConfig: FormConfig) => {
    return invokePluginHook<FormConfig>('beforeRender', formConfig);
  };

  // 在表单渲染后调用插件
  const afterRender = async (formInstance: any) => {
    return invokePluginHook<void>('afterRender', formInstance);
  };

  // 在表单提交前调用插件
  const beforeSubmit = async (formValues: Record<string, any>) => {
    const results = await invokePluginHook<Record<string, any>>('beforeSubmit', formValues);
    // 合并所有插件返回的表单值
    return results.reduce((mergedValues, result) => ({ ...mergedValues, ...result }), formValues);
  };

  // 在表单提交后调用插件
  const afterSubmit = async (formValues: Record<string, any>, response: any) => {
    return invokePluginHook<void>('afterSubmit', formValues, response);
  };

  // 在表单出错时调用插件
  const onError = async (error: Error, context: string) => {
    return invokePluginHook<void>('onError', error, context);
  };

  return {
    plugins: pluginsRef.current,
    beforeRender,
    afterRender,
    beforeSubmit,
    afterSubmit,
    onError
  };
};