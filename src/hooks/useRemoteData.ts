import { useState, useEffect, useCallback } from 'react';

interface RemoteDataSource {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  params?: Record<string, any>;
  body?: any;
  dataPath?: string;
  valueField?: string;
  labelField?: string;
  transformResponse?: (data: any) => any[];
  cacheTime?: number;
}

interface CacheItem {
  data: any[];
  timestamp: number;
}

const cache: Record<string, CacheItem> = {};

/**
 * 自定义钩子，用于从远程API获取数据
 * @param dataSource 数据源配置
 * @returns 加载状态、数据和错误信息
 */
export const useRemoteData = (dataSource: RemoteDataSource) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<Error | null>(null);

  // 从嵌套对象中获取值
  const getValueFromPath = (obj: any, path?: string): any => {
    if (!path) return obj;
    return path.split('.').reduce((prev, curr) => {
      return prev && prev[curr] !== undefined ? prev[curr] : undefined;
    }, obj);
  };

  // 转换响应数据为选项数组
  const transformData = useCallback((responseData: any): any[] => {
    if (dataSource.transformResponse) {
      return dataSource.transformResponse(responseData);
    }

    const rawData = getValueFromPath(responseData, dataSource.dataPath) || [];
    const arrayData = Array.isArray(rawData) ? rawData : [rawData];

    if (dataSource.valueField && dataSource.labelField) {
      return arrayData.map((item) => ({
        label: item[dataSource.labelField!],
        value: item[dataSource.valueField!],
        ...item,
      }));
    }

    return arrayData;
  }, [dataSource]);

  // 生成缓存键
  const getCacheKey = useCallback(() => {
    const { url, method = 'GET', params, body } = dataSource;
    return `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(body)}`;
  }, [dataSource]);

  // 检查缓存是否有效
  const isCacheValid = useCallback((cacheKey: string): boolean => {
    if (!cache[cacheKey]) return false;
    if (!dataSource.cacheTime) return false;

    const now = Date.now();
    const { timestamp } = cache[cacheKey];
    return now - timestamp < dataSource.cacheTime;
  }, [dataSource]);

  // 从缓存获取数据
  const getFromCache = useCallback((cacheKey: string): any[] | null => {
    if (isCacheValid(cacheKey)) {
      return cache[cacheKey].data;
    }
    return null;
  }, [isCacheValid]);

  // 将数据存入缓存
  const saveToCache = useCallback((cacheKey: string, data: any[]) => {
    if (dataSource.cacheTime) {
      cache[cacheKey] = {
        data,
        timestamp: Date.now(),
      };
    }
  }, [dataSource]);

  // 加载远程数据
  const fetchData = useCallback(async () => {
    const { url, method = 'GET', headers, params, body } = dataSource;
    const cacheKey = getCacheKey();

    // 检查缓存
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      setData(cachedData);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 构建URL（处理GET请求的查询参数）
      let fetchUrl = url;
      if (method === 'GET' && params) {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
        const queryString = queryParams.toString();
        if (queryString) {
          fetchUrl = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
        }
      }

      // 发送请求
      const response = await fetch(fetchUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        ...(method !== 'GET' && body ? { body: JSON.stringify(body) } : {}),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData = await response.json();
      const transformedData = transformData(responseData);

      // 更新状态并缓存数据
      setData(transformedData);
      saveToCache(cacheKey, transformedData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      console.error('Error fetching remote data:', err);
    } finally {
      setLoading(false);
    }
  }, [dataSource, getCacheKey, getFromCache, saveToCache, transformData]);

  // 组件挂载或数据源变化时加载数据
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 提供重新加载数据的方法
  const reload = useCallback(() => {
    // 清除缓存
    const cacheKey = getCacheKey();
    delete cache[cacheKey];
    // 重新加载
    fetchData();
  }, [fetchData, getCacheKey]);

  return { loading, data, error, reload };
};