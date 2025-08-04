import { ApiConfig } from '../types';

/**
 * 执行表单API请求
 * @param apiConfig API配置
 * @param formData 表单数据
 * @returns Promise<any> API响应
 */
export const executeApiRequest = async (
  apiConfig: ApiConfig,
  formData: Record<string, any>
): Promise<any> => {
  const { url, method = 'POST', headers = {}, transformRequest } = apiConfig;
  
  if (!url) {
    throw new Error('API URL is required');
  }
  
  // 转换请求数据
  let requestData = { ...formData };
  if (transformRequest) {
    try {
      // 如果transformRequest是字符串（函数体），则转换为函数
      if (typeof transformRequest === 'string') {
        // eslint-disable-next-line no-new-func
        const transformFn = new Function('data', `return (${transformRequest})(data);`);
        requestData = transformFn(requestData);
      } else if (typeof transformRequest === 'function') {
        requestData = transformRequest(requestData);
      }
    } catch (error) {
      console.error('Error transforming request data:', error);
    }
  }
  
  // 构建请求选项
  const requestOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  
  // 添加请求体（对于非GET请求）
  if (method !== 'GET') {
    requestOptions.body = JSON.stringify(requestData);
  }
  
  // 对于GET请求，将参数添加到URL
  let requestUrl = url;
  if (method === 'GET' && Object.keys(requestData).length > 0) {
    const queryParams = new URLSearchParams();
    Object.entries(requestData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    const queryString = queryParams.toString();
    if (queryString) {
      requestUrl = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
    }
  }
  
  // 发送请求
  try {
    const response = await fetch(requestUrl, requestOptions);
    
    // 检查响应状态
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
    }
    
    // 解析响应
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

/**
 * 处理API响应
 * @param response API响应
 * @param apiConfig API配置
 * @param form 表单实例
 * @returns void
 */
export const handleApiResponse = (
  response: any,
  apiConfig: ApiConfig,
  form: any
): void => {
  const { onSuccess, onError } = apiConfig;
  
  try {
    // 如果onSuccess是字符串（函数体），则转换为函数
    if (onSuccess && typeof onSuccess === 'string') {
      // eslint-disable-next-line no-new-func
      const successFn = new Function('response', 'form', `return (${onSuccess})(response, form);`);
      successFn(response, form);
    } else if (onSuccess && typeof onSuccess === 'function') {
      onSuccess(response, form);
    }
  } catch (error) {
    console.error('Error in onSuccess handler:', error);
    
    // 调用错误处理函数
    try {
      if (onError && typeof onError === 'string') {
        // eslint-disable-next-line no-new-func
        const errorFn = new Function('error', 'form', `return (${onError})(error, form);`);
        errorFn(error, form);
      } else if (onError && typeof onError === 'function') {
        onError(error, form);
      }
    } catch (handlerError) {
      console.error('Error in onError handler:', handlerError);
    }
  }
};