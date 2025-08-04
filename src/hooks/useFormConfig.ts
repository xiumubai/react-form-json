import { useState, useEffect } from 'react';
import { FormConfig } from '../types';
import { ConfigParserFactory } from '../core/parser/ConfigParser';

interface UseFormConfigProps {
  config?: FormConfig | string;
  configUrl?: string;
  configType?: 'json' | 'yaml';
}

interface UseFormConfigResult {
  loading: boolean;
  config: FormConfig | null;
  error: Error | null;
}

/**
 * 自定义钩子，用于加载和解析表单配置
 * @param props 配置属性
 * @returns 加载状态、配置对象和错误信息
 */
export const useFormConfig = (props: UseFormConfigProps): UseFormConfigResult => {
  const { config, configUrl, configType } = props;
  const [loading, setLoading] = useState(false);
  const [parsedConfig, setParsedConfig] = useState<FormConfig | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      setError(null);

      try {
        // 如果直接提供了配置对象
        if (config && typeof config === 'object') {
          setParsedConfig(config as FormConfig);
          setLoading(false);
          return;
        }

        // 如果提供了配置字符串
        if (config && typeof config === 'string') {
          const parser = ConfigParserFactory.createParser(configType || 'auto', config);
          const parsedResult = parser.parse();
          setParsedConfig(parsedResult);
          setLoading(false);
          return;
        }

        // 如果提供了配置URL
        if (configUrl) {
          const response = await fetch(configUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch config: ${response.status} ${response.statusText}`);
          }

          const configText = await response.text();
          const parser = ConfigParserFactory.createParser(configType || 'auto', configText);
          const parsedResult = parser.parse();
          setParsedConfig(parsedResult);
        } else {
          throw new Error('No configuration provided');
        }
      } catch (err) {
        console.error('Error loading form config:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setParsedConfig(null);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [config, configUrl, configType]);

  return { loading, config: parsedConfig, error };
};