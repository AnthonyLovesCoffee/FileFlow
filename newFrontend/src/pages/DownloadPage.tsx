import { useState, useEffect } from 'react';
import { Download, FileIcon, Loader, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { fileService, shareService, handleApiError } from '../services/api';
import { FileListItem } from '../components/FileListItem';
import { ShareModal } from '../components/ShareModal';
import type { FileMetadata } from '../types/file';

export function DownloadPage() {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileMetadata[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState<Record<number, number>>({});
  const [downloadingFiles, setDownloadingFiles] = useState<Record<number, boolean>>({});
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ id: number; fileName: string } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserFiles();
    }
  }, [user]);

  useEffect(() => {
    filterFiles();
  }, [searchTerm, files]);

  const filterFiles = () => {
    const filtered = files.filter(file =>
      file.fileName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFiles(filtered);
  };

  const fetchUserFiles = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await fileService.getFilesByOwner();
      setFiles(data);
      setFilteredFiles(data);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (fileId: number) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    setSelectedFile({ id: fileId, fileName: file.fileName });
    setIsShareModalOpen(true);
  };

  const handleShareSubmit = async (username: string) => {
    if (!selectedFile) return;

    try {
      setIsUpdating(true);
      await shareService.shareFile(selectedFile.id, username);
      toast.success(`File shared with ${username}`);
      setIsShareModalOpen(false);
      setSelectedFile(null);
    } catch (error) {
      handleApiError(error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (fileId: number) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      await fileService.deleteFile(fileId);
      setFiles(files => files.filter(f => f.id !== fileId));
      toast.success('File deleted successfully');
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleDownload = async (fileId: number, fileName: string) => {
    try {
      setDownloadingFiles(prev => ({ ...prev, [fileId]: true }));
      setDownloadProgress(prev => ({ ...prev, [fileId]: 0 }));

      const blob = await fileService.downloadFile(
        fileId,
        (progress) => {
          setDownloadProgress(prev => ({ ...prev, [fileId]: progress }));
        }
      );

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('File downloaded successfully');
    } catch (error) {
      handleApiError(error);
    } finally {
      setDownloadingFiles(prev => ({ ...prev, [fileId]: false }));
      setDownloadProgress(prev => ({ ...prev, [fileId]: 0 }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center mb-6">
          <Download className="w-12 h-12 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-center mb-6">Your Files</h2>

        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search files by name..."
              className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {filteredFiles.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <FileIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>{searchTerm ? 'No matching files found' : 'No files found'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFiles.map((file) => (
              <FileListItem
                key={file.id}
                file={file}
                onShare={handleShare}
                onDelete={handleDelete}
                onDownload={handleDownload}
                isDownloading={!!downloadingFiles[file.id]}
                downloadProgress={downloadProgress[file.id] || 0}
              />
            ))}
          </div>
        )}

        {selectedFile && (
          <ShareModal
            isOpen={isShareModalOpen}
            onClose={() => {
              setIsShareModalOpen(false);
              setSelectedFile(null);
            }}
            onShare={handleShareSubmit}
            fileName={selectedFile.fileName}
            fileId={selectedFile.id}
          />
        )}
      </div>
    </div>
  );
}