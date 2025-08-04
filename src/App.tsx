import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import ExamplePage from './pages/ExamplePage';
import ProductFormPage from './pages/ProductFormPage';
import ConfigEditorPage from './pages/ConfigEditorPage';
import ConfigDisplayPage from './pages/ConfigDisplayPage';

// 注意：mock API已移至ExamplePage组件中

const { Header, Content, Sider } = Layout;

const App: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState<string>('1');
  
  // 定义菜单项
  const menuItems: MenuProps['items'] = [
    {
      key: '1',
      label: '用户表单示例',
    },
    {
      key: '2',
      label: '产品表单示例',
    },
    {
      key: '3',
      label: '配置编辑器',
    },
    {
      key: '4',
      label: '配置展示',
    },
  ];
  
  // 根据选择的菜单项渲染对应的页面组件
  const renderContent = () => {
    switch (selectedKey) {
      case '1':
        return <ExamplePage />;
      case '2':
        return <ProductFormPage />;
      case '3':
        return <ConfigEditorPage />;
      case '4':
        return <ConfigDisplayPage />;
      default:
        return <ExamplePage />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ position: 'fixed', zIndex: '2', width: '100%', display: 'flex', alignItems: 'center' }}>
        <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
          React Form JSON
        </div>
      </Header>
      <Layout style={{ paddingTop: '64px' }}>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            style={{ height: '100%', borderRight: 0 }}
            onClick={({ key }) => setSelectedKey(key as string)}
            items={menuItems}
          />
        </Sider>
        <Layout style={{ padding: '0' }}>
          <Content>
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default App;