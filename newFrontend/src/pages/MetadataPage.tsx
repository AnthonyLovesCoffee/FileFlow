import { useState } from 'react';
import { FileSearch, Loader, FileIcon, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fileService, handleApiError } from '../services/api';
import type { FileMetadata } from '../types/file';

export function MetadataPage() {
  const [searchTag, setSearchTag] = useState('');
  const [metadata, setMetadata] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchTag.trim()) {
      toast.error('Please enter a tag to search');
      return;
    }

    try {
      setLoading(true);
      const data = await fileService.getFilesByTag(searchTag);
      setMetadata(data);
      setHasSearched(true);
      if (data.length === 0) {
        toast.info('No files found with this tag');
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
        <h2 className="text-2xl font-bold text-center mb-6">Search Files by Tag</h2>

        <div className="mb-8">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Tag className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value)}
                placeholder="Enter tag to search"
                className="w-full h-10 pl-10 pr-3 rounded-md border border-gray-300 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
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
                <p>No files found with tag: {searchTag}</p>
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
                      <div className="mt-2 flex flex-wrap gap-2">
                        {file.tags?.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-700"
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </span>
                        ))}
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