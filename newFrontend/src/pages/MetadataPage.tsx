import { useState } from 'react';
import { FileSearch, Loader, FileIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fileService, handleApiError } from '../services/api';
import type { FileMetadata } from '../types/file';

export function MetadataPage() {
  const [owner, setOwner] = useState('');
  const [metadata, setMetadata] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!owner.trim()) {
      toast.error('Please enter an owner name');
      return;
    }

    try {
      setLoading(true);
      const data = await fileService.getFilesByOwner(owner);
      setMetadata(data);
      setHasSearched(true);
      if (data.length === 0) {
        toast.info('No files found for this owner');
      }
    } catch (error) {
      handleApiError(error, 'Error fetching metadata');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center mb-6">
          <FileSearch className="w-12 h-12 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-center mb-6">Search File Metadata</h2>

        <div className="mb-8">
          <div className="flex space-x-4">
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Enter owner name"
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                'Search'
              )}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : hasSearched && (
          <div className="space-y-4">
            {metadata.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <FileIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No files found for this owner</p>
              </div>
            ) : (
              metadata.map((file) => (
                <div
                  key={file.id}
                  className="p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <FileIcon className="w-6 h-6 text-gray-400" />
                    <div className="flex-1">
                      <p className="font-medium">{file.fileName}</p>
                      <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-gray-500">
                        <p>Size: {(file.fileSize / 1024).toFixed(2)} KB</p>
                        <p>Owner: {file.owner}</p>
                        <p>ID: {file.id}</p>
                        <p>Uploaded: {new Date(file.uploadDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}