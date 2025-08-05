// 定義 Spec 裡面的欄位型別
export interface FieldSpec {
  priority: number
  description?: string
  placeholder: string
  type: string
  static?: boolean
  constant?: boolean
  options?: string | string[]
  multiple?: boolean
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
    value: string | boolean | string[] | null
  }>
}

// userAttrs 傳入的資料我們預期都是字串，因此採用 Partial<Record<... , string>>
export function buildFormData<T extends FormSpec>(
  spec: T,
  type: string,
  userAttrs: Partial<Record<keyof T["named"], string | string[] | boolean | null>>
): IBuiltFormData<T> {
  // 若 userAttrs 有對應的屬性，就使用其值，並且若值為 undefined 則用 null。 若沒有對應屬性，則使用預設的 placeholder（預設值為空字串）。
  const attributes = (Object.keys(spec.named)).map(key => ({
    name: key,
    value: Object.hasOwn(userAttrs, key)
      ? (userAttrs[key] ?? null)
      : spec.named[key].placeholder || "",
  }));

  return {
    type,
    spec,
    commandName: type,
    addon_id: null,
    icon_url: null,
    hasMatchingTokens: false,
    attributes,
  };
}
