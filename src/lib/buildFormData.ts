// 定義 Spec 裡面的欄位型別
export interface FieldSpec {
  priority: number
  description: string
  placeholder: string
  type: string
  static?: boolean
  constant?: boolean
  // 如果有其他屬性，也可以擴充
}

// 定義整個 Spec 型別
export interface FormSpec {
  positional: number[]
  named: Record<string, FieldSpec>
}

// 定義最終組裝後的資料型別
export interface IBuiltFormData<T extends FormSpec> {
  type: string
  spec: T
  commandName: string
  addon_id: null
  icon_url: null
  hasMatchingTokens: boolean
  attributes: Array<{
    name: keyof T["named"]
    value: string
  }>
}

// userAttrs 傳入的資料我們預期都是字串，因此採用 Partial<Record<... , string>>
export function buildFormData<T extends FormSpec>(
  spec: T,
  type: string,
  userAttrs: Partial<Record<keyof T["named"], string>>
): IBuiltFormData<T> {
  const attributes = (Object.keys(spec.named) as string[]).map(key => ({
    name: key,
    // 如果 userAttrs 提供了，就用它，否則採用 placeholder，若 placeholder 沒有也以空字串作 fallback
    value: userAttrs[key] || spec.named[key].placeholder || ""
  }))
  return {
    type,
    spec,
    commandName: type,
    addon_id: null,
    icon_url: null,
    hasMatchingTokens: false,
    attributes,
  }
}