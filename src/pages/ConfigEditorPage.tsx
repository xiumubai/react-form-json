import React, { useState, useEffect } from 'react';
import { Card, Space, Button, Row, Col, Typography, message } from 'antd';
import Editor from '@monaco-editor/react';
import DynamicForm from '../components/DynamicForm/DynamicForm';
import { StoragePlugin } from '../core/plugins/StoragePlugin';
import { RemoteDataPlugin } from '../core/plugins/RemoteDataPlugin';

const { Title, Paragraph } = Typography;

// 默认的用户表单配置
const defaultUserFormConfig = {
  "formId": "user-form",
  "name": "user-form",
  "title": "用户信息表单",
  "description": "用于创建或编辑用户信息的表单",
  "layout": "vertical",
  "labelWidth": 120,
  "fields": [
    {
      "name": "basic",
      "type": "group",
      "title": "基本信息",
      "fields": [
        {
          "name": "username",
          "type": "input",
          "label": "用户名",
          "placeholder": "请输入用户名",
          "required": true,
          "rules": [{ "min": 3, "max": 20, "message": "用户名长度必须在3-20个字符之间" }]
        },
        {
          "name": "email",
          "type": "input",
          "label": "邮箱",
          "placeholder": "请输入邮箱",
          "required": true,
          "rules": [{ "type": "email", "message": "请输入有效的邮箱地址" }]
        }
      ]
    }
  ],
  "buttons": [
    {
      "text": "提交",
      "type": "primary",
      "action": "submit"
    },
    {
      "text": "重置",
      "action": "reset"
    }
  ]
};

const ConfigEditorPage: React.FC = () => {
  // 编辑器内容
  const [editorContent, setEditorContent] = useState<string>(
    JSON.stringify(defaultUserFormConfig, null, 2)
  );
  
  // 解析后的配置
  const [parsedConfig, setParsedConfig] = useState<any>(defaultUserFormConfig);
  
  // 编辑器错误
  const [editorError, setEditorError] = useState<string | null>(null);
  
  // 创建插件实例
  const storagePlugin = new StoragePlugin({
    storageType: 'localStorage',
    key: 'config-editor-form-data',
    autoLoad: true,
    autoSave: true,
    excludeFields: ['password', 'confirmPassword'],
    expireTime: 24 * 60 * 60 * 1000 // 24小时
  });
  
  const remoteDataPlugin = new RemoteDataPlugin({
    dataSources: [
      {
        name: 'users',
        url: '/api/users',
        method: 'GET',
        valueField: 'id',
        labelField: 'name'
      },
      {
        name: 'departments',
        url: '/api/departments',
        method: 'GET',
        valueField: 'id',
        labelField: 'name'
      }
    ],
    autoLoad: true
  });
  
  // 更新编辑器内容
  const handleEditorChange = (value: string | undefined) => {
    if (value) {
      setEditorContent(value);
      setEditorError(null);
    }
  };
  
  // 应用配置
  const applyConfig = () => {
    try {
      const config = JSON.parse(editorContent);
      setParsedConfig(config);
      message.success('配置已应用');
    } catch (error) {
      setEditorError(`JSON解析错误: ${(error as Error).message}`);
      message.error(`JSON解析错误: ${(error as Error).message}`);
    }
  };
  
  // 重置配置
  const resetConfig = () => {
    const defaultConfig = JSON.stringify(defaultUserFormConfig, null, 2);
    setEditorContent(defaultConfig);
    setParsedConfig(defaultUserFormConfig);
    setEditorError(null);
    message.info('配置已重置');
  };
  
  // 表单提交处理器
  const handleSubmit = (values: Record<string, any>) => {
    console.log('Form submitted:', values);
    message.success('表单提交成功！');
  };
  
  // 表单值变化处理器
  const handleValuesChange = (changedValues: Record<string, any>, allValues: Record<string, any>) => {
    console.log('Values changed:', changedValues, allValues);
  };
  
  return (
    <div style={{ padding: '24px' }}>
      <Typography>
        <Title level={2}>配置编辑器</Title>
        <Paragraph>
          在左侧编辑JSON配置，点击「应用配置」按钮后，右侧将实时预览生成的表单。
        </Paragraph>
      </Typography>
      
      <Row gutter={16}>
        <Col span={12}>
          <Card 
            title="JSON配置编辑器" 
            extra={
              <Space>
                <Button onClick={applyConfig} type="primary">应用配置</Button>
                <Button onClick={resetConfig}>重置</Button>
              </Space>
            }
            style={{ marginBottom: '16px' }}
          >
            {editorError && (
              <div style={{ color: 'red', marginBottom: '8px' }}>
                {editorError}
              </div>
            )}
            <Editor
              height="600px"
              defaultLanguage="json"
              value={editorContent}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                formatOnPaste: true,
                formatOnType: true,
                automaticLayout: true,
              }}
            />
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="表单预览">
            <DynamicForm
              config={parsedConfig}
              plugins={[storagePlugin, remoteDataPlugin]}
              onSubmit={handleSubmit}
              onValuesChange={handleValuesChange}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ConfigEditorPage;