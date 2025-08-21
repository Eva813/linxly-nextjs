# Chrome Extension 測試資料集

**用途**: 提供完整的測試資料，協助 Chrome Extension 開發人員驗證新 JSON 格式的整合

---

## 📋 API 回應格式範例

### **新格式 Prompt (JSON)**
```json
{
  "id": "prompt-001",
  "name": "使用者註冊表單",
  "content": "",
  "contentJSON": {
    "type": "doc",
    "content": [
      {
        "type": "heading",
        "attrs": { "level": 1 },
        "content": [{ "type": "text", "text": "使用者註冊" }]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "歡迎 " },
          {
            "type": "formtext",
            "attrs": {
              "promptData": {
                "type": "formtext",
                "name": "userName",
                "default": "請輸入您的姓名",
                "cols": 25
              }
            }
          },
          { "type": "text", "text": "，您的角色是 " },
          {
            "type": "formmenu",
            "attrs": {
              "promptData": {
                "type": "formmenu",
                "name": "userRole",
                "options": ["管理員", "編輯者", "檢視者"],
                "multiple": false,
                "default": "檢視者"
              }
            }
          },
          { "type": "text", "text": "。" }
        ]
      }
    ]
  },
  "shortcut": "/register",
  "seqNo": 1
}
```

### **舊格式 Prompt (HTML)**
```json
{
  "id": "prompt-002", 
  "name": "舊版登入表單",
  "content": "<h1>使用者登入</h1><p>請輸入您的 <span data-type=\"formtext\" data-prompt='{\"attributes\":[{\"name\":\"name\",\"value\":\"email\"},{\"name\":\"default\",\"value\":\"email@example.com\"}]}'>email</span> 和 <span data-type=\"formtext\" data-prompt='{\"attributes\":[{\"name\":\"name\",\"value\":\"password\"},{\"name\":\"default\",\"value\":\"請輸入密碼\"}]}'>password</span>。</p>",
  "contentJSON": null,
  "shortcut": "/login",
  "seqNo": 2
}
```

---

## 🧪 轉換測試範例

### **測試案例 1: 單一 FormText**
```javascript
const singleFormTextTest = {
  name: "單一文字輸入測試",
  input: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '您的姓名是 ' },
          {
            type: 'formtext',
            attrs: {
              promptData: {
                name: 'fullName',
                default: '請輸入完整姓名',
                cols: 30
              }
            }
          }
        ]
      }
    ]
  },
  expectedHTML: '<p>您的姓名是 <span data-type="formtext" data-prompt=\'{"name":"fullName","default":"請輸入完整姓名","cols":30}\'>[fullName:請輸入完整姓名]</span></p>',
  expectedFormElements: [
    {
      type: 'formtext',
      name: 'fullName',
      default: '請輸入完整姓名',
      cols: 30
    }
  ]
};
```

### **測試案例 2: 單一 FormMenu**
```javascript
const singleFormMenuTest = {
  name: "單一選單測試",
  input: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '請選擇您的部門：' },
          {
            type: 'formmenu',
            attrs: {
              promptData: {
                name: 'department',
                options: ['工程部', '設計部', '行銷部', '業務部'],
                multiple: false,
                default: '工程部'
              }
            }
          }
        ]
      }
    ]
  },
  expectedHTML: '<p>請選擇您的部門：<span data-type="formmenu" data-prompt=\'{"name":"department","options":["工程部","設計部","行銷部","業務部"],"multiple":false,"default":"工程部"}\'>[department:工程部]</span></p>',
  expectedFormElements: [
    {
      type: 'formmenu',
      name: 'department',
      options: ['工程部', '設計部', '行銷部', '業務部'],
      multiple: false,
      default: '工程部'
    }
  ]
};
```

### **測試案例 3: 多選選單**
```javascript
const multiSelectMenuTest = {
  name: "多選選單測試",
  input: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '您熟悉的程式語言：' },
          {
            type: 'formmenu',
            attrs: {
              promptData: {
                name: 'languages',
                options: ['JavaScript', 'Python', 'Java', 'C++', 'Go'],
                multiple: true,
                default: ['JavaScript', 'Python']
              }
            }
          }
        ]
      }
    ]
  },
  expectedHTML: '<p>您熟悉的程式語言：<span data-type="formmenu" data-prompt=\'{"name":"languages","options":["JavaScript","Python","Java","C++","Go"],"multiple":true,"default":["JavaScript","Python"]}\'>[languages:JavaScript, Python]</span></p>',
  expectedFormElements: [
    {
      type: 'formmenu',
      name: 'languages',
      options: ['JavaScript', 'Python', 'Java', 'C++', 'Go'],
      multiple: true,
      default: ['JavaScript', 'Python']
    }
  ]
};
```

