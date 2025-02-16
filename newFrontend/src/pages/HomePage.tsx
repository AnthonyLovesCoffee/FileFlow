import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Upload, Download, FileSearch, Share2 } from 'lucide-react';

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
          Welcome to FileFlow, {user}!
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <Link
            to="/upload"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-center mb-4">
              <Upload className="w-12 h-12 text-blue-500" />
            </div>
            <h2 className="text-xl font-semibold text-center mb-2">Upload Files</h2>
            <p className="text-gray-600 text-center">
              Securely upload your files to our FileFlow
            </p>
          </Link>

          <Link
            to="/download"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-center mb-4">
              <Download className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold text-center mb-2">Download Files</h2>
            <p className="text-gray-600 text-center">
              Access and download your files
            </p>
          </Link>

          <Link
            to="/shares"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-center mb-4">
              <Share2 className="w-12 h-12 text-orange-500" />
            </div>
            <h2 className="text-xl font-semibold text-center mb-2">Shared Files</h2>
            <p className="text-gray-600 text-center">
              Manage your shared files and access files shared with you
            </p>
          </Link>

          <Link
            to="/metadata"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-center mb-4">
              <FileSearch className="w-12 h-12 text-purple-500" />
            </div>
            <h2 className="text-xl font-semibold text-center mb-2">Search by Tags</h2>
            <p className="text-gray-600 text-center">
              Search and find files using tags
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}