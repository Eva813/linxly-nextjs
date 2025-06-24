'use client';
import { usePromptStore } from "@/stores/prompt";
import { Input } from "@/components/ui/input";
import { FaTag } from "react-icons/fa6";
import { FaKeyboard } from "react-icons/fa6";
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import TipTapEditor from '@/app/components/tipTapEditor';
import Sidebar from '@/app/prompts/prompt/[promptId]/editorSidebar'
import InsertTextFieldDialog from '@/app/prompts/prompt/[promptId]/InsertTextFieldDialog'
import InsertDropdownMenuDialog from '@/app/prompts/prompt/[promptId]/InsertDropDownMenuDialog';
import { Editor } from '@tiptap/react'
import { NodeSelection } from 'prosemirror-state'
import EditPanel from './editPanel'
import { formTextSpec } from "@/lib/specs/formTextSpec";
import { formMenuSpec } from "@/lib/specs/formMenuSpec";
import { buildFormData, IBuiltFormData } from '@/lib/buildFormData'
import { DropdownEditInfo, TextInputEditInfo, EditInfo } from '@/types/prompt'
import EditViewButtons, { Mode } from "@/app/prompts/components/editViewButtons";
import PreviewPrompt from "@/app/prompts/components/previewPrompt";
import TryItOutPopup from './tryItOutPopup';
import ShortcutErrorAlert  from "@/app/prompts/components/shortcutErrorAlert";
import { useCurrentPrompt } from '@/lib/useCurrentPrompt';
import { Folder } from '@/types/prompt';
import { deepEqual } from '@/lib/utils/deepEqual';
import { useAutoSave } from '@/hooks/useAutoSave';
import SaveStatusIndicator from '@/components/ui/saveStatusIndicator';

interface PromptDataMapping {
  formtext: IBuiltFormData<typeof formTextSpec>;
  formmenu: IBuiltFormData<typeof formMenuSpec>;
}
interface PromptPageProps {
  params: {
    promptId: string;
  };
}

interface ShortcutError {
  conflictingShortcut: string;
  message: string;
}

type UpdateHandler<T extends EditInfo> = {
  getAttributes: (
    editInfo: T,
    key: keyof T,
    newValue: string | boolean | string[] | null
  ) => {
    promptData: PromptDataMapping[T["type"]];
  };
  getNodeType: () => T["type"];
};

const originalDispatchMap = new WeakMap<EventTarget, (event: Event) => boolean>();

// 防止 Chrome 擴充功能干擾的工具函式
export const preventExtensionInterference = (
  element: HTMLInputElement | HTMLTextAreaElement
): (() => void) | void => {
  if (!element) return;

  const criticalEventTypes = new Set(['input', 'change', 'keydown', 'keyup', 'paste']);
  const listenerOptions: AddEventListenerOptions = { capture: true, passive: false };

  const blockExtensionEvents = (e: Event) => {
    if (!criticalEventTypes.has(e.type)) return;

    if (!e.isTrusted) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }

    if (e.type === 'input') {
      requestAnimationFrame(() => {
        e.stopPropagation();
        e.stopImmediatePropagation();
      });
    }
  };

  for (const type of criticalEventTypes) {
    element.addEventListener(type, blockExtensionEvents, listenerOptions);
  }

  // Patch dispatchEvent（僅一次）
  if (!originalDispatchMap.has(element)) {
    const originalDispatch = element.dispatchEvent.bind(element);
    originalDispatchMap.set(element, originalDispatch);

    element.dispatchEvent = function (event: Event): boolean {
      if (!event.isTrusted && criticalEventTypes.has(event.type)) {
        return false;
      }
      return originalDispatch(event);
    };
  }

  // 回傳清理函式
  return () => {
    for (const type of criticalEventTypes) {
      element.removeEventListener(type, blockExtensionEvents, listenerOptions);
    }

    const originalDispatch = originalDispatchMap.get(element);
    if (originalDispatch) {
      element.dispatchEvent = originalDispatch;
      originalDispatchMap.delete(element);
    }
  };
};

