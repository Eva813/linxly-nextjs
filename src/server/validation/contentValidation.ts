/**
 * 後端 JSON 內容安全驗證工具
 * 專門用於 API Route 的 TipTap JSON 內容驗證和清理
 * 
 * @author PromptBear Backend Team
 * @version 1.0
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedJSON?: unknown;
}

/**
 * 驗證和清理 TipTap JSON 內容
 * 
 * @param contentJSON - 要驗證的 JSON 內容
 * @returns 驗證結果，包含是否有效和清理後的 JSON
 */
export function validateAndSanitizeContentJSON(contentJSON: unknown): ValidationResult {
  try {
    // 1. 基本類型檢查
    if (!contentJSON || typeof contentJSON !== 'object') {
      return {
        isValid: false,
        error: 'Content must be a valid object'
      };
    }

    // 2. 內容大小限制 (1MB)，防止 DoS 攻擊
    const jsonString = JSON.stringify(contentJSON);
    const maxSize = 1024 * 1024; // 1MB
    
    if (jsonString.length > maxSize) {
      return {
        isValid: false,
        error: 'Content too large (max 1MB)'
      };
    }

    // 3. 基本 TipTap 結構驗證
    const contentObj = contentJSON as Record<string, unknown>;
    if (!contentObj.type || contentObj.type !== 'doc') {
      return {
        isValid: false,
        error: 'Invalid document structure: must be TipTap doc format'
      };
    }

    if (!Array.isArray(contentObj.content)) {
      return {
        isValid: false,
        error: 'Invalid document structure: content must be an array'
      };
    }

    // 4. 節點深度限制，防止極深嵌套攻擊
    const maxDepth = 20;

    function validateDepth(node: unknown, depth: number): boolean {
      if (depth > maxDepth) {
        return false;
      }

      if (node && typeof node === 'object' && 'content' in node && Array.isArray((node as Record<string, unknown>).content)) {
        return ((node as Record<string, unknown>).content as unknown[]).every((child: unknown) => validateDepth(child, depth + 1));
      }

      return true;
    }

    if (!validateDepth(contentObj, 0)) {
      return {
        isValid: false,
        error: 'Content structure too deep (max 20 levels)'
      };
    }

    // 5. 節點類型白名單驗證
    const allowedNodeTypes = [
      'doc', 'paragraph', 'text', 'heading', 'bulletList', 'orderedList', 
      'listItem', 'blockquote', 'codeBlock', 'hardBreak',
      'formtext', 'formmenu' // PromptBear 自訂節點
    ];

    function validateNodeTypes(node: unknown): boolean {
      if (!node || typeof node !== 'object') {
        return true;
      }

      const nodeObj = node as Record<string, unknown>;
      if (nodeObj.type && typeof nodeObj.type === 'string' && !allowedNodeTypes.includes(nodeObj.type)) {
        return false;
      }

      if (nodeObj.content && Array.isArray(nodeObj.content)) {
        return nodeObj.content.every(validateNodeTypes);
      }

      return true;
    }

    if (!validateNodeTypes(contentObj)) {
      return {
        isValid: false,
        error: 'Invalid node type detected'
      };
    }

    // 6. 原型污染防護 + 深度清理
    const sanitizedJSON = sanitizeObjectDeep(contentObj);

    return {
      isValid: true,
      sanitizedJSON
    };

  } catch (error) {
    return {
      isValid: false,
      error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * 深度清理物件，移除原型污染和危險屬性
 * 
 * @param obj - 要清理的物件
 * @returns 清理後的安全物件
 */
function sanitizeObjectDeep(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObjectDeep);
  }

  // 創建新物件，避免修改原始物件
  const sanitized: Record<string, unknown> = {};

  const objRecord = obj as Record<string, unknown>;
  for (const key in objRecord) {
    // 只處理物件自有屬性，跳過原型鏈
    if (objRecord.hasOwnProperty(key)) {
      // 跳過危險的屬性名稱
      if (isDangerousProperty(key)) {
        continue;
      }

      // 遞歸清理值
      sanitized[key] = sanitizeObjectDeep(objRecord[key]);
    }
  }

  return sanitized;
}

/**
 * 檢查屬性名稱是否為危險屬性
 * 
 * @param propertyName - 屬性名稱
 * @returns 是否為危險屬性
 */
function isDangerousProperty(propertyName: string): boolean {
  const dangerousProperties = [
    '__proto__',
    'constructor',
    'prototype',
    '__defineGetter__',
    '__defineSetter__',
    '__lookupGetter__',
    '__lookupSetter__'
  ];

  return dangerousProperties.includes(propertyName);
}
