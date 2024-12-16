export interface FileMetadata {
    id: string;
    fileName: string;
    fileSize: number;
    owner: string;
    uploadDate: string;
  }

  export interface DownloadProgressCallback {
    (progress: number): void;
  }