const PromptPage = ({ params }: PromptPageProps) => {
  const { promptId } = params;
  const { folders, updatePrompt } = usePromptStore();
  const { prompt: currentPrompt } = useCurrentPrompt(promptId);

  const [name, setName] = useState("");
  const [shortcut, setShortcut] = useState("");
  const [content, setContent] = useState("");
  const [shortcutError, setShortcutError] = useState<ShortcutError | null>(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const tryItOutButtonRef = useRef<HTMLButtonElement>(null);
  const shortcutInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const nameCleanupRef = useRef<(() => void) | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const changeDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // 儲存初始值用於比較
  const [initialValues, setInitialValues] = useState({
    name: "",
    shortcut: "",
    content: ""
  });

  // 自動儲存邏輯
  const autoSaveHandler = useCallback(async () => {
    if (!currentPrompt) return;

    const updatedPrompt = {
      ...currentPrompt,
      name,
      shortcut,
      content,
    };

    try {
      await updatePrompt(promptId, updatedPrompt);
      
      // 儲存成功後更新初始值
      setInitialValues({
        name,
        shortcut,
        content
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("儲存時發生錯誤:", error);
      throw error;
    }
  }, [currentPrompt, name, shortcut, content, promptId, updatePrompt]);

  const { triggerAutoSave } = useAutoSave({
    onSave: autoSaveHandler,
    delay: 2000,
    enabled: hasUnsavedChanges,
    promptId
  });


  // 透過 ref 持有 editor 實例
  const editorRef = useRef<Editor | null>(null);
  // 對話框相關
  const [textInputEditInfo, setTextInputEditInfo] =
    useState<TextInputEditInfo | null>(null);
  const [dropdownEditInfo, setDropdownEditInfo] =
    useState<DropdownEditInfo | null>(null);
  const [isTextDialogOpen, setIsTextDialogOpen] = useState(false);
  const [isDropdownDialogOpen, setIsDropdownDialogOpen] = useState(false);
  const [isEditPanelVisible, setIsEditPanelVisible] = useState(false);
  const [mode, setMode] = useState<Mode>("edit");
  // 移動裝置工具面板開關狀態
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  // 手機版面板關閉動畫狀態
  const [isMobilePanelClosing, setIsMobilePanelClosing] = useState(false);

  // 按下 sidebar 的 TextField
  const handleInsertTextFieldClick = useCallback(() => {
    setTextInputEditInfo(null);
    setIsTextDialogOpen(true);
  }, []);
  const handleInsertMenuFieldClick = useCallback(() => {
    setDropdownEditInfo(null); // 清除編輯狀態
    setIsDropdownDialogOpen(true);
  }, []);

  // 取得目前的編輯資訊
  const getActiveEditInfo = (
    textInputEditInfo: TextInputEditInfo | null,
    dropdownEditInfo: DropdownEditInfo | null
  ): EditInfo | null => {
    const editInfoList = [textInputEditInfo, dropdownEditInfo];
    return (
      editInfoList.find(
        (editInfo) =>
          editInfo?.type === "formtext" || editInfo?.type === "formmenu"
      ) || null
    );
  };

  const activeEditInfo = useMemo(
    () => getActiveEditInfo(textInputEditInfo, dropdownEditInfo),
    [textInputEditInfo, dropdownEditInfo]
  );

  useEffect(() => {
    if (currentPrompt) {
      setName(currentPrompt.name);
      setShortcut(currentPrompt.shortcut || "");
      setContent(currentPrompt.content);
      
      setInitialValues({
        name: currentPrompt.name,
        shortcut: currentPrompt.shortcut || "",
        content: currentPrompt.content
      });
      
      setHasUnsavedChanges(false);
    }
  }, [currentPrompt]);

  // 檢查是否有未儲存的變更並觸發自動儲存
  useEffect(() => {
    if (changeDetectionTimeoutRef.current) {
      clearTimeout(changeDetectionTimeoutRef.current);
    }

    // 延遲 300ms 後檢查變更
    changeDetectionTimeoutRef.current = setTimeout(() => {
      const currentValues = {
        name,
        shortcut,
        content
      };
      
      const hasChanges = !deepEqual(currentValues, initialValues);
      
      // 防止初始載入時觸發
      if (hasChanges && currentPrompt) {
        setHasUnsavedChanges(true);
        triggerAutoSave();
      } else {
        setHasUnsavedChanges(false);
      }
    }, 300);

    return () => {
      if (changeDetectionTimeoutRef.current) {
        clearTimeout(changeDetectionTimeoutRef.current);
      }
    };
  }, [name, shortcut, content, initialValues, triggerAutoSave, currentPrompt]);

  // 保護 shortcut input 免受擴充功能干擾
  const blockDocumentInputHandler = useCallback((e: Event) => {
    const shortcutInput = shortcutInputRef.current;
    const target = e.target as HTMLElement;

    if (!shortcutInput || !target) return;
    if (target === shortcutInput) {
      console.log('阻止 document 級 input 事件');
      e.stopImmediatePropagation();
      e.stopPropagation();
      e.preventDefault();
    }
  }, []);

  // 防護 name input 免受擴充功能干擾
  const blockNameDocumentInputHandler = useCallback((e: Event) => {
    const nameInput = nameInputRef.current;
    const target = e.target as HTMLElement;

    if (!nameInput || !target) return;
    if (target === nameInput) {
      console.log('阻止 name document 級 input 事件');
      e.stopImmediatePropagation();
      e.stopPropagation();
      e.preventDefault();
    }
  }, []);

  useEffect(() => {
    const shortcutInput = shortcutInputRef.current;
    if (!shortcutInput) return;

    if (cleanupRef.current) {
      cleanupRef.current();
    }

    // 核心防護邏輯：阻止偽造事件
    const preventCleanup = preventExtensionInterference(shortcutInput);

    // 統一的事件選項配置
    const eventOptions = { 
      capture: true, 
      passive: false 
    } as const;

    // 條件式文件層級事件攔截
    document.addEventListener('input', blockDocumentInputHandler, eventOptions);

    // 建立清除函式
    const cleanup = () => {
      if (preventCleanup) preventCleanup();
      document.removeEventListener('input', blockDocumentInputHandler, eventOptions);
    };

    cleanupRef.current = cleanup;

    return cleanup;
  }, [blockDocumentInputHandler]);

  // 防護 name input 免受擴充功能干擾
  useEffect(() => {
    const nameInput = nameInputRef.current;
    if (!nameInput) return;

    if (nameCleanupRef.current) {
      nameCleanupRef.current();
    }

    // 核心防護邏輯：阻止偽造事件
    const preventCleanup = preventExtensionInterference(nameInput);

    // 統一的事件選項配置
    const eventOptions = { 
      capture: true, 
      passive: false 
    } as const;

    // 條件式文件層級事件攔截
    document.addEventListener('input', blockNameDocumentInputHandler, eventOptions);

    // 建立清除函式
    const cleanup = () => {
      if (preventCleanup) preventCleanup();
      document.removeEventListener('input', blockNameDocumentInputHandler, eventOptions);
    };

    nameCleanupRef.current = cleanup;

    return cleanup;
  }, [blockNameDocumentInputHandler]);

  // 組件卸載時確保清除
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      if (nameCleanupRef.current) {
        nameCleanupRef.current();
        nameCleanupRef.current = null;
      }
    };
  }, []);

  // 當用戶在編輯器裡點擊自訂 Node
  const handleFormTextNodeClick = ({
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
  };

  const handleEditorClick = () => {
    setIsEditPanelVisible(false);
  };

  const handleFormMenuNodeClick = ({
    pos,
    name,
    default: defaultValue,  // 這裡預期收到的是 default（由 FormMenuNode 回呼轉換）
    options,
    multiple,
  }: {
    pos: number;
    name: string;
    default: string | string[];
    options: string[]; // 傳入的是逗號分隔的字串
    multiple: boolean;
  }) => {
    setTextInputEditInfo(null);
    // 將 options 轉成陣列
    setDropdownEditInfo({
      type: "formmenu",
      pos,
      name,
      default: defaultValue,
      options: options,
      multiple,
    });
    setIsEditPanelVisible(true);
  };

  const handleTextFieldInsert = (name: string, defaultValue: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    if (!textInputEditInfo) {
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
      setContent(editor.getHTML());
      setIsTextDialogOpen(false);
    }
  };

  const handleDropDownMenuInsert = (
    name: string,
    values: string[],
    selectedValues: string | string[],
    multiple: boolean
  ) => {
    const editor = editorRef.current;
    if (!editor) return;
    if (!dropdownEditInfo) {
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
    }

    setContent(editor.getHTML());
    setIsDropdownDialogOpen(false);
    // setDropdownEditInfo(null);
  };


  const isConflictingShortcut = (
    newShortcut: string,
    promptId: string,
    folders: Folder[]
  ): { conflict: boolean; shortcut?: string } => {
    const allOtherShortcuts = folders
      .flatMap(folder => folder.prompts)
      .filter(p => p.id !== promptId);

    for (const prompt of allOtherShortcuts) {
      const existingShortcut = prompt.shortcut ?? "";
      // 完全相符
      if (newShortcut === existingShortcut) {
        return { conflict: true, shortcut: existingShortcut };
      }
      // 部分重疊 (prefix)
      if (
        newShortcut.length > 0 &&
        existingShortcut.length > 0 &&
        (existingShortcut.startsWith(newShortcut) || newShortcut.startsWith(existingShortcut))
      ) {
        return { conflict: true, shortcut: existingShortcut };
      }
    }

    return { conflict: false };
  };

  const handleShortcutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleShortcutChange 觸發:', e.target.value);
    
    // 確保事件是由用戶觸發的，阻止擴充功能的假事件
    if (!e.isTrusted) {
      console.log('阻止非可信事件');
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // 確保目標元素是我們的 shortcut input
    const target = e.target as HTMLInputElement;
    if (target !== shortcutInputRef.current) {
      console.log('目標元素不匹配');
      return;
    }

    const newShortcut = e.target.value;
    console.log('設定新 shortcut:', newShortcut);
    setShortcut(newShortcut);

    const trimmedShortcut = newShortcut.trim();
    if (!trimmedShortcut) {
      setShortcutError(null);
      return;
    }

    const { conflict, shortcut } = isConflictingShortcut(trimmedShortcut, promptId, folders);

    if (conflict && shortcut) {
      setShortcutError({
        conflictingShortcut: shortcut,
        message: "Please choose a unique shortcut."
      });
    } else {
      setShortcutError(null);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleNameChange 觸發:', e.target.value);
    
    // 確保事件是由用戶觸發的，阻止擴充功能的假事件
    if (!e.isTrusted) {
      console.log('阻止非可信事件');
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // 確保目標元素是我們的 name input
    const target = e.target as HTMLInputElement;
    if (target !== nameInputRef.current) {
      console.log('目標元素不匹配');
      return;
    }

    const newName = e.target.value;
    console.log('設定新 name:', newName);
    setName(newName);
  };

  const updateHandlers: {
    formtext: UpdateHandler<TextInputEditInfo>;
    formmenu: UpdateHandler<DropdownEditInfo>;
  } = {
    formtext: {
      getAttributes: (editInfo, key, newValue) => ({
        promptData: buildFormData(formTextSpec, 'formtext', {
          name: key === "name" ? newValue as string : editInfo.name,
          default: key === "default" ? newValue as string : editInfo.default,
        }),
      }),
      getNodeType: () => "formtext",
    },
    formmenu: {
      getAttributes: (editInfo, key, newValue) => (
        console.log('editInfo change ', key, newValue),
        {
          promptData: buildFormData(formMenuSpec, 'formmenu', {
            name: key === "name" ? newValue as string : editInfo.name,
            options: key === "options" ? newValue : editInfo.options,
            multiple: editInfo.multiple,
            default: key === "default" ? newValue : editInfo.default,
          }),
        }),
      getNodeType: () => "formmenu",
    },
  };

  const handleTextInputChange = (updates: { [key: string]: string | string[] | boolean | null }) => {
    const editor = editorRef.current;
    if (!editor) return;

    if (textInputEditInfo) {
      const handler = updateHandlers.formtext;
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
          .updateAttributes(handler.getNodeType(), handler.getAttributes(updatedEditInfo, key, newValue))
          .run();
      });
    } else if (dropdownEditInfo) {
      const handler = updateHandlers.formmenu;
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
          .updateAttributes(handler.getNodeType(), handler.getAttributes(updatedEditInfo, key, newValue))
          .run();
      });
    }
    // 更新內容並觸發變更檢測
    const newContent = editor.getHTML();
    setContent(newContent);
  };

  return (
    <div className="flex flex-col h-full">
      <header className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] mb-4 pt-4 sm:pt-6 md:pt-4 gap-y-4 lg:gap-y-0 justify-items-start sm:justify-items-stretch">
        
        <div className="grid grid-cols-2 gap-x-4 lg:pr-4">

          {/** Prompt 名稱與捷徑 **/}
          <div className="relative">
            <SaveStatusIndicator className="absolute -top-8 left-0 z-10 sm:-top-7 md:-top-6" />
            <Input 
              ref={nameInputRef}
              className="pl-9 h-12" 
              placeholder="Type prompt name..." 
              value={name} 
              onChange={handleNameChange}
              data-no-extension="true"
              data-exclude-extension="true"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
            <FaTag className="absolute left-[10px] top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
          </div>
          {/** Shortcut **/}
          <div className="relative">
            <div className="relative">
              <Input 
                ref={shortcutInputRef}
                className="pl-9 pr-24 h-12" 
                placeholder="Add a shortcut..." 
                value={shortcut} 
                onChange={handleShortcutChange}
                data-no-extension="true"
                data-exclude-extension="true"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />
              <FaKeyboard className="absolute left-[10px] top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
              <Button
                ref={tryItOutButtonRef}
                className="absolute right-[10px] top-1/2 h-8 px-2 text-xs sm:text-sm -translate-y-1/2"
                onClick={e => {
                  e.stopPropagation();
                  setIsPopupVisible(prev => !prev);
                }}
              >
                Try it out
              </Button>
            </div>
            {shortcutError && <ShortcutErrorAlert error={shortcutError} onClose={() => setShortcutError(null)} />}
            {isPopupVisible && <TryItOutPopup tryItOutButtonRef={tryItOutButtonRef} shortcut={shortcut} onClose={() => setIsPopupVisible(false)} />}
          </div>
        </div>
        <div className="flex items-center justify-between lg:justify-end space-x-2">
          <EditViewButtons mode={mode} onModeChange={setMode} />
          <Button
            className="h-10 lg:hidden text-primary border-secondary hover:bg-light hover:text-primary"
            variant="outline"
            onClick={() => {
              if (isMobilePanelOpen) {
                setIsMobilePanelClosing(true);
                setTimeout(() => {
                  setIsMobilePanelClosing(false);
                  setIsMobilePanelOpen(false);
                }, 300);
              } else {
                setIsMobilePanelOpen(true);
              }
            }}
          >
            Tools
          </Button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] flex-1 min-h-0">
        {mode === "edit" ? (
          <><section className="flex flex-col lg:pr-4 py-4 lg:border-r lg:border-gray-200 overflow-y-auto">
            <TipTapEditor
              value={content}
              onChange={setContent}
              onEditorReady={editor => (editorRef.current = editor)}
              onFormTextNodeClick={handleFormTextNodeClick}
              onFormMenuNodeClick={handleFormMenuNodeClick}
              onEditorClick={handleEditorClick}
            />
          </section>

            {/* 桌面版側邊欄 */}
            <div className="hidden lg:block">
              <aside className="min-h-0 overflow-y-auto">
                {isEditPanelVisible && activeEditInfo ? (
                  <EditPanel editInfo={activeEditInfo} onChange={handleTextInputChange} />
                ) : (
                  <Sidebar
                    onInsertTextFieldClick={handleInsertTextFieldClick}
                    onInsertMenuFieldClick={handleInsertMenuFieldClick}
                  />
                )}
              </aside>
            </div>
            {/* 手機版覆蓋面板 */}
            {(isMobilePanelOpen || isMobilePanelClosing) && (
              <div className="fixed inset-0 z-50 flex justify-end">
                <div
                  className="fixed inset-0 bg-black opacity-50"
                  onClick={() => {
                    setIsMobilePanelClosing(true);
                    setTimeout(() => {
                      setIsMobilePanelClosing(false);
                      setIsMobilePanelOpen(false);
                    }, 300);
                  }}
                />
                <aside className={`relative md:w-1/4 max-w-xs bg-white overflow-y-auto ${isMobilePanelClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}>
                  {isEditPanelVisible && activeEditInfo ? (
                    <EditPanel editInfo={activeEditInfo} onChange={handleTextInputChange} />
                  ) : (
                    <Sidebar
                      onInsertTextFieldClick={handleInsertTextFieldClick}
                      onInsertMenuFieldClick={handleInsertMenuFieldClick}
                    />
                  )}
                </aside>
              </div>
            )}
          </>)
          : <div className="border-r border-gray-200">
            <PreviewPrompt content={content} shortcut={shortcut} />
          </div>
        }
      </main>

      <InsertTextFieldDialog
        isOpen={isTextDialogOpen}
        onClose={() => setIsTextDialogOpen(false)}
        onInsert={handleTextFieldInsert}
        defaultLabel={textInputEditInfo?.name || ""}
        defaultdefault={textInputEditInfo?.default || ""}
      />
      <InsertDropdownMenuDialog
        isOpen={isDropdownDialogOpen}
        onClose={() => setIsDropdownDialogOpen(false)}
        onInsert={handleDropDownMenuInsert}
        defaultName={dropdownEditInfo?.name}
        defaultOptionValues={dropdownEditInfo?.options}
        defaultMultiple={dropdownEditInfo?.multiple}
        selectedValue={dropdownEditInfo?.default}
      />
    </div>
  );
};

export default PromptPage;
