import { Rule } from 'antd/es/form';
import { ValidationRule } from '../../types';

/**
 * 校验规则注册器
 * 用于管理和注册表单校验规则
 */
export class ValidationRuleRegistry {
  private static instance: ValidationRuleRegistry;
  private rules: Record<string, ValidationRule> = {};

  /**
   * 私有构造函数，防止外部直接实例化
   */
  private constructor() {
    this.registerBuiltInRules();
  }

  /**
   * 获取单例实例
   * @returns ValidationRuleRegistry实例
   */
  public static getInstance(): ValidationRuleRegistry {
    if (!ValidationRuleRegistry.instance) {
      ValidationRuleRegistry.instance = new ValidationRuleRegistry();
    }
    return ValidationRuleRegistry.instance;
  }

  /**
   * 注册校验规则
   * @param name 规则名称
   * @param rule 校验规则
   */
  public register(name: string, rule: ValidationRule): void {
    this.rules[name] = rule;
  }

  /**
   * 获取校验规则
   * @param name 规则名称
   * @returns 校验规则或undefined
   */
  public getRule(name: string): ValidationRule | undefined {
    return this.rules[name];
  }

  /**
   * 注册内置校验规则
   */
  private registerBuiltInRules(): void {
    // 邮箱校验
    this.register('email', {
      type: 'email',
      validator: (rule, value) => {
        if (!value) return Promise.resolve();
        const emailRegex = /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/;
        if (emailRegex.test(value)) {
          return Promise.resolve();
        }
        return Promise.reject(new Error('请输入有效的邮箱地址'));
      }
    });

    // 手机号校验
    this.register('phone', {
      validator: (rule, value) => {
        if (!value) return Promise.resolve();
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (phoneRegex.test(value)) {
          return Promise.resolve();
        }
        return Promise.reject(new Error('请输入有效的手机号码'));
      }
    });

    // URL校验
    this.register('url', {
      type: 'url',
      validator: (rule, value) => {
        if (!value) return Promise.resolve();
        try {
          new URL(value);
          return Promise.resolve();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_) {
          return Promise.reject(new Error('请输入有效的URL地址'));
        }
      }
    });

    // 身份证号校验
    this.register('idcard', {
      validator: (rule, value) => {
        if (!value) return Promise.resolve();
        const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
        if (idCardRegex.test(value)) {
          return Promise.resolve();
        }
        return Promise.reject(new Error('请输入有效的身份证号码'));
      }
    });

    // 数字校验
    this.register('number', {
      type: 'number',
      validator: (rule, value) => {
        if (value === undefined || value === null || value === '') return Promise.resolve();
        if (!isNaN(Number(value))) {
          return Promise.resolve();
        }
        return Promise.reject(new Error('请输入有效的数字'));
      }
    });

    // 整数校验
    this.register('integer', {
      validator: (rule, value) => {
        if (value === undefined || value === null || value === '') return Promise.resolve();
        if (Number.isInteger(Number(value))) {
          return Promise.resolve();
        }
        return Promise.reject(new Error('请输入有效的整数'));
      }
    });

    // 正数校验
    this.register('positive', {
      validator: (rule, value) => {
        if (value === undefined || value === null || value === '') return Promise.resolve();
        if (!isNaN(Number(value)) && Number(value) > 0) {
          return Promise.resolve();
        }
        return Promise.reject(new Error('请输入大于0的数字'));
      }
    });

    // 非负数校验
    this.register('non-negative', {
      validator: (rule, value) => {
        if (value === undefined || value === null || value === '') return Promise.resolve();
        if (!isNaN(Number(value)) && Number(value) >= 0) {
          return Promise.resolve();
        }
        return Promise.reject(new Error('请输入大于等于0的数字'));
      }
    });
  }
}

/**
 * 处理校验规则
 * @param rules 配置中的校验规则
 * @returns Ant Design表单校验规则
 */
export const processValidationRules = (rules: any[] = []): Rule[] => {
  const registry = ValidationRuleRegistry.getInstance();

  return rules.map(rule => {
    // 如果是内置规则类型
    if (rule.type && registry.getRule(rule.type)) {
      const registeredRule = registry.getRule(rule.type)!;
      // 合并规则配置
      return { ...registeredRule, message: rule.message || registeredRule.message };
    }
    return rule;
  });
};

/**
 * 注册自定义校验规则
 * @param name 规则名称
 * @param rule 校验规则
 */
export const registerCustomValidationRule = (name: string, rule: ValidationRule): void => {
  const registry = ValidationRuleRegistry.getInstance();
  registry.register(name, rule);
};