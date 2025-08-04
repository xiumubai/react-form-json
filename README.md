# React Form JSON

基于JSON/YAML配置的动态表单生成系统，使用React和Ant Design实现。

## 项目简介

本项目旨在通过自定义JSON或YAML配置文件，动态生成基于Ant Design的表单组件，简化表单开发流程，提高开发效率，并实现表单的标准化和可维护性。

## 核心功能

- 通过JSON/YAML配置文件动态生成表单
- 支持Ant Design所有表单组件
- 支持表单校验规则配置
- 支持表单联动
- 支持表单布局自定义
- 支持表单数据的获取和提交
- 支持自定义组件和插件扩展

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm start
```

### 构建生产版本

```bash
npm run build
```

## 使用示例

```jsx
import { DynamicForm } from './components/DynamicForm';
import formConfig from './configs/user-form.json';

const App = () => {
  const handleSubmit = (values) => {
    console.log('Form values:', values);
  };

  return (
    <div className="app">
      <h1>用户信息表单</h1>
      <DynamicForm 
        config={formConfig} 
        onSubmit={handleSubmit} 
      />
    </div>
  );
};

export default App;
```

## 配置文件示例

```json
{
  "formId": "user-form",
  "name": "用户信息表单",
  "layout": {
    "type": "vertical",
    "labelCol": { "span": 6 },
    "wrapperCol": { "span": 18 }
  },
  "api": {
    "fetch": "/api/user/{id}",
    "submit": "/api/user/save",
    "method": "POST"
  },
  "fields": [
    {
      "name": "username",
      "label": "用户名",
      "type": "input",
      "defaultValue": "",
      "placeholder": "请输入用户名",
      "rules": [
        { "required": true, "message": "请输入用户名" },
        { "min": 3, "max": 20, "message": "用户名长度为3-20个字符" }
      ],
      "props": {
        "allowClear": true
      }
    },
    {
      "name": "gender",
      "label": "性别",
      "type": "radio",
      "defaultValue": "male",
      "options": [
        { "label": "男", "value": "male" },
        { "label": "女", "value": "female" },
        { "label": "其他", "value": "other" }
      ],
      "rules": [
        { "required": true, "message": "请选择性别" }
      ]
    }
  ],
  "buttons": [
    {
      "text": "取消",
      "type": "default",
      "action": "cancel"
    },
    {
      "text": "提交",
      "type": "primary",
      "action": "submit"
    }
  ]
}
```

## 项目结构

```
├── public/                 # 静态资源
├── src/                    # 源代码
│   ├── components/         # 组件
│   │   ├── DynamicForm/    # 动态表单组件
│   │   └── FormFields/     # 表单字段组件
│   ├── configs/            # 表单配置文件
│   ├── core/               # 核心功能
│   │   ├── parser/         # 配置解析器
│   │   ├── registry/       # 组件注册器
│   │   └── plugins/        # 插件系统
│   ├── hooks/              # 自定义Hook
│   ├── types/              # TypeScript类型定义
│   ├── utils/              # 工具函数
│   ├── App.tsx             # 应用入口
│   └── index.tsx           # 渲染入口
└── package.json            # 项目配置
```

## 贡献指南

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的改动 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

## 许可证

[MIT](LICENSE)