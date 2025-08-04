import React from 'react';
import { Typography, Card, Tabs, Button } from 'antd';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

// 导入配置文件
import userFormConfigRaw from '../configs/examples/user-form.json?raw';
import productFormConfigRaw from '../configs/examples/product-form.yaml?raw';

const { Title, Paragraph } = Typography;

const ConfigDisplayPage: React.FC = () => {
  // 配置已经是原始字符串
  const productFormYaml = productFormConfigRaw;
  const userFormJson = userFormConfigRaw;

  // 复制内容到剪贴板
  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
      .then(() => {
        alert('配置已复制到剪贴板');
      })
      .catch(err => {
        console.error('复制失败:', err);
      });
  };

  return (
    <div style={{ padding: '24px' }}>
      <Typography>
        <Title level={2}>表单配置展示</Title>
        <Paragraph>
          这里展示了用户表单和产品表单的完整配置，您可以查看和复制这些配置。
        </Paragraph>
      </Typography>

      <Tabs
        defaultActiveKey="user"
        items={[
          {
            key: 'user',
            label: '用户表单配置 (JSON)',
            children: (
              <Card 
                title="用户表单配置" 
                extra={
                  <Button onClick={() => copyToClipboard(userFormJson)} type="primary">
                    复制配置
                  </Button>
                }
              >
                <SyntaxHighlighter language="json" style={vscDarkPlus} showLineNumbers={true}>
                  {userFormJson}
                </SyntaxHighlighter>
              </Card>
            ),
          },
          {
            key: 'product',
            label: '产品表单配置 (YAML)',
            children: (
              <Card 
                title="产品表单配置" 
                extra={
                  <Button onClick={() => copyToClipboard(productFormYaml)} type="primary">
                    复制配置
                  </Button>
                }
              >
                <SyntaxHighlighter language="yaml" style={vscDarkPlus} showLineNumbers={true}>
                  {productFormYaml}
                </SyntaxHighlighter>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
};

export default ConfigDisplayPage;