/**
 * 函数表达式计算器
 * 用于处理表单中的函数表达式，如formatter和parser
 */

/**
 * 将字符串形式的函数转换为实际可执行的函数
 * @param functionStr 函数字符串，如 "value => `¥ ${value}`"
 * @returns 可执行的函数
 */
export const evaluateFunction = (functionStr: string): ((...args: any[]) => any) | null => {
  if (!functionStr || typeof functionStr !== 'string') {
    return null;
  }

  try {
    // 处理箭头函数格式
    if (functionStr.includes('=>')) {
      const arrowFnMatch = functionStr.match(/^\s*(?:\(([^)]+)\)|([^=>]+))\s*=>\s*(.+)/);
      if (arrowFnMatch) {
        const params = arrowFnMatch[1] || arrowFnMatch[2] || '';
        const body = arrowFnMatch[3] || '';
        
        // 检查函数体是否需要return语句
        const needsReturn = !body.trim().startsWith('{');
        const fnBody = needsReturn ? `return ${body}` : body;
        
        // 创建新函数
        return new Function(...params.split(',').map(p => p.trim()), fnBody);
      }
    }
    
    // 处理普通函数格式
    const fnMatch = functionStr.match(/^\s*function\s*\(([^)]*)\)\s*\{([\s\S]*)\}\s*$/);
    if (fnMatch) {
      const params = fnMatch[1] || '';
      const body = fnMatch[2] || '';
      return new Function(...params.split(',').map(p => p.trim()), body);
    }
    
    // 如果是简单表达式，尝试包装成函数
    return new Function('value', `return ${functionStr}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error evaluating function string:', error);
    return null;
  }
};