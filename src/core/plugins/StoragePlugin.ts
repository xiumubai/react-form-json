import { BasePlugin } from './BasePlugin';
import { FormContext } from '../../types';

/**
 * 存储插件配置
 */
export interface StoragePluginOptions {
  /**
   * 存储键名
   */
  key: string;

  /**
   * 存储类型
   */
  type?: 'localStorage' | 'sessionStorage';

  /**
   * 是否自动加载
   */
  autoLoad?: boolean;

  /**
   * 是否自动保存
   */
  autoSave?: boolean;

  /**
   * 排除的字段
   */
  exclude?: string[];

  /**
   * 包含的字段
   */
  include?: string[];

  /**
   * 过期时间（毫秒）
   */
  expiry?: number;
}

/**
 * 存储插件
 * 用于自动保存和加载表单数据
 */
export class StoragePlugin extends BasePlugin {
  name = 'storage';
  private options: StoragePluginOptions;
  private context: FormContext | null = null;

  /**
   * 构造函数
   * @param options 插件配置
   */
  constructor(options: StoragePluginOptions) {
    super();
    this.options = {
      type: 'localStorage',
      autoLoad: true,
      autoSave: true,
      ...options,
    };
  }

  /**
   * 初始化插件
   * @param context 表单上下文
   */
  initialize(context: FormContext): void {
    this.context = context;

    // 自动加载数据
    if (this.options.autoLoad) {
      this.loadFromStorage();
    }

    // 监听值变化自动保存
    if (this.options.autoSave) {
      const originalValuesChange = context.form.__INTERNAL__.onValuesChange;
      context.form.__INTERNAL__.onValuesChange = (changedValues: any, allValues: any) => {
        if (originalValuesChange) {
          originalValuesChange(changedValues, allValues);
        }
        this.saveToStorage(allValues);
      };
    }
  }

  /**
   * 表单提交后保存数据
   * @param values 表单值
   */
  afterSubmit(values: any): void {
    this.saveToStorage(values);
  }

  /**
   * 从存储加载数据
   */
  loadFromStorage(): void {
    if (!this.context) return;

    try {
      const storage = this.getStorage();
      const storedData = storage.getItem(this.options.key);

      if (storedData) {
        const data = JSON.parse(storedData);

        // 检查是否过期
        if (this.options.expiry && data._timestamp) {
          const now = Date.now();
          if (now - data._timestamp > this.options.expiry) {
            // 数据已过期，删除并返回
            storage.removeItem(this.options.key);
            return;
          }
        }

        // 过滤字段
        const filteredData = this.filterFields(data);
        delete filteredData._timestamp;

        // 设置表单值
        this.context.form.setFieldsValue(filteredData);
      }
    } catch (error) {
      console.error('Error loading form data from storage:', error);
    }
  }

  /**
   * 保存数据到存储
   * @param values 表单值
   */
  saveToStorage(values: any): void {
    try {
      const storage = this.getStorage();
      const filteredValues = this.filterFields(values);

      // 添加时间戳
      if (this.options.expiry) {
        filteredValues._timestamp = Date.now();
      }

      storage.setItem(this.options.key, JSON.stringify(filteredValues));
    } catch (error) {
      console.error('Error saving form data to storage:', error);
    }
  }

  /**
   * 清除存储数据
   */
  clearStorage(): void {
    try {
      const storage = this.getStorage();
      storage.removeItem(this.options.key);
    } catch (error) {
      console.error('Error clearing form data from storage:', error);
    }
  }

  /**
   * 获取存储对象
   * @returns 存储对象
   */
  private getStorage(): Storage {
    return this.options.type === 'sessionStorage' ? sessionStorage : localStorage;
  }

  /**
   * 过滤字段
   * @param values 表单值
   * @returns 过滤后的表单值
   */
  private filterFields(values: any): any {
    const result = { ...values };

    // 排除指定字段
    if (this.options.exclude && this.options.exclude.length > 0) {
      for (const field of this.options.exclude) {
        delete result[field];
      }
    }

    // 只包含指定字段
    if (this.options.include && this.options.include.length > 0) {
      const filteredResult: any = {};
      for (const field of this.options.include) {
        if (result[field] !== undefined) {
          filteredResult[field] = result[field];
        }
      }
      return filteredResult;
    }

    return result;
  }
}