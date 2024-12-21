import { Download, Share2, Trash2 } from 'lucide-react';

interface FileActionsProps {
  fileId: number;
  fileName: string;
  onShare: (fileId: number, fileName: string) => void;
  onDelete: (fileId: number) => void;
  onDownload: (fileId: number, fileName: string) => void;
  isDownloading: boolean;
}

export function FileActions({
  fileId,
  fileName,
  onShare,
  onDelete,
  onDownload,
  isDownloading,
}: FileActionsProps) {
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => onShare(fileId, fileName)}
        className="p-2 text-gray-600 hover:text-blue-600 rounded-full hover:bg-blue-50"
        title="Share file"
      >
        <Share2 className="w-4 h-4" />
      </button>
      <button
        onClick={() => onDownload(fileId, fileName)}
        className="p-2 text-gray-600 hover:text-green-600 rounded-full hover:bg-green-50"
        disabled={isDownloading}
        title="Download file"
      >
        <Download className="w-4 h-4" />
      </button>
      <button
        onClick={() => onDelete(fileId)}
        className="p-2 text-gray-600 hover:text-red-600 rounded-full hover:bg-red-50"
        title="Delete file"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}