### **測試案例 4: 複合表單**
```javascript
const complexFormTest = {
  name: "複合表單測試",
  input: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '專案申請表' }]
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '專案名稱：' },
          {
            type: 'formtext',
            attrs: {
              promptData: {
                name: 'projectName',
                default: '請輸入專案名稱'
              }
            }
          }
        ]
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '負責人：' },
          {
            type: 'formtext',
            attrs: {
              promptData: {
                name: 'manager',
                default: '專案負責人姓名'
              }
            }
          }
        ]
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '優先級：' },
          {
            type: 'formmenu',
            attrs: {
              promptData: {
                name: 'priority',
                options: ['高', '中', '低'],
                default: '中'
              }
            }
          }
        ]
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '相關技術：' },
          {
            type: 'formmenu',
            attrs: {
              promptData: {
                name: 'technologies',
                options: ['React', 'Vue', 'Angular', 'Node.js', 'Python'],
                multiple: true,
                default: ['React']
              }
            }
          }
        ]
      }
    ]
  },
  expectedFormElements: [
    {
      type: 'formtext',
      name: 'projectName',
      default: '請輸入專案名稱'
    },
    {
      type: 'formtext', 
      name: 'manager',
      default: '專案負責人姓名'
    },
    {
      type: 'formmenu',
      name: 'priority',
      options: ['高', '中', '低'],
      default: '中'
    },
    {
      type: 'formmenu',
      name: 'technologies',
      options: ['React', 'Vue', 'Angular', 'Node.js', 'Python'],
      multiple: true,
      default: ['React']
    }
  ]
};
```

---

## 🔄 向後相容性測試資料

### **舊格式 HTML 結構**
```javascript
const legacyFormatTests = [
  {
    name: "舊格式 FormText",
    html: '<p>使用者名稱：<span data-type="formtext" data-prompt=\'{"attributes":[{"name":"name","value":"username"},{"name":"default","value":"請輸入使用者名稱"}]}\'>username</span></p>',
    expectedFormElements: [
      {
        type: 'formtext',
        name: 'username',
        default: '請輸入使用者名稱'
      }
    ]
  },
  {
    name: "舊格式 FormMenu",
    html: '<p>選擇國家：<span data-type="formmenu" data-prompt=\'{"attributes":[{"name":"name","value":"country"},{"name":"options","value":["台灣","日本","韓國"]},{"name":"default","value":"台灣"}]}\'>country</span></p>',
    expectedFormElements: [
      {
        type: 'formmenu',
        name: 'country',
        options: ['台灣', '日本', '韓國'],
        default: '台灣'
      }
    ]
  }
];
```

---

## 🧪 完整測試套件

```javascript
// 完整的測試函數
function runChromeExtensionTests() {
  console.log('=== Chrome Extension 整合測試套件 ===\n');
  
  const testCases = [
    singleFormTextTest,
    singleFormMenuTest, 
    multiSelectMenuTest,
    complexFormTest
  ];
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  testCases.forEach((testCase, index) => {
    console.log(`執行測試 ${index + 1}: ${testCase.name}`);
    
    try {
      // 轉換 JSON 到 HTML
      const actualHTML = convertJSONToHTML(testCase.input);
      console.log('轉換結果:', actualHTML);
      
      // 檢測表單元素
      const mockPrompt = { contentJSON: testCase.input };
      const actualFormElements = analyzeFormElements(mockPrompt);
      console.log('檢測到的表單元素:', actualFormElements);
      
      // 驗證結果
      const htmlValid = actualHTML.includes('data-type') && actualHTML.includes('data-prompt');
      const elementsValid = actualFormElements.length === testCase.expectedFormElements.length;
      
      if (htmlValid && elementsValid) {
        console.log('✅ 測試通過\n');
        passedTests++;
      } else {
        console.log('❌ 測試失敗');
        console.log('HTML 有效:', htmlValid);
        console.log('元素數量正確:', elementsValid);
        console.log('');
      }
      
    } catch (error) {
      console.log('❌ 測試錯誤:', error.message);
      console.log('');
    }
  });
  
  console.log(`測試結果: ${passedTests}/${totalTests} 通過`);
  return passedTests === totalTests;
}

// 向後相容性測試
function runBackwardCompatibilityTests() {
  console.log('=== 向後相容性測試 ===\n');
  
  legacyFormatTests.forEach((testCase, index) => {
    console.log(`測試 ${index + 1}: ${testCase.name}`);
    
    const mockPrompt = { 
      content: testCase.html, 
      contentJSON: null 
    };
    
    const html = getDisplayableContent(mockPrompt);
    const formElements = analyzeFormElements(mockPrompt);
    
    console.log('處理後的 HTML:', html);
    console.log('檢測到的表單元素:', formElements);
    console.log('元素數量正確:', formElements.length === testCase.expectedFormElements.length);
    console.log('');
  });
}
```

