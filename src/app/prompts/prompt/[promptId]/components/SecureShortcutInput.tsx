import React, { useRef, useEffect, useCallback } from 'react';

// 進階防護的自訂元素
export class SecureShortcutInputElement extends HTMLElement {
  private input: HTMLInputElement;
  private shadow: ShadowRoot;
  private eventBlocker: AbortController;
  
  constructor() {
    super();
    this.eventBlocker = new AbortController();
    
    // 使用 open shadow DOM 讓樣式可以繼承
    this.shadow = this.attachShadow({ mode: 'closed', delegatesFocus: true });
    this.input = document.createElement('input');
    this.setupInput();
    this.setupEventBlocking();
    this.setupStyles();
    this.shadow.appendChild(this.input);
  }

  private setupInput() {
    this.input.type = 'text';
    this.input.placeholder = this.getAttribute('placeholder') || '';
    this.input.value = this.getAttribute('value') || '';
    
    // 多重防護標記
    // this.input.setAttribute('data-blaze-disabled', 'true');
    this.input.setAttribute('data-text-expander-disabled', 'true');
    this.input.setAttribute('data-autotext-disabled', 'true');
    this.input.setAttribute('data-extension-disabled', 'true');
    this.input.setAttribute('autocomplete', 'off');
    this.input.setAttribute('autocorrect', 'off');
    this.input.setAttribute('spellcheck', 'false');
    this.input.setAttribute('data-gramm', 'false'); // 關閉 Grammarly
    
    // 設定樣式以模擬正常 input，配合 shadcn UI 樣式
    this.input.style.cssText = `
      width: 100%;
      height: 100%;
      outline: none;
      background: transparent;
      font: inherit;
      color: inherit;
      padding: 0;
      margin: 0;
      box-sizing: border-box;
      font-size: inherit;
      line-height: inherit;
    `;
  }

  private setupStyles() {
    // 建立 style 元素並注入 shadcn UI 樣式，使用確定的顏色值
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: flex;
        height: 3rem;
        width: 100%;
        border-radius: 0.375rem;
        border: 1px solid hsl(240 5.9% 90%) !important;
        background-color: transparent;
        padding-left: 2.25rem;
        padding-right: 6rem;
        padding-top: 0.25rem;
        padding-bottom: 0.25rem;
        font-size: 1rem;
        line-height: 1.5;
        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 150ms;
      }

      :host(:focus-within) {
        outline: 2px solid transparent;
        outline-offset: 2px;
        box-shadow: 0 0 0 2px #96b0e4;
        border-color: #96b0e4;
      }

      :host([disabled]) {
        cursor: not-allowed;
        opacity: 0.5;
      }

      input {
        width: 100%;
        height: 100%;
        background: transparent;
        border: none;
        outline: none;
        font: inherit;
        color: inherit;
        padding: 0;
        margin: 0;
      }

      input:focus {
        outline: none;
      }

      input::placeholder {
        color: #cccccc;
      }

