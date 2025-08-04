import { BasePlugin } from './BasePlugin';
import { FormContext } from '../../types';

/**
 * 远程数据插件配置
 */
export interface RemoteDataPluginOptions {
  /**
   * 数据源配置
   */
  dataSources: {
    /**
     * 数据源名称
     */
    name: string;

    /**
     * 数据源URL
     */
    url: string;

    /**
     * 请求方法
     */
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';

    /**
     * 请求头
     */
    headers?: Record<string, string>;

    /**
     * 请求参数
     */
    params?: Record<string, any>;

    /**
     * 请求体
     */
    body?: any;

    /**
     * 数据路径
     */
    dataPath?: string;

    /**
     * 值字段
     */
    valueField?: string;

    /**
     * 标签字段
     */
    labelField?: string;

    /**
     * 缓存时间（毫秒）
     */
    cacheTime?: number;
  }[];

  /**
   * 自动加载
   */
  autoLoad?: boolean;

  /**
   * 全局请求头
   */
  headers?: Record<string, string>;

  /**
   * 全局请求参数
   */
  params?: Record<string, any>;
}

/**
 * 远程数据插件
 * 用于从远程API获取表单数据
 */
export class RemoteDataPlugin extends BasePlugin {
  name = 'remoteData';
  private options: RemoteDataPluginOptions;
  private context: FormContext | null = null;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  /**
   * 构造函数
   * @param options 插件配置
   */
  constructor(options: RemoteDataPluginOptions) {
    super();
    this.options = {
      autoLoad: true,
      // 初始化为空数组，会被options中的值覆盖
      ...options,
    };
    
    // 确保dataSources始终是数组
    if (!this.options.dataSources) {
      this.options.dataSources = [];
    }
  }

  /**
   * 初始化插件
   * @param context 表单上下文
   */
  initialize(context: FormContext): void {
    this.context = context;

    // 自动加载数据
    if (this.options.autoLoad && this.options.dataSources && Array.isArray(this.options.dataSources)) {
      this.loadAllData();
    }

    // 注册全局数据源
    if (window) {
      // 使用安全的方式定义全局属性
      (window as any).__FORM_REMOTE_DATA__ = {
        loadData: this.loadData.bind(this),
        getAllData: this.getAllData.bind(this),
        clearCache: this.clearCache.bind(this),
      };
    }
  }

  /**
   * 表单渲染前处理
   * @param config 表单配置
   * @returns 处理后的表单配置
   */
  beforeRender(config: any): any {
    // 处理字段的远程数据源
    if (config.fields && Array.isArray(config.fields)) {
      config.fields = config.fields.map((field: any) => {
        // 处理远程选项
        if (field.options && typeof field.options === 'string' && field.options.startsWith('remote:')) {
          const dataSourceName = field.options.replace('remote:', '');
          field.__remoteDataSource = dataSourceName;
          field.options = [];
        }

        return field;
      });
    }

    return config;
  }

  /**
   * 表单渲染后处理
   */
  afterRender(form: any): void {
    if (this.context && this.context.config.fields) {
      for (const field of this.context.config.fields) {
        if (field.__remoteDataSource) {
          this.loadData(field.__remoteDataSource).then((options) => {
            // 更新字段选项
            const updatedFields = [...this.context!.config.fields];
            const fieldIndex = updatedFields.findIndex((f) => f.name === field.name);
            if (fieldIndex !== -1) {
              updatedFields[fieldIndex].options = options;
              // 触发表单重新渲染
              this.context!.form.setFields([{
                name: field.name,
                value: this.context!.form.getFieldValue(field.name),
              }]);
            }
          }).catch((error) => {
            console.error(`Error loading remote data for field ${field.name}:`, error);
          });
        }
      }
      
      // 添加级联选择支持
      // 监听分类字段变化，更新品牌选项
      const categoryField = this.context.config.fields.find(field => field.name === 'basic.category');
      const brandField = this.context.config.fields.find(field => field.name === 'basic.brand');
      
      if (categoryField && brandField && brandField.__remoteDataSource === 'brands') {
        // 保存当前分类值，用于比较变化
        let currentCategoryValue = form.getFieldValue('basic.category');
        
        // 设置表单值变化监听
        // 由于FormConfig没有onValuesChange属性，我们需要在context上安全地访问它
        const originalValuesChange = (this.context as any).onValuesChange;
        (this.context as any).onValuesChange = (changedValues: any, allValues: any) => {
          // 调用原始的onValuesChange回调
          if (originalValuesChange) {
            originalValuesChange(changedValues, allValues);
          }
          
          // 检查分类字段是否变化
          if ('basic' in changedValues && 'category' in changedValues.basic) {
            const newCategoryValue = changedValues.basic.category;
            if (newCategoryValue !== currentCategoryValue) {
              currentCategoryValue = newCategoryValue;
              
              if (newCategoryValue) {
                // 根据分类ID加载品牌数据
                const dataSource = this.options.dataSources && Array.isArray(this.options.dataSources) ?
                  this.options.dataSources.find(ds => ds.name === 'brands') : undefined;
                if (dataSource) {
                  // 添加categoryId参数
                  const params = { ...dataSource.params, categoryId: newCategoryValue };
                  const updatedDataSource = { ...dataSource, params };
                  
                  // 加载过滤后的品牌数据
                  this.loadData('brands', updatedDataSource).then((options) => {
                    // 更新品牌字段选项
                    const updatedFields = [...this.context!.config.fields];
                    const fieldIndex = updatedFields.findIndex(f => f.name === 'basic.brand');
                    if (fieldIndex !== -1) {
                      updatedFields[fieldIndex].options = options;
                      // 触发表单重新渲染
                      this.context!.form.setFields([{
                        name: 'basic.brand',
                        value: this.context!.form.getFieldValue('basic.brand'),
                      }]);
                    }
                  }).catch((error) => {
                    console.error(`Error loading filtered brands:`, error);
                  });
                }
              }
            }
          }
        };
      }
    }
  }

