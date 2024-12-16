import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fileService, handleApiError } from '../services/api';

export function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    try {
      await fileService.uploadFile(file, user.name);
      toast.success('File uploaded successfully!');
      setFile(null);
      // Reset the file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      handleApiError(error, 'Error uploading file');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center mb-6">
          <Upload className="w-12 h-12 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-center mb-6">Upload File</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <input
              type="file"
              id="file-upload"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">
                {file ? file.name : 'Click to select a file'}
              </span>
              <span className="text-xs text-gray-500 mt-1">
                {file && `Size: ${(file.size / 1024).toFixed(2)} KB`}
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={!file}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Upload File
          </button>
        </form>
      </div>
    </div>
  );
}