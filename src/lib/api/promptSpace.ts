import { 
  PromptSpaceApiResponse, 
  PromptSpaceListResponse, 
  CreatePromptSpaceRequest 
} from '@/shared/types/promptSpace';

const API_BASE_URL = '/api/v1';

export const promptSpaceApi = {
  async getAll(): Promise<PromptSpaceListResponse> {
    const response = await fetch(`${API_BASE_URL}/prompt-spaces`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch prompt spaces: ${response.statusText}`);
    }

    return response.json();
  },

  async create(data: CreatePromptSpaceRequest): Promise<PromptSpaceApiResponse> {
    const response = await fetch(`${API_BASE_URL}/prompt-spaces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create prompt space: ${response.statusText}`);
    }

    return response.json();
  },

  async delete(spaceId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/prompt-spaces/${spaceId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete prompt space: ${response.statusText}`);
    }
  }
};