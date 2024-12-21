import { FileIcon, Download, Share2, Ban, Loader } from 'lucide-react';
import { formatFileSize } from '../utils/formatters';
import type { FileMetadata } from '../types/file';

interface FileListItemProps {
  file: FileMetadata;
  onShare: (fileId: number) => void;
  onDelete: (fileId: number) => void;
  onDownload: (fileId: number, fileName: string) => void;
  isDownloading: boolean;
  downloadProgress: number;
}

export function FileListItem({
  file,
  onShare,
  onDelete,
  onDownload,
  isDownloading,
  downloadProgress,
}: FileListItemProps) {
  return (
    <div className="p-4 border rounded-lg hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <FileIcon className="w-6 h-6 text-gray-400" />
          <div>
            <p className="font-medium">{file.fileName}</p>
            <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-gray-500">
              <p>Size: {formatFileSize(file.fileSize)}</p>
              <p>Uploaded: {new Date(file.uploadDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          {/* Share Button */}
          <button
            onClick={() => onShare(file.id)}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(file.id)}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:text-red-800 transition-colors"
          >
            <Ban className="w-4 h-4" />
            <span>Delete</span>
          </button>

          {/* Download Button */}
          <button
            onClick={() => onDownload(file.id, file.fileName)}
            disabled={isDownloading}
            className={`
              flex items-center space-x-2 px-4 py-2 text-sm
              ${isDownloading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'}
              text-white rounded-md transition-colors
              ${isDownloading ? 'opacity-75' : 'opacity-100'}
            `}
          >
            {isDownloading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>
                  {downloadProgress > 0
                    ? `${Math.round(downloadProgress)}%`
                    : 'Starting...'}
                </span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}