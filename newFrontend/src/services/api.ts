import { toast } from 'react-hot-toast';
import axios from 'axios';
import type { DownloadProgressCallback } from '../types/file';

const REST_API_BASE = import.meta.env.VITE_REST_API_BASE;
const GRAPHQL_API_URL = import.meta.env.VITE_GRAPHQL_API_URL;

interface FileMetadata {
  id: string;
  fileName: string;
  fileSize: number;
  owner: string;
  uploadDate: string;
}

// Configure axios interceptors for global error handling and token management
axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('user_token'); // Updated key
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
);

axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Unauthorized - likely token expired
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_id');
        window.location.href = '/login'; // Redirect to login
      }
      return Promise.reject(error);
    }
);

export const fileService = {
  // Upload file - updated to use current user's ID from localStorage
  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<void> {
    const userId = localStorage.getItem('user');
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    try {
      await axios.post(`${REST_API_BASE}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress?.(percentCompleted);
          }
        },
      });
    } catch (error) {
      handleApiError(error, 'File upload failed');
      throw error;
    }
  },

  // Download file - use current user's context
  async downloadFile(
      fileName: string,
      onProgress?: DownloadProgressCallback
  ): Promise<Blob> {
    const username = localStorage.getItem('user'); // Assuming we store email
    if (!username) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(
          `${REST_API_BASE}/download/${encodeURIComponent(username)}/${encodeURIComponent(fileName)}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('user_token')}`
            }
          }
      );

      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Existing download logic remains the same...
      const contentLength = Number(response.headers.get('Content-Length')) || 0;
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Failed to initialize download');

      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        if (contentLength && onProgress) {
          const progress = Math.round((receivedLength / contentLength) * 100);
          onProgress(progress);
        }
      }

      const chunksAll = new Uint8Array(receivedLength);
      let position = 0;
      for (const chunk of chunks) {
        chunksAll.set(chunk, position);
        position += chunk.length;
      }

      return new Blob([chunksAll]);
    } catch (error) {
      handleApiError(error, 'File download failed');
      throw error;
    }
  },

  // Updated to use GraphQL with authentication
  async getFilesByOwner(): Promise<FileMetadata[]> {
    const username = localStorage.getItem('user');
    if (!username) {
      throw new Error('User not authenticated');
    }

    const query = {
      query: `
        query GetFilesByOwner($owner: String!) {
          getFilesByOwner(owner: $owner) {
            id
            fileName
            fileSize
            owner
            uploadDate
          }
        }
      `,
      variables: { owner: username }
    };

    try {
      const response = await fetch(GRAPHQL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('user_token')}`
        },
        body: JSON.stringify(query),
      });

      if (!response.ok) {
        throw new Error('Query failed');
      }

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      return result.data.getFilesByOwner || [];
    } catch (error) {
      handleApiError(error, 'Failed to fetch files');
      throw error;
    }
  }
};

// Enhanced error handler utility
export const handleApiError = (error: unknown, customMessage?: string) => {
  if (axios.isAxiosError(error)) {
    // Handle Axios-specific errors
    const errorMessage = error.response?.data?.message
        || error.message
        || 'An unexpected error occurred';

    console.error('API Error:', error);
    toast.error(customMessage || errorMessage);
  } else if (error instanceof Error) {
    // Handle standard Error objects
    console.error('API Error:', error);
    toast.error(customMessage || error.message);
  } else {
    // Fallback for unknown error types
    console.error('Unknown API Error:', error);
    toast.error(customMessage || 'An unexpected error occurred');
  }
};

const API_URL = 'http://localhost:8083/auth';

// Login API
export const login = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/login`, {
      username,
      password,
    });
    return {
      token: response.data.token,
      user: username
    };
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Login failed';
    throw new Error(errorMessage);
  }
};

// Register API
export const register = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/register`, {
      username,
      password,
    });
    return response.data; // Success message
  } catch (error) {
    throw error.response?.data?.message || 'Registration failed';
  }
};
