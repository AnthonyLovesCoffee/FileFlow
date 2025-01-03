import { toast } from 'react-hot-toast';
import axios from 'axios';
import type { DownloadProgressCallback } from '../types/file';
import { checkServiceHealth } from '../utils/serviceHealth';
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
      const token = localStorage.getItem('user_token');
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
      // check if 401 from the login endpoint
      const isLoginEndpoint = error.config.url.includes('/auth/login');

      if (error.response?.status === 401 && !isLoginEndpoint) {
        // only redirect for 401s that aren't from the login endpoint
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_id');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
);

export const fileService = {
async uploadFile(
    file: File,
    tags: string[],
    onProgress?: (progress: number) => void
): Promise<number> {
    if (!file) {
        throw new Error('No file provided');
    }

    try {
        const isServiceAvailable = await checkServiceHealth(import.meta.env.VITE_FILE_SERVICE_URL);
        if (!isServiceAvailable) {
            throw new Error('File service is not available. Please try again in a few moments.');
        }

        console.log('Sending tags:', tags);

        const formData = new FormData();
        formData.append('file', file);

        tags.forEach(tag => {
            formData.append('tags[]', tag);
        });

        console.log('Sending FormData:');
        console.log('File:', file.name);
        console.log('Tags:', tags);
        try {
            console.log('FormData contents:');
            for (const pair of formData.entries()) {
                console.log(pair[0], pair[1]);
            }

            const response = await axios.post(`${REST_API_BASE}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        onProgress?.(percentCompleted);
                    }
                },
            });

            if (!response.data) {
                console.log("ERROR: RESPONSE DATA EMPTY")
                throw new Error('No response data received');
            }

            const fileId = typeof response.data === 'object' ? response.data.id : parseInt(response.data.split('FileID: ')[1]);
            return fileId;
        } catch (error) {
            console.error('Upload error details:', {
                error: error,
                response: error.response?.data,
                status: error.response?.status,
                tags: tags // Log tags in error case too
            });

            throw error;
        }
    } catch (error) {
        if (error.message === 'File service is not available. Please try again in a few moments.') {
            throw error;
        }
        if (!error.response) {
            throw new Error('Service is currently unavailable. Please try again in a few moments.');
        }
        throw error;
    }
},

  // method to search files by tag
  async getFilesByTag(tag: string): Promise<FileMetadata[]> {
    const query = {
      query: `
        query GetFilesByTag($tag: String!) {
          getFilesByTag(tag: $tag) {
            id
            fileName
            fileSize
            owner
            uploadDate
            tags
          }
        }
      `,
      variables: { tag }
    };

    try {
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

      return result.data.getFilesByTag || [];
    } catch (error) {
      handleApiError(error, 'Failed to fetch files by tag');
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
      const isServiceAvailable = await checkServiceHealth(import.meta.env.VITE_FILE_SERVICE_URL);
      if (!isServiceAvailable) {
        throw new Error('File service is not available. Please try again in a few moments.');
      }

      const response = await fetch(`${REST_API_BASE}/download/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('user_token')}`
        }
      });

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('File service is not available. Please try again in a few moments.');
        }
        throw new Error('Download failed - service may be starting');
      }

      const contentLength = Number(response.headers.get('Content-Length'));
      const reader = response.body?.getReader();
      if (!reader) throw new Error('File service is not available. Please try again in a few moments.');

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
      if (error instanceof Error && error.message === 'Download failed - service may be starting') {
        throw new Error('File service is not available. Please try again in a few moments.');
      }
      throw error;
    }
   },

   // delete a file
   async deleteFile(fileId: number): Promise<void> {
       const username = localStorage.getItem('user');
       if (!username) {
         throw new Error('User not authenticated');
       }

        try {
           const isServiceAvailable = await checkServiceHealth(import.meta.env.VITE_FILE_SERVICE_URL);
           if (!isServiceAvailable) {
             throw new Error('File service is not available. Please try again in a few moments.');
           }

           const response = await axios.delete(`${REST_API_BASE}/delete/${fileId}`);

           if (response.status === 200) {
             toast.success('File deleted successfully');
           } else {
             throw new Error('Failed to delete file');
           }
         } catch (error) {
           if (error instanceof Error &&
               (error.message.includes('service is not available') ||
                error.message.includes('currently unavailable'))) {
             throw error;
           }
           handleApiError(error, 'Failed to delete file');
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
    // Check if auth service is available
    const isServiceAvailable = await checkServiceHealth(import.meta.env.VITE_AUTH_SERVICE_URL);
    if (!isServiceAvailable) {
      throw new Error('Authentication service is not available. Please try again in a few moments.');
    }

    const response = await axios.post(`${API_URL}/login`, {
      username,
      password,
    });

    // Check for response data and token
    if (!response.data || !response.data.token) {
      console.error('Invalid server response:', response);
      throw new Error('Invalid response from server');
    }

    // Set the authorization header
    axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

    return {
      token: response.data.token,
      user: username
    };
  } catch (error) {
    // Clear auth header
    delete axios.defaults.headers.common['Authorization'];

    console.error('Login error details:', {
      error,
      response: error.response?.data,
      status: error.response?.status
    });

    // No response means network error
    if (!error.response) {
      throw new Error('Service is currently unavailable. Please try again in a few moments.');
    }

    // Handle specific status codes
    switch (error.response.status) {
      case 401:
        throw new Error('Invalid username or password');
      case 404:
        throw new Error('User not found');
      case 503:
        throw new Error('Authentication service is not available');
      default:
        throw new Error(error.response?.data?.message || 'Login failed');
    }
  }
};

// register API
export const register = async (username: string, password: string) => {
  try {
    // Check if auth service is available
    const isServiceAvailable = await checkServiceHealth(import.meta.env.VITE_AUTH_SERVICE_URL);
    if (!isServiceAvailable) {
      throw new Error('Registration service is not available. Please try again in a few moments.');
    }

    const response = await axios.post(`${API_URL}/register`, {
      username,
      password,
    });
    return response.data;
  } catch (error) {
    if (!error.response) {
      // Network error or service unavailable
      throw new Error('Service is currently unavailable. Please try again in a few moments.');
    }
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