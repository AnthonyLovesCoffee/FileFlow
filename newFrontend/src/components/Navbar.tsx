import { LogOut, Upload, Download, FileSearch } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-800">
              FileFlow
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/upload"
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                >
                  <Upload size={20} />
                  <span>Upload</span>
                </Link>
                <Link
                  to="/download"
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                >
                  <Download size={20} />
                  <span>Download</span>
                </Link>
                <Link
                  to="/metadata"
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                >
                  <FileSearch size={20} />
                  <span>Metadata</span>
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
                <span className="text-gray-600">Welcome, {user}</span>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                >
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                >
                  <span>Register</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}