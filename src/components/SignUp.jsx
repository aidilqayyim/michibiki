import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import model from '../assets/bgsignin.jpg';
import { UserAuth } from '../context/AuthContext';

const SignUp = () => {
  const [fullname, setName] = useState('');
  const [tel, setTel] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { signUpNewUser } = UserAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (password || confirmPassword) {
      setPasswordsMatch(password === confirmPassword);
    } else {
      setPasswordsMatch(true);
    }
  }, [password, confirmPassword]);

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (password.length < 6 || confirmPassword.length < 6) {
      setError('Password must be minimum of 6 characters');
      return;
    } else if (!passwordsMatch) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const result = await signUpNewUser(fullname, tel, email, password);

      if (result.success) {
        navigate('/postsignin');
      } else {
        setError(result.message || "Signup completed but couldn't redirect");
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

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div>
      <div className="relative min-h-screen bg-center bg-cover flex justify-center items-center" style={{ backgroundImage: `url(${model})` }}>
        <div className="absolute inset-0 bg-[#ecf1f4]/70"></div>

        <div>
          <h1 className="relative z-10 text-[#373354] font-bold text-3xl text-center mb-5">
            Opportuni<span className="text-[#ffa500] text-4xl">U</span>
          </h1>

          <div className="overflow-hidden rounded-lg relative z-10 sm:w-[400px] w-[350px] bg-white shadow-lg">
            <div className="p-6">
              <div className="mb-6 text-center">
                <h2 className="text-xl font-semibold">Sign Up</h2>
              </div>

              <form onSubmit={handleSignUp} className="space-y-4">
                {error && <p className="text-[#ff0000] text-center mt-4 text-sm">{error}</p>}

                <div>
                  <input
                    onChange={(e) => setName(e.target.value)}
                    type="text"
                    placeholder="Full Name"
                    className="mt-1 block w-full rounded-md border border-gray-300 p-3 text-sm shadow-sm focus:border-[#3E9B61] focus:outline-none focus:ring-1 focus:ring-[#3E9B61] duration-200"
                  />
                </div>

                <div>
                  <input
                    onChange={(e) => setTel(e.target.value)}
                    type="tel"
                    placeholder="Phone Number"
                    className="mt-1 block w-full rounded-md border border-gray-300 p-3 text-sm shadow-sm focus:border-[#3E9B61] focus:outline-none focus:ring-1 focus:ring-[#3E9B61] duration-200"
                  />
                </div>

                <div>
                  <input
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="Email"
                    className="mt-1 block w-full rounded-md border border-gray-300 p-3 text-sm shadow-sm focus:border-[#3E9B61] focus:outline-none focus:ring-1 focus:ring-[#3E9B61] duration-200"
                  />
                </div>

                <div className="relative">
                  <input
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
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

                <div className="relative">
                  <input
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    className="mt-1 block w-full rounded-md border border-gray-300 p-3 text-sm shadow-sm focus:border-[#3E9B61] focus:outline-none focus:ring-1 focus:ring-[#3E9B61] duration-200"
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-md bg-[#56bb7c] py-3 text-sm font-medium text-white hover:bg-[#3E9B61] duration-200 disabled:opacity-50"
                  >
                    {loading ? 'SIGNING UP...' : 'Sign Up'}
                  </button>
                </div>
              </form>

              <div className="mt-4 text-center text-sm">
                <span className="text-gray-600">Already have an account? </span>
                <Link to="/" className="font-medium text-purple-600 hover:text-purple-500">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;