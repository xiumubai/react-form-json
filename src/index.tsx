import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import App from './App';
import './index.css';

// 替换全局fetch以模拟API响应
const originalFetch = window.fetch;

// 导入示例配置
import userFormConfigRaw from './configs/examples/user-form.json?raw';
import productFormConfigRaw from './configs/examples/product-form.yaml?raw';
import yaml from 'js-yaml';

const userFormConfig = JSON.parse(userFormConfigRaw);
const productFormConfig = yaml.load(productFormConfigRaw);

// 导出原始配置字符串，供其他组件使用
export { userFormConfigRaw, productFormConfigRaw };

// 全局模拟API响应函数
const mockFetch = async (url: string, options: RequestInit) => {
  console.log('Mock API call:', url, options);
  
  // 模拟延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 用户相关API
  if (url.includes('/api/user')) {
    return {
      ok: true,
      json: async () => ({
        success: true,
        message: '用户信息保存成功',
        data: JSON.parse((options.body as string) || '{}')
      }),
      text: async () => 'Success'
    };
  }
  
  if (url.includes('/api/departments')) {
    return {
      ok: true,
      json: async () => ({
        data: [
          { id: 1, name: '技术部' },
          { id: 2, name: '产品部' },
          { id: 3, name: '设计部' },
          { id: 4, name: '运营部' },
          { id: 5, name: '市场部' },
          { id: 6, name: '销售部' },
          { id: 7, name: '人力资源部' },
        ]
      })
    };
  }
  
  if (url.includes('/api/positions')) {
    return {
      ok: true,
      json: async () => ({
        data: [
          { id: 1, name: '前端工程师', departmentId: 1 },
          { id: 2, name: '后端工程师', departmentId: 1 },
          { id: 3, name: '产品经理', departmentId: 2 },
          { id: 4, name: 'UI设计师', departmentId: 3 },
          { id: 5, name: 'UX设计师', departmentId: 3 },
          { id: 6, name: '运营专员', departmentId: 4 },
          { id: 7, name: '市场专员', departmentId: 5 },
          { id: 8, name: '销售代表', departmentId: 6 },
          { id: 9, name: 'HR专员', departmentId: 7 },
        ].filter(item => {
          // 如果有部门ID参数，则过滤对应部门的职位
          const params = new URL(url, 'http://example.com').searchParams;
          const departmentId = params.get('departmentId');
          return departmentId ? item.departmentId === Number(departmentId) : true;
        })
      })
    };
  }
  
  // 产品相关API
  if (url.includes('/api/product')) {
    return {
      ok: true,
      json: async () => ({
        success: true,
        message: '产品信息保存成功',
        data: JSON.parse((options.body as string) || '{}')
      }),
      text: async () => 'Success'
    };
  }
  
  if (url.includes('/api/categories')) {
    return {
      ok: true,
      json: async () => ({
        data: [
          { id: 1, name: '电子产品' },
          { id: 2, name: '服装' },
          { id: 3, name: '食品' },
          { id: 4, name: '图书' },
          { id: 5, name: '家居' },
          { id: 6, name: '美妆' },
          { id: 7, name: '玩具' },
        ]
      })
    };
  }
  
  if (url.includes('/api/brands')) {
    return {
      ok: true,
      json: async () => ({
        data: [
          { id: 1, name: 'Apple', categoryId: 1 },
          { id: 2, name: 'Samsung', categoryId: 1 },
          { id: 3, name: 'Xiaomi', categoryId: 1 },
          { id: 4, name: 'Nike', categoryId: 2 },
          { id: 5, name: 'Adidas', categoryId: 2 },
          { id: 6, name: 'Nestle', categoryId: 3 },
          { id: 7, name: 'Penguin', categoryId: 4 },
          { id: 8, name: 'IKEA', categoryId: 5 },
          { id: 9, name: 'LOreal', categoryId: 6 },
          { id: 10, name: 'Lego', categoryId: 7 },
        ].filter(item => {
          // 如果有分类ID参数，则过滤对应分类的品牌
          const params = new URL(url, 'http://example.com').searchParams;
          const categoryId = params.get('categoryId');
          return categoryId ? item.categoryId === Number(categoryId) : true;
        })
      })
    };
  }
  
  if (url.includes('/api/tags')) {
    return {
      ok: true,
      json: async () => ({
        data: [
          { id: 1, name: '新品' },
          { id: 2, name: '热销' },
          { id: 3, name: '促销' },
          { id: 4, name: '限量' },
          { id: 5, name: '经典' },
          { id: 6, name: '畅销' },
        ]
      })
    };
  }
  
  // 配置相关API
  if (url.includes('/api/config')) {
    return {
      ok: true,
      json: async () => userFormConfig,
      text: async () => JSON.stringify(userFormConfig)
    };
  }
  
  if (url.includes('/api/product-config')) {
    // 解析URL参数
    const urlObj = new URL(url, window.location.origin);
    const format = urlObj.searchParams.get('format');
    
    // 根据format参数返回不同格式的配置
    if (format === 'json') {
      return {
        ok: true,
        json: async () => productFormConfig,
        text: async () => JSON.stringify(productFormConfig)
      };
    } else {
      // 默认返回YAML格式
      return {
        ok: true,
        json: async () => productFormConfig,
        text: async () => productFormConfigRaw
      };
    }
  }
  
  // 默认响应
  return {
    ok: false,
    status: 404,
    statusText: 'Not Found',
    text: async () => 'Not Found'
  };
};

window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input.url;
  
  // 只拦截/api/开头的请求
  if (typeof url === 'string' && url.startsWith('/api/')) {
    console.log('拦截API请求:', url);
    return mockFetch(url, init || {});
  }
  
  // 其他请求使用原始fetch
  return originalFetch(input, init);
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN}>
      <App />
    </ConfigProvider>
  </React.StrictMode>
);