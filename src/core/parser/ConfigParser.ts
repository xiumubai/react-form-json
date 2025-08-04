import yaml from 'js-yaml';
import { FormConfig, ValidationResult } from '../../types';

/**
 * 配置解析器接口
 */
export interface ConfigParser {
  /**
   * 解析配置字符串
   * @param config 配置字符串
   * @returns 解析后的表单配置对象
   */
  parse(config: string): FormConfig;

  /**
   * 验证配置对象
   * @param config 表单配置对象
   * @returns 验证结果
   */
  validate(config: FormConfig): ValidationResult;
}

/**
 * JSON配置解析器
 */
export class JsonConfigParser implements ConfigParser {
  /**
   * 解析JSON配置字符串
   * @param config JSON配置字符串
   * @returns 解析后的表单配置对象
   */
  parse(config: string): FormConfig {
    try {
      return JSON.parse(config);
    } catch (error: any) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }
  }

  /**
   * 验证JSON配置对象
   * @param config 表单配置对象
   * @returns 验证结果
   */
  validate(config: FormConfig): ValidationResult {
    const errors: string[] = [];

    // 验证必填字段
    if (!config.formId) {
      errors.push('formId is required');
    }

    if (!config.fields || !Array.isArray(config.fields) || config.fields.length === 0) {
      errors.push('fields must be a non-empty array');
    } else {
      // 验证字段配置
      config.fields.forEach((field, index) => {
        if (!field.name) {
          errors.push(`Field at index ${index} must have a name`);
        }
        if (!field.type) {
          errors.push(`Field '${field.name}' must have a type`);
        }
        
        // 验证嵌套字段
        if (field.type === 'group' && (!field.fields || !Array.isArray(field.fields) || field.fields.length === 0)) {
          errors.push(`Group field '${field.name}' must have non-empty fields array`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}

/**
 * YAML配置解析器
 */
export class YamlConfigParser implements ConfigParser {
  /**
   * 解析YAML配置字符串
   * @param config YAML配置字符串
   * @returns 解析后的表单配置对象
   */
  parse(config: string): FormConfig {
    try {
      return yaml.load(config) as FormConfig;
    } catch (error: any) {
      throw new Error(`Invalid YAML format: ${error.message}`);
    }
  }

  /**
   * 验证YAML配置对象
   * @param config 表单配置对象
   * @returns 验证结果
   */
  validate(config: FormConfig): ValidationResult {
    // 复用JSON配置验证逻辑
    const jsonParser = new JsonConfigParser();
    return jsonParser.validate(config);
  }
}

/**
 * 配置解析器工厂
 */
export class ConfigParserFactory {
  /**
   * 创建配置解析器
   * @param type 配置类型 ('json' | 'yaml')
   * @returns 配置解析器实例
   */
  static createParser(type: 'json' | 'yaml'): ConfigParser {
    switch (type) {
      case 'json':
        return new JsonConfigParser();
      case 'yaml':
        return new YamlConfigParser();
      default:
        throw new Error(`Unsupported config type: ${type}`);
    }
  }

  /**
   * 自动检测配置类型并解析
   * @param config 配置字符串
   * @param type 配置类型 ('json' | 'yaml')，如果提供则使用指定类型，否则自动检测
   * @returns 解析后的表单配置对象
   */
  static parseConfig(config: string, type?: 'json' | 'yaml'): FormConfig {
    let parser: ConfigParser;

    if (type) {
      // 如果指定了类型，使用指定的解析器
      parser = this.createParser(type);
    } else {
      // 尝试判断配置类型
      const trimmedConfig = config.trim();
      if (trimmedConfig.startsWith('{') || trimmedConfig.startsWith('[')) {
        parser = new JsonConfigParser();
      } else {
        parser = new YamlConfigParser();
      }
    }

    const parsedConfig = parser.parse(config);
    const validationResult = parser.validate(parsedConfig);

    if (!validationResult.valid) {
      throw new Error(`Invalid form config: ${validationResult.errors?.join(', ')}`);
    }

    return parsedConfig;
  }
}