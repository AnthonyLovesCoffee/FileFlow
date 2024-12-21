import { useState, useEffect } from 'react';
import { Users, Share2, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { shareService, fileService } from '../services/api';
import { SharedFileItem } from '../components/SharedFileItem';
import { ShareModal } from '../components/ShareModal';
import type { FileShare } from '../types/file';

export function SharesPage() {
  const [activeTab, setActiveTab] = useState<'shared-by-me' | 'shared-with-me'>('shared-by-me');
  const [sharedByMe, setSharedByMe] = useState<FileShare[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<FileShare[]>([]);
  const [loading, setLoading] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ id: number; fileName: string } | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<Record<number, number>>({});
  const [downloadingFiles, setDownloadingFiles] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadSharedFiles();
  }, [refreshTrigger]);

  const loadSharedFiles = async () => {
    if (isUpdating) return;

    try {
      setLoading(true);
      setIsUpdating(true);
      const [byMe, withMe] = await Promise.all([
        shareService.getFilesSharedByMe(),
        shareService.getFilesSharedWithMe()
      ]);
      setSharedByMe(byMe);
      setSharedWithMe(withMe);
    } catch (error) {
      console.error('Failed to load shared files:', error);
      toast.error('Failed to load shared files');
    } finally {
      setLoading(false);
      setIsUpdating(false);
    }
  };

  const handleShare = (fileId: number, fileName: string) => {
    console.log('handleShare called with:', { fileId, fileName });
    setSelectedFile({ id: fileId, fileName: fileName });
    setIsShareModalOpen(true);
  };

  const handleShareSubmit = async (username: string) => {
    if (!selectedFile) return;

    try {
      setIsUpdating(true);
      await shareService.shareFile(selectedFile.id, username);
      setIsShareModalOpen(false);
      setSelectedFile(null);
      toast.success(`File shared with ${username}`);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to share file');
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRevoke = async (fileId: number, username: string) => {
    if (!confirm(`Are you sure you want to revoke access for ${username}?`)) return;

    try {

      await shareService.revokeShare(fileId, username);
      toast.success('Share access revoked');
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Revoke error:', error);
      toast.error('Failed to revoke access');
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleDownload = async (fileId: number, fileName: string) => {
    console.log('Starting download with fileId:', fileId);

    try {
      setDownloadingFiles(prev => ({ ...prev, [fileId]: true }));
      setDownloadProgress(prev => ({ ...prev, [fileId]: 0 }));

      const blob = await fileService.downloadFile(
        fileId,
        (progress) => {
          console.log(`Progress update for file ${fileId}:`, progress);
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
      console.error('Download error:', error);
      toast.error('Failed to download file');
    } finally {
      setDownloadingFiles(prev => ({ ...prev, [fileId]: false }));
      setDownloadProgress(prev => ({ ...prev, [fileId]: 0 }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('shared-by-me')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'shared-by-me'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              Files I Shared
            </button>
            <button
              onClick={() => setActiveTab('shared-with-me')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'shared-with-me'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              Shared with Me
            </button>
          </nav>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'shared-by-me' ? (
              sharedByMe.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Share2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>You haven't shared any files yet</p>
                </div>
              ) : (
                sharedByMe.map((fileShare) => (
                  <SharedFileItem
                    key={`${fileShare.file.id}-${fileShare.sharedWithUsername}`}
                    file={fileShare}
                    type="shared-by-me"
                    onShare={() => handleShare(fileShare.file.id, fileShare.file.fileName)}
                    onRevoke={handleRevoke}
                  />
                ))
              )
            ) : (
              sharedWithMe.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Share2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No files have been shared with you</p>
                </div>
              ) : (
                sharedWithMe.map((sharedFile) => {
                  const fileId = sharedFile.file.id;
                  return (
                    <SharedFileItem
                      key={fileId}
                      file={sharedFile}
                      type="shared-with-me"
                      onDownload={handleDownload}
                      isDownloading={!!downloadingFiles[fileId]}
                      downloadProgress={downloadProgress[fileId] || 0}
                    />
                  );
                })
              )
            )}
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