import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Upload, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fileService, handleApiError } from '../services/api';
import { ProgressBar } from '../components/ProgressBar';
import { formatFileSize } from '../utils/formatters';

export function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [currentTag, setCurrentTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const { user } = useAuth();

  // Separate handler for tag input
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent default behavior
      if (currentTag.trim()) {
        if (!tags.includes(currentTag.trim())) {
          setTags([...tags, currentTag.trim()]);
        }
        setCurrentTag('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Append each tag individually
      tags.forEach((tag, index) => {
        formData.append(`tags[${index}]`, tag);
      });

      const fileId = await fileService.uploadFile(file, formData, (progress) => {
        setUploadProgress(progress);
      });

      toast.success(`File uploaded successfully! (ID: ${fileId})`);
      setFile(null);
      setTags([]);
      setUploadProgress(0);

      // reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      handleApiError(error, 'Error uploading file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center mb-6">
            <Upload className="w-12 h-12 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-center mb-6">Upload File</h2>

          {/* File Selection Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
            <input
                type="file"
                id="file-upload"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                disabled={isUploading}
            />
            <label
                htmlFor="file-upload"
                className={`flex flex-col items-center justify-center ${!isUploading ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            >
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">
              {file ? file.name : 'Click to select a file'}
            </span>
              <span className="text-xs text-gray-500 mt-1">
              {file && `Size: ${formatFileSize(file.size)}`}
            </span>
            </label>
          </div>

          {/* Tag Input Area - Outside the form */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Tags (Press Enter to add)
            </label>
            <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Enter tags..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isUploading}
            />
            {/* Display Tags */}
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag, index) => (
                  <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-700"
                  >
                {tag}
                    <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-blue-900"
                    >
                  <X className="w-4 h-4" />
                </button>
              </span>
              ))}
            </div>
          </div>

          {/* Upload Form */}
          <form onSubmit={handleSubmit}>
            {isUploading && (
                <div className="space-y-2 mb-4">
                  <ProgressBar progress={uploadProgress} />
                  <p className="text-sm text-center text-gray-600">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
            )}

            <button
                type="submit"
                disabled={!file || isUploading}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Upload File'}
            </button>
          </form>
        </div>
      </div>
  );
}