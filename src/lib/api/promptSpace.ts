import { 
  PromptSpaceApiResponse, 
  PromptSpaceListResponse, 
  CreatePromptSpaceRequest 
} from '@/shared/types/promptSpace';

const API_BASE_URL = '/api/v1';

export const promptSpaceApi = {
  async getAll(userId: string): Promise<PromptSpaceListResponse> {
    const response = await fetch(`${API_BASE_URL}/prompt-spaces`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch prompt spaces: ${response.statusText}`);
    }

    return response.json();
  },

  async create(userId: string, data: CreatePromptSpaceRequest): Promise<PromptSpaceApiResponse> {
    const response = await fetch(`${API_BASE_URL}/prompt-spaces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create prompt space: ${response.statusText}`);
    }

    return response.json();
  }
};