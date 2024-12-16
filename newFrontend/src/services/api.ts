import { toast } from 'react-hot-toast';

const REST_API_BASE = import.meta.env.VITE_REST_API_BASE;
const GRAPHQL_API_URL = import.meta.env.VITE_GRAPHQL_API_URL;

interface FileMetadata {
  id: string;
  fileName: string;
  fileSize: number;
  owner: string;
  uploadDate: string;
}

export const fileService = {
  // Upload file
  async uploadFile(file: File, userId: string): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    const response = await fetch(`${REST_API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }
  },

  // Download file
  downloadFile: async (username: string, fileName: string) => {
    const response = await fetch(
      `${import.meta.env.VITE_REST_API_BASE}/download/${encodeURIComponent(username)}/${encodeURIComponent(fileName)}`
    );
    if (!response.ok) throw new Error('Download failed');
    return response.blob();
  },

  // Get files by owner (GraphQL)
  async getFilesByOwner(owner: string): Promise<FileMetadata[]> {
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
      variables: { owner }
    };

    const response = await fetch(GRAPHQL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  }
};

// Error handler utility
export const handleApiError = (error: unknown, customMessage?: string) => {
  console.error('API Error:', error);
  toast.error(customMessage || 'An error occurred');
};