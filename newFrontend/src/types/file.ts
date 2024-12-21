export interface FileMetadata {
    id: number;
    fileName: string;
    fileSize: number;
    owner: string;
    uploadDate: string;
  }

  export interface DownloadProgressCallback {
    (progress: number): void;
  }

export interface FileShare {
  shareId: number;
  file: FileMetadata;
  sharedWithUsername: string;
  sharedDate: string;
  sharedByUsername: string;
}