  /**
   * 加载所有数据源数据
   */
  async loadAllData(): Promise<Record<string, any[]>> {
    const results: Record<string, any[]> = {};

    // 确保dataSources是数组且可迭代
    if (this.options.dataSources && Array.isArray(this.options.dataSources)) {
      for (const dataSource of this.options.dataSources) {
        try {
          results[dataSource.name] = await this.loadData(dataSource.name);
        } catch (error) {
          console.error(`Error loading data source ${dataSource.name}:`, error);
          results[dataSource.name] = [];
        }
      }
    }

    return results;
  }

  /**
   * 加载指定数据源数据
   * @param name 数据源名称
   * @param customDataSource 自定义数据源配置（可选）
   * @returns 数据数组
   */
  async loadData(name: string, customDataSource?: any): Promise<any[]> {
    // 确保dataSources是数组且可迭代
    const dataSource = customDataSource || 
      (this.options.dataSources && Array.isArray(this.options.dataSources) ? 
        this.options.dataSources.find((ds) => ds.name === name) : 
        undefined);
    if (!dataSource) {
      throw new Error(`Data source "${name}" not found`);
    }

    // 检查缓存
    const cached = this.cache.get(name);
    if (cached && dataSource.cacheTime) {
      const now = Date.now();
      if (now - cached.timestamp < dataSource.cacheTime) {
        return cached.data;
      }
    }

    // 构建请求URL
    let url = dataSource.url;
    const params = { ...this.options.params, ...dataSource.params };
    if (params && Object.keys(params).length > 0 && (dataSource.method === 'GET' || !dataSource.method)) {
      const queryString = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');
      url += url.includes('?') ? `&${queryString}` : `?${queryString}`;
    }

    // 发送请求
    try {
      const headers = { ...this.options.headers, ...dataSource.headers };
      const response = await fetch(url, {
        method: dataSource.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: dataSource.method !== 'GET' && dataSource.body
          ? JSON.stringify(dataSource.body)
          : undefined,
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      let data = await response.json();

      // 处理数据路径
      if (dataSource.dataPath) {
        const paths = dataSource.dataPath.split('.');
        for (const path of paths) {
          if (data && data[path] !== undefined) {
            data = data[path];
          } else {
            data = [];
            break;
          }
        }
      }

      // 确保数据是数组
      if (!Array.isArray(data)) {
        data = [];
      }

      // 处理值和标签字段
      const result = data.map((item: any) => {
        if (typeof item === 'object' && item !== null) {
          const valueField = dataSource.valueField || 'value';
          const labelField = dataSource.labelField || 'label';
          return {
            value: item[valueField],
            label: item[labelField],
            ...item,
          };
        }
        return { value: item, label: item };
      });

      // 更新缓存
      this.cache.set(name, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      console.error(`Error fetching data from ${url}:`, error);
      throw error;
    }
  }

  /**
   * 获取所有已加载的数据
   * @returns 所有数据
   */
  getAllData(): Record<string, any[]> {
    const result: Record<string, any[]> = {};
    // 使用Array.from来避免MapIterator类型的循环访问问题
    Array.from(this.cache.entries()).forEach(([key, value]) => {
      result[key] = value.data;
    });
    return result;
  }

  /**
   * 清除缓存
   * @param name 数据源名称，不传则清除所有
   */
  clearCache(name?: string): void {
    if (name) {
      this.cache.delete(name);
    } else {
      this.cache.clear();
    }
  }
}