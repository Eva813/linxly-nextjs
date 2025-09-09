import axios from 'axios';

// 使用環境變數作為 API 的設定
const apiBaseUrl = 'https://web-tech-tw.eu.org/openai/v1';
const apiKey = process.env.AI_API_KEY;

// 創建 axios 實例
const aiInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  },
});

export const callAiApi = async (prompt) => {
  try {
    const response = await aiInstance.post(`${apiBaseUrl}/chat/completions`, {
      model: 'gpt-4-turbo-preview', // 你可以根據未來的需要更換這個模型
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
    });
    return response.data;
  } catch (error) {
    console.error('Error calling AI API', error);
    throw error;
  }
};
