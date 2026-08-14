import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';
import model from '../assets/bgsignin.jpg';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { signInUser } = UserAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();

    setLoading(true);
    try {
      const result = await signInUser(email, password);

      if (result.success) {
        navigate('/');
      } else {
        setError('Incorrect email or password');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div>
      <div className="relative min-h-screen bg-center bg-cover flex justify-center items-center" style={{ backgroundImage: `url(${model})` }}>
        <div className="absolute inset-0 bg-[#ecf1f4]/70"></div>

        <div className="overflow-hidden rounded-lg relative z-10 sm:w-[400px] w-[350px] bg-white shadow-lg">
          <div className="p-6">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-semibold">Log in</h2>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              {error && <p className="text-[#ff0000] text-center mt-4 text-sm">{error}</p>}

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="Enter your email address"
                  className="mt-1 block w-full rounded-md border border-gray-300 p-3 text-sm shadow-sm focus:border-[#3E9B61] focus:outline-none focus:ring-1 focus:ring-[#3E9B61] duration-200"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <button type="button" className="text-xs font-medium text-purple-600 hover:text-purple-500">
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="mt-1 block w-full rounded-md border border-gray-300 p-3 text-sm shadow-sm focus:border-[#3E9B61] focus:outline-none focus:ring-1 focus:ring-[#3E9B61] duration-200"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-md bg-[#56bb7c] py-3 text-sm font-medium text-white hover:bg-[#3E9B61] duration-200 disabled:opacity-50"
                >
                  {loading ? 'LOGGING IN...' : 'LOG IN'}
                </button>
              </div>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <Link to="/signup" className="font-medium text-purple-600 hover:text-purple-500">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;