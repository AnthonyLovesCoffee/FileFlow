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

export const fileService = {
  // Upload file
  async uploadFile(file: File, userId: string, onProgress?: (progress: number) => void): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

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
  },

  // Download file
  async downloadFile(
    username: string, 
    fileName: string, 
    onProgress?: DownloadProgressCallback
  ): Promise<Blob> {
    const response = await fetch(
      `${REST_API_BASE}/download/${encodeURIComponent(username)}/${encodeURIComponent(fileName)}`
    );
    
    if (!response.ok) {
      throw new Error('Download failed');
    }

    // get total size of file
    const contentLength = Number(response.headers.get('Content-Length')) || 0;
    
    // create reader from response body
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Failed to initialize download');

    // array to store chunks of data
    const chunks: Uint8Array[] = [];
    let receivedLength = 0;

    // read stream
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

    // combine chunks
    const chunksAll = new Uint8Array(receivedLength);
    let position = 0;
    for (const chunk of chunks) {
      chunksAll.set(chunk, position);
      position += chunk.length;
    }
    
    return new Blob([chunksAll]);
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