---

## 📊 效能基準測試

```javascript
// 效能測試資料
const performanceTestData = {
  small: {
    description: "小型內容 (1個表單元素)",
    contentJSON: singleFormTextTest.input
  },
  medium: {
    description: "中型內容 (4個表單元素)", 
    contentJSON: complexFormTest.input
  },
  large: {
    description: "大型內容 (10個表單元素)",
    contentJSON: {
      type: 'doc',
      content: Array.from({ length: 10 }, (_, i) => ({
        type: 'paragraph',
        content: [
          { type: 'text', text: `欄位 ${i + 1}：` },
          {
            type: 'formtext',
            attrs: {
              promptData: {
                name: `field${i + 1}`,
                default: `預設值 ${i + 1}`
              }
            }
          }
        ]
      }))
    }
  }
};

function runPerformanceTests() {
  console.log('=== 效能基準測試 ===\n');
  
  Object.entries(performanceTestData).forEach(([size, data]) => {
    console.log(`測試 ${data.description}`);
    
    const iterations = 100;
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      const html = convertJSONToHTML(data.contentJSON);
      const formElements = analyzeFormElements({ contentJSON: data.contentJSON });
      const endTime = performance.now();
      
      times.push(endTime - startTime);
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    console.log(`平均耗時: ${avgTime.toFixed(2)}ms`);
    console.log(`最短耗時: ${minTime.toFixed(2)}ms`);
    console.log(`最長耗時: ${maxTime.toFixed(2)}ms`);
    console.log('');
  });
}
```

---

## 🔧 實用工具函數

### **內容驗證器**
```javascript
function validatePromptContent(prompt) {
  const issues = [];
  
  // 檢查基本結構
  if (!prompt.id) issues.push('缺少 ID');
  if (!prompt.name) issues.push('缺少名稱');
  if (!prompt.contentJSON && !prompt.content) {
    issues.push('缺少內容 (contentJSON 和 content 都為空)');
  }
  
  // 檢查 JSON 格式
  if (prompt.contentJSON) {
    if (typeof prompt.contentJSON !== 'object') {
      issues.push('contentJSON 不是有效的物件');
    } else if (!prompt.contentJSON.type || prompt.contentJSON.type !== 'doc') {
      issues.push('contentJSON 缺少有效的 doc 類型');
    }
  }
  
  // 檢查表單元素
  try {
    const formElements = analyzeFormElements(prompt);
    formElements.forEach((element, index) => {
      if (!element.name) {
        issues.push(`表單元素 ${index + 1} 缺少 name 屬性`);
      }
      if (element.type === 'formmenu' && !element.options) {
        issues.push(`選單元素 ${index + 1} 缺少 options 屬性`);
      }
    });
  } catch (error) {
    issues.push(`表單元素分析失敗: ${error.message}`);
  }
  
  return {
    isValid: issues.length === 0,
    issues: issues
  };
}
```

### **HTML 結構分析器**
```javascript
function analyzeHTMLStructure(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  return {
    totalElements: doc.body.children.length,
    formElements: doc.querySelectorAll('span[data-type]').length,
    hasFormText: doc.querySelectorAll('span[data-type="formtext"]').length > 0,
    hasFormMenu: doc.querySelectorAll('span[data-type="formmenu"]').length > 0,
    dataPromptAttributes: Array.from(doc.querySelectorAll('span[data-prompt]')).map(el => {
      try {
        return JSON.parse(el.getAttribute('data-prompt'));
      } catch {
        return null;
      }
    }).filter(Boolean)
  };
}
```

---

**測試資料版本**: 1.0  
**建立日期**: 2025-08-18  
**適用版本**: PromptBear v2.0 以上

> 💡 **使用說明**: 這些測試資料可以直接複製到 Chrome Extension 專案中使用，協助驗證新 JSON 格式的整合是否正確。建議在整合完成後執行所有測試案例，確保功能正常運作。