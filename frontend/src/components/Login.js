import React from 'react';
import { useAuth } from '../AuthContext';
import { FaLinkedin } from 'react-icons/fa';

function Login() {
  const { loginWithLinkedIn } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-blue-800 text-center mb-6 flex items-center justify-center">
          <FaLinkedin className="mr-2" /> Login with LinkedIn
        </h2>
        <button
          onClick={loginWithLinkedIn}
          className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition font-semibold flex items-center justify-center"
        >
          <FaLinkedin className="mr-2" /> Sign in with LinkedIn
        </button>
      </div>
    </div>
  );
}

export default Login;