      input:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }

      @media (min-width: 768px) {
        :host {
          font-size: 0.875rem;
          line-height: 1.25rem;
        }
      }
    `;
    this.shadow.appendChild(style);
  }

  private setupEventBlocking() {
    const { signal } = this.eventBlocker;
    
    // 需要阻擋的事件列表
    const eventsToBlock = [
      'keydown', 'keyup', 'keypress',
      'input', 'beforeinput', 'textInput',
      'compositionstart', 'compositionupdate', 'compositionend',
      'paste', 'cut', 'copy'
    ];

    // 在捕獲階段攔截所有相關事件
    eventsToBlock.forEach(eventType => {
      this.input.addEventListener(eventType, (e) => {
        // 立即停止事件傳播，防止被擴充套件監聽
        e.stopImmediatePropagation();
        e.stopPropagation();
        
        // 只處理 input 事件來更新值
        if (eventType === 'input') {
          this.handleInputChange();
        }
      }, { capture: true, signal });
    });

    // 全域事件攔截器 - 防止擴充套件在 document 層級監聽
    const globalEventHandler = (e: Event) => {
      if (e.composedPath().includes(this.input)) {
        e.stopImmediatePropagation();
        e.stopPropagation();
      }
    };

    eventsToBlock.forEach(eventType => {
      document.addEventListener(eventType, globalEventHandler, {
        capture: true,
        signal
      });
    });

    // 防止擴充套件透過 MutationObserver 監聽值變化
    this.input.addEventListener('input', this.handleInputChange.bind(this), { signal });
  }

  private handleInputChange() {
    const value = this.input.value;
    this.setAttribute('value', value);
    
    // 使用自訂事件而非標準 input 事件
    this.dispatchEvent(new CustomEvent('secure-input-change', {
      detail: { value },
      bubbles: false, // 不讓事件冒泡
      cancelable: false
    }));
  }

  // 提供程式化方式設定值，避免觸發事件
  public setValue(value: string) {
    this.input.value = value;
    this.setAttribute('value', value);
  }

  public getValue(): string {
    return this.input.value;
  }

  public focus() {
    this.input.focus();
  }

  static get observedAttributes() {
    return ['value', 'placeholder', 'disabled'];
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    if (!this.input) return;
    
    switch (name) {
      case 'value':
        if (newValue !== null && this.input.value !== newValue) {
          this.input.value = newValue;
        }
        break;
      case 'placeholder':
        if (newValue !== null) {
          this.input.placeholder = newValue;
        }
        break;
      case 'disabled':
        this.input.disabled = newValue !== null;
        break;
    }
  }

  disconnectedCallback() {
    this.eventBlocker.abort();
  }
}

// 註冊自訂元素
if (typeof window !== 'undefined' && !window.customElements.get('secure-shortcut-input')) {
  window.customElements.define('secure-shortcut-input', SecureShortcutInputElement);
}

// React 包裝元件
interface SecureShortcutInputProps {
  value: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

const SecureShortcutInput: React.FC<SecureShortcutInputProps> = ({
  value,
  placeholder,
  disabled,
  onChange,
  onFocus,
  onBlur
}) => {
  const ref = useRef<SecureShortcutInputElement>(null);
  const isUpdatingFromProps = useRef(false);

  // 處理內部值變化
  const handleSecureInputChange = useCallback((e: CustomEvent<{ value: string }>) => {
    if (isUpdatingFromProps.current) return;
    
    // 建立相容的 React ChangeEvent
    const syntheticEvent = {
      target: { value: e.detail.value },
      currentTarget: { value: e.detail.value }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(syntheticEvent);
  }, [onChange]);

  // 更新元件屬性
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    isUpdatingFromProps.current = true;
    element.setAttribute('value', value);
    if (placeholder) element.setAttribute('placeholder', placeholder);
    if (disabled !== undefined) {
      if (disabled) {
        element.setAttribute('disabled', '');
      } else {
        element.removeAttribute('disabled');
      }
    }
    isUpdatingFromProps.current = false;
  }, [value, placeholder, disabled]);

  // 設定事件監聽器
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleSecureChange = handleSecureInputChange as EventListener;
    const handleFocus = onFocus;
    const handleBlur = onBlur;

    element.addEventListener('secure-input-change', handleSecureChange);
    if (handleFocus) element.addEventListener('focus', handleFocus);
    if (handleBlur) element.addEventListener('blur', handleBlur);

    return () => {
      element.removeEventListener('secure-input-change', handleSecureChange);
      if (handleFocus) element.removeEventListener('focus', handleFocus);
      if (handleBlur) element.removeEventListener('blur', handleBlur);
    };
  }, [handleSecureInputChange, onFocus, onBlur]);

  return React.createElement('secure-shortcut-input', {
    ref,
    placeholder,
    disabled,
    value,
    'data-testid': 'secure-shortcut-input'
  });
};

export default SecureShortcutInput;