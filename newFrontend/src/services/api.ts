import { toast } from 'react-hot-toast';
import axios from 'axios';
import type { DownloadProgressCallback } from '../types/file';

const REST_API_BASE = import.meta.env.VITE_REST_API_BASE;
const GRAPHQL_API_URL = import.meta.env.VITE_GRAPHQL_API_URL;

interface FileMetadata {
  id: number;
  fileName: string;
  fileSize: number;
  owner: string;
  uploadDate: string;
}

// axios interceptors for global error handling and token management
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
        // unauthorized - probably token expired
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_id');
        window.location.href = '/login'; // redirect to login
      }
      return Promise.reject(error);
    }
);

export const fileService = {
  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<number> {
    const userId = localStorage.getItem('user');
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${REST_API_BASE}/upload`, formData, {
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
    // get fileId from response
         const fileId = parseInt(response.data.split('FileID: ')[1]);
         return fileId;
       } catch (error) {
         handleApiError(error, 'File upload failed');
         throw error;
       }
     },

  // download file
   async downloadFile(fileId: number, onProgress?: DownloadProgressCallback): Promise<Blob> {
     const username = localStorage.getItem('user');
     if (!username) {
       throw new Error('User not authenticated');
     }

     try {
       const response = await fetch(`${REST_API_BASE}/download/${fileId}`, {
         headers: {
           'Authorization': `Bearer ${localStorage.getItem('user_token')}`
         }
       });

       if (!response.ok) {
         throw new Error('Download failed');
       }

       const contentLength = Number(response.headers.get('Content-Length'));
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
           const progress = (receivedLength / contentLength) * 100;
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

  // use GraphQL with authentication
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

// error handler utility
export const handleApiError = (error: unknown, customMessage?: string) => {
  if (axios.isAxiosError(error)) {
    // handle Axios errors
    const errorMessage = error.response?.data?.message
        || error.message
        || 'An unexpected error occurred';

    console.error('API Error:', error);
    toast.error(customMessage || errorMessage);
  } else if (error instanceof Error) {
    // handle standard Error objects
    console.error('API Error:', error);
    toast.error(customMessage || error.message);
  } else {
    // backup for unknown error types
    console.error('Unknown API Error:', error);
    toast.error(customMessage || 'An unexpected error occurred');
  }
};

const API_URL = 'http://localhost:8083/auth';

// login API
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

// register API
export const register = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/register`, {
      username,
      password,
    });
    return response.data; // success message
  } catch (error) {
    throw error.response?.data?.message || 'Registration failed';
  }
};


export const shareService = {
  // Get files shared with current user
  async getFilesSharedWithMe(): Promise<FileShare[]> {
    const username = localStorage.getItem('user');
    if (!username) {
      throw new Error('User not authenticated');
    }

    const query = {
      query: `
        query GetFilesSharedWithMe($username: String!) {
          getFilesSharedWithMe(username: $username) {
            shareId
            file {
              id
              fileName
              fileSize
              owner
              uploadDate
            }
            sharedDate
            sharedByUsername
            sharedWithUsername
          }
        }
      `,
      variables: { username }
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
        throw new Error('Failed to fetch shared files');
      }

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      return result.data.getFilesSharedWithMe;
    } catch (error) {
      handleApiError(error, 'Failed to fetch shared files');
      throw error;
    }
  },

  // Get files shared by current user
  async getFilesSharedByMe(): Promise<FileShare[]> {
    const username = localStorage.getItem('user');
    if (!username) {
      throw new Error('User not authenticated');
    }

    const query = {
      query: `
        query GetFilesSharedByMe($username: String!) {
          getFilesSharedByMe(username: $username) {
            shareId
            file {
              id
              fileName
              fileSize
              owner
              uploadDate
            }
            sharedDate
            sharedByUsername
            sharedWithUsername
          }
        }
      `,
      variables: { username }
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
              throw new Error('Network response was not ok');
            }

            const result = await response.json();
            console.log('API Response:', result); // Debug log

            if (result.errors) {
              throw new Error(result.errors[0].message);
            }

            return result.data.getFilesSharedByMe;
          } catch (error) {
            console.error('Error fetching shared files:', error);
            throw error;
          }
        },

  // Share a file
  async shareFile(fileId: number, sharedWithUsername: string): Promise<boolean> {
    const sharedByUsername = localStorage.getItem('user');
    if (!sharedByUsername) {
      throw new Error('User not authenticated');
    }

    const mutation = {
      query: `
        mutation ShareFile($fileId: Int!, $sharedWithUsername: String!, $sharedByUsername: String!) {
          shareFile(
            fileId: $fileId,
            sharedWithUsername: $sharedWithUsername,
            sharedByUsername: $sharedByUsername
          )
        }
      `,
      variables: {
        fileId,
        sharedWithUsername,
        sharedByUsername
      }
    };

    try {
      const response = await fetch(GRAPHQL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('user_token')}`
        },
        body: JSON.stringify(mutation),
      });

      if (!response.ok) {
        throw new Error('Failed to share file');
      }

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      toast.success('File shared successfully');
      return result.data.shareFile;
    } catch (error) {
      handleApiError(error, 'Failed to share file');
      throw error;
    }
  },

  // Revoke share
    async revokeShare(fileId: number, sharedWithUsername: string): Promise<boolean> {
      const sharedByUsername = localStorage.getItem('user');  // Get current user
      if (!sharedByUsername) {
        throw new Error('User not authenticated');
      }

      const mutation = {
        query: `
          mutation RevokeShare($fileId: Int!, $sharedWithUsername: String!, $sharedByUsername: String!) {
            revokeShare(
              fileId: $fileId,
              sharedWithUsername: $sharedWithUsername,
              sharedByUsername: $sharedByUsername
            )
          }
        `,
        variables: {
          fileId,
          sharedWithUsername,
          sharedByUsername
        }
      };

      try {
        const response = await fetch(GRAPHQL_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('user_token')}`
          },
          body: JSON.stringify(mutation),
        });

        if (!response.ok) {
          throw new Error('Failed to revoke share');
        }

        const result = await response.json();
        if (result.errors) {
          throw new Error(result.errors[0].message);
        }

        return result.data.revokeShare;
      } catch (error) {
        handleApiError(error, 'Failed to revoke share');
        throw error;
      }
    }
  };