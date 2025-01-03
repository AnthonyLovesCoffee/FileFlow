import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { checkServiceHealth } from '../utils/serviceHealth';

export const RegisterPage = () => {
    const { registerUser } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [serviceError, setServiceError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setServiceError(null);
        setSuccessMessage(null);

        if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
            toast.error('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            setPassword('');
            setConfirmPassword('');
            return;
        }

        try {
            setIsLoading(true);
            // Check service health first
            const isServiceAvailable = await checkServiceHealth(import.meta.env.VITE_AUTH_SERVICE_URL);
            if (!isServiceAvailable) {
                throw new Error('Authentication service is currently unavailable');
            }

            await registerUser(username, password);
            setSuccessMessage('Registration successful! Redirecting you to login page...');
            toast.success('Registration successful!');

            setTimeout(() => {
                navigate('/login');
            }, 1500);
        } catch (error) {
            if (error.message.includes('service is not available') ||
                error.message.includes('currently unavailable')) {
                setServiceError(error.message);
                toast.error(error.message, {
                    duration: 5000,
                    icon: '🔌'
                });
            } else {
                toast.error(error.message || 'Registration failed');
            }
            setPassword('');
            setConfirmPassword('');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                <div className="flex items-center justify-center mb-8">
                    <UserPlus className="w-12 h-12 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold text-center mb-6">Register for FileFlow</h2>

                {serviceError && (
                    <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700">
                        <p className="text-sm">{serviceError}</p>
                        <p className="text-xs mt-1">The system is starting up. Please wait a moment and try again.</p>
                    </div>
                )}

                {successMessage && (
                    <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 text-green-700">
                        <p className="text-sm">{successMessage}</p>
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                            required
                            disabled={isLoading}
                            autoComplete="off"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                            required
                            disabled={isLoading}
                            autoComplete="new-password"
                            minLength={8}
                        />
                    </div>
                    <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirm-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                            required
                            disabled={isLoading}
                            autoComplete="new-password"
                            minLength={8}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {isLoading ? 'Registering...' : 'Register'}
                    </button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-500 hover:text-blue-600">
                        Login here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;