import { useState, useRef, useMemo, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { NodeSelection } from 'prosemirror-state';
import { DropdownEditInfo, TextInputEditInfo } from '@/types/prompt';
import { formTextSpec } from "@/lib/specs/formTextSpec";
import { formMenuSpec } from "@/lib/specs/formMenuSpec";
import { buildFormData } from '@/lib/buildFormData';

export const useEditorLogic = () => {
  const editorRef = useRef<Editor | null>(null);
  
  // 對話框狀態
  const [textInputEditInfo, setTextInputEditInfo] = useState<TextInputEditInfo | null>(null);
  const [dropdownEditInfo, setDropdownEditInfo] = useState<DropdownEditInfo | null>(null);
  const [isTextDialogOpen, setIsTextDialogOpen] = useState(false);
  const [isDropdownDialogOpen, setIsDropdownDialogOpen] = useState(false);
  const [isEditPanelVisible, setIsEditPanelVisible] = useState(false);

  // 取得目前的編輯資訊
  const activeEditInfo = useMemo(() => {
    const editInfoList = [textInputEditInfo, dropdownEditInfo];
    return editInfoList.find(
      (editInfo) => editInfo?.type === "formtext" || editInfo?.type === "formmenu"
    ) || null;
  }, [textInputEditInfo, dropdownEditInfo]);

  // 插入文字欄位
  const handleInsertTextFieldClick = useCallback(() => {
    setTextInputEditInfo(null);
    setIsTextDialogOpen(true);
  }, []);

  // 插入選單欄位
  const handleInsertMenuFieldClick = useCallback(() => {
    setDropdownEditInfo(null);
    setIsDropdownDialogOpen(true);
  }, []);

  // 處理文字欄位點擊
  const handleFormTextNodeClick = useCallback(({
    pos,
    name,
    default: defaultValue,
  }: {
    pos: number;
    name: string;
    default: string;
  }) => {
    setTextInputEditInfo({ type: "formtext", pos, name, default: defaultValue });
    setIsEditPanelVisible(true);
  }, []);

  // 處理選單欄位點擊
  const handleFormMenuNodeClick = useCallback(({
    pos,
    name,
    default: defaultValue,
    options,
    multiple,
  }: {
    pos: number;
    name: string;
    default: string | string[];
    options: string[];
    multiple: boolean;
  }) => {
    setTextInputEditInfo(null);
    setDropdownEditInfo({
      type: "formmenu",
      pos,
      name,
      default: defaultValue,
      options: options,
      multiple,
    });
    setIsEditPanelVisible(true);
  }, []);

  // 編輯器點擊
  const handleEditorClick = useCallback(() => {
    setIsEditPanelVisible(false);
  }, []);

  // 插入文字欄位的處理函式
  const handleTextFieldInsert = useCallback((name: string, defaultValue: string) => {
    const editor = editorRef.current;
    if (!editor || textInputEditInfo) return null;

    editor
      .chain()
      .focus()
      .insertContent({
        type: "formtext",
        attrs: {
          promptData: buildFormData(formTextSpec, 'formtext', {
            name: name,
            default: defaultValue,
          }),
        },
      })
      .run();
    
    setIsTextDialogOpen(false);
    
    // 返回新內容
    return editor.getHTML();
  }, [textInputEditInfo]);

  // 插入下拉選單的處理函式
  const handleDropDownMenuInsert = useCallback((
    name: string,
    values: string[],
    selectedValues: string | string[],
    multiple: boolean
  ) => {
    const editor = editorRef.current;
    if (!editor || dropdownEditInfo) return null;

    editor
      .chain()
      .focus()
      .insertContent({
        type: "formmenu",
        attrs: {
          promptData: buildFormData(formMenuSpec, 'formmenu', {
            name: name,
            options: values,
            multiple: multiple,
            default: selectedValues,
          }),
        },
      })
      .run();

    setIsDropdownDialogOpen(false);
    
    // 返回新內容
    return editor.getHTML();
  }, [dropdownEditInfo]);

  // 處理輸入變更的處理函式
  const handleTextInputChange = useCallback((
    updates: { [key: string]: string | string[] | boolean | null }
  ) => {
    const editor = editorRef.current;
    if (!editor) return null;

    if (textInputEditInfo) {
      const updatedEditInfo: TextInputEditInfo = {
        ...textInputEditInfo,
        ...updates,
      };
      setTextInputEditInfo(updatedEditInfo);
      
      const { pos } = textInputEditInfo;
      const { doc } = editor.state;
      const nodeSelection = NodeSelection.create(doc, pos);
      editor.view.dispatch(editor.state.tr.setSelection(nodeSelection));
      
      Object.entries(updates).forEach(([key, newValue]) => {
        editor
          .chain()
          .updateAttributes("formtext", {
            promptData: buildFormData(formTextSpec, 'formtext', {
              name: key === "name" ? newValue as string : updatedEditInfo.name,
              default: key === "default" ? newValue as string : updatedEditInfo.default,
            }),
          })
          .run();
      });
    } else if (dropdownEditInfo) {
      const updatedEditInfo = {
        ...dropdownEditInfo,
        ...updates,
      };
      setDropdownEditInfo(updatedEditInfo);
      
      const { pos } = dropdownEditInfo;
      const { doc } = editor.state;
      const nodeSelection = NodeSelection.create(doc, pos);
      editor.view.dispatch(editor.state.tr.setSelection(nodeSelection));
      
      Object.entries(updates).forEach(([key, newValue]) => {
        editor
          .chain()
          .updateAttributes("formmenu", {
            promptData: buildFormData(formMenuSpec, 'formmenu', {
              name: key === "name" ? newValue as string : updatedEditInfo.name,
              options: key === "options" ? newValue : updatedEditInfo.options,
              multiple: updatedEditInfo.multiple,
              default: key === "default" ? newValue : updatedEditInfo.default,
            }),
          })
          .run();
      });
    }
    
    // 返回新內容
    return editor.getHTML();
  }, [textInputEditInfo, dropdownEditInfo]);

  return {
    editorRef,
    
    textInputEditInfo,
    dropdownEditInfo,
    isTextDialogOpen,
    isDropdownDialogOpen,
    isEditPanelVisible,
    activeEditInfo,
    
    // 設定狀態
    setIsTextDialogOpen,
    setIsDropdownDialogOpen,
    setIsEditPanelVisible,
    
    // 事件處理器
    handleInsertTextFieldClick,
    handleInsertMenuFieldClick,
    handleFormTextNodeClick,
    handleFormMenuNodeClick,
    handleEditorClick,
    handleTextFieldInsert,
    handleDropDownMenuInsert,
    handleTextInputChange,
  };
};
