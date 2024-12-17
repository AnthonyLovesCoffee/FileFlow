import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate('/'); // Redirect to home page after successful login
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    }
  };

  return (
      <div className="min-h-screen flex items-center justify-center">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
          <h2 className="text-2xl mb-6 text-center">Login</h2>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <div className="mb-4">
            <label htmlFor="email" className="block mb-2">Email</label>
            <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block mb-2">Password</label>
            <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
            />
          </div>
          <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            Login
          </button>
        </form>
      </div>
  );
};
