import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { checkServiceHealth } from '../utils/serviceHealth';

export const LoginPage = () => {
  const { loginUser } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Clear previous errors
    setServiceError(null);
    setLoginError(null);

    // Validate inputs
    if (!username.trim() || !password.trim()) {
      setLoginError('Please enter both username and password');
      return;
    }

    setIsLoading(true);

    try {
      // Check service health first
      const isServiceAvailable = await checkServiceHealth(import.meta.env.VITE_AUTH_SERVICE_URL);
      if (!isServiceAvailable) {
        setServiceError('Authentication service is currently unavailable');
        return;
      }

      // Attempt login
      await loginUser(username, password);

      // Only navigate on success
      toast.success('Login successful!');
      navigate('/', { replace: true });
    } catch (error: any) {
      console.log('Login error:', error); // Debug log

      // Handle different types of errors
      if (error.message.includes('service') || error.message.includes('unavailable')) {
        setServiceError(error.message);
      } else if (error.message.includes('Invalid')) {
        setLoginError('Invalid username or password');
      } else if (error.message.includes('not found')) {
        setLoginError('User not found');
      } else {
        setLoginError(error.message || 'An unexpected error occurred');
      }

      // Show toast notification
      toast.error(error.message || 'Login failed', { duration: 5000 });

      // Clear only the password field
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <div className="flex items-center justify-center mb-8">
          <LogIn className="w-12 h-12 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-center mb-6">Login to FileFlow</h2>

        {serviceError && (
          <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700">
            <p className="text-sm">{serviceError}</p>
            <p className="text-xs mt-1">The system is starting up. Please wait a moment and try again.</p>
          </div>
        )}

        {loginError && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
            <p className="text-sm">{loginError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring focus:ring-blue-200
                ${loginError ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring focus:ring-blue-200
                ${loginError ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-500 hover:text-blue-600">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;