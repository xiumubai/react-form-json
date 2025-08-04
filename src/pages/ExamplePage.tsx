import React, { useState } from 'react';
import { Card, Radio, Space, Divider, message, Typography } from 'antd';
import DynamicForm from '../components/DynamicForm/DynamicForm';
import { StoragePlugin } from '../core/plugins/StoragePlugin';
import { RemoteDataPlugin } from '../core/plugins/RemoteDataPlugin';

// 注意：模拟API响应和配置导入已移至index.tsx

const { Title, Paragraph } = Typography;

const ExamplePage: React.FC = () => {
  // 配置源类型（本地/远程）
  const [configSource, setConfigSource] = useState<'local' | 'remote'>('local');
  
  // 配置格式（JSON/YAML）
  const [configFormat, setConfigFormat] = useState<'json' | 'yaml'>('json');
  
  // 创建插件实例
  const storagePlugin = new StoragePlugin({
    storageType: 'localStorage',
    key: 'example-form-data',
    autoLoad: true,
    autoSave: true,
    excludeFields: ['password', 'confirmPassword'],
    expireTime: 24 * 60 * 60 * 1000 // 24小时
  });
  
  const remoteDataPlugin = new RemoteDataPlugin();
  
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
        <Title level={2}>动态表单示例</Title>
        <Paragraph>
          这个示例展示了如何使用基于JSON/YAML配置的动态表单组件。您可以切换不同的配置源和格式来查看效果。
        </Paragraph>
      </Typography>
      
      <Space direction="vertical" style={{ width: '100%', marginBottom: '24px' }}>
        <Card title="配置选项" size="small">
          <Space>
            <Radio.Group 
              value={configSource} 
              onChange={e => setConfigSource(e.target.value)}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value="local">本地配置</Radio.Button>
              <Radio.Button value="remote">远程配置</Radio.Button>
            </Radio.Group>
            
            <Divider type="vertical" />
            
            <Radio.Group 
              value={configFormat} 
              onChange={e => setConfigFormat(e.target.value)}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value="json">JSON</Radio.Button>
              <Radio.Button value="yaml">YAML</Radio.Button>
            </Radio.Group>
          </Space>
        </Card>
      </Space>
      
      <Card>
        <DynamicForm
          // 根据选择的配置源和格式设置配置
          configUrl={`/api/config?format=${configFormat}`}
          configType={configFormat}
          plugins={[storagePlugin, remoteDataPlugin]}
          onSubmit={handleSubmit}
          onValuesChange={handleValuesChange}
        />
      </Card>
      
      <div style={{ marginTop: '24px' }}>
        <Typography>
          <Paragraph type="secondary">
            注意：这个示例使用了模拟的API响应。在实际应用中，您需要替换为真实的API端点。
          </Paragraph>
        </Typography>
      </div>
    </div>
  );
};

export default ExamplePage;