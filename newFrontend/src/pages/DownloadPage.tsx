import { useState, useEffect } from 'react';
import { Download,FileIcon, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { fileService, handleApiError } from '../services/api';



interface FileInfo {
    id: string;
    fileName: string;
    fileSize: number;
    uploadDate: string;
  }
  
  export function DownloadPage() {
    const [files, setFiles] = useState<FileInfo[]>([]);
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

  
    useEffect(() => {
      if (user?.name) {
        fetchUserFiles();
      }
    }, [user]);
  
    const fetchUserFiles = async () => {
    if (!user) return;
      try {
        // const response = await fetch(`${import.meta.env.VITE_REST_API_BASE}/files/${user?.name}`);
        // if (!response.ok) {
        //   throw new Error('Failed to fetch files');
        // }
        //  if (!user) return;
        setLoading(true);
        const data = await fileService.getFilesByOwner(user.name);
        setFiles(data);
      } catch (error) {
        toast.error('Error fetching files');
        console.error('Fetch error:', error);
      }
      finally {
        setLoading(false);
      }
    };
  
    const handleDownload = async (fileName: string) => {
        try {
          if (!user?.name) return;
          const blob = await fileService.downloadFile(user.name, fileName);
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          toast.success('File downloaded successfully!');
        } catch (error) {
          handleApiError(error);
          toast.error('Error downloading file');
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
    
            {files.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <FileIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No files found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <FileIcon className="w-6 h-6 text-gray-400" />
                      <div>
                        <p className="font-medium">{file.fileName}</p>
                        <p className="text-sm text-gray-500">
                          Size: {formatFileSize(file.fileSize)} • Uploaded:{' '}
                          {new Date(file.uploadDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(file.fileName)}
                      className="flex items-center space-x-1 text-blue-500 hover:text-blue-600"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}