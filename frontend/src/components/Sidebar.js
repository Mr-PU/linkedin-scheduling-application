import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { FaLinkedin, FaEdit, FaEye, FaClock, FaSignOutAlt, FaChartBar, FaSignInAlt, FaUser } from 'react-icons/fa';

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="fixed top-0 left-0 w-64 h-full bg-blue-800 text-white shadow-lg flex flex-col">
      <div className="p-6 flex items-center space-x-2 border-b border-blue-700">
        <FaLinkedin className="text-3xl" />
        <h2 className="text-xl font-bold">LinkedInDash</h2>
      </div>
      <nav className="mt-6 flex-1">
        {user ? (
          <ul className="space-y-2">
            <li>
              <Link to="/" className="flex items-center p-4 hover:bg-blue-700 transition">
                <FaEdit className="mr-3" /> Generate
              </Link>
            </li>
            <li>
              <Link to="/review" className="flex items-center p-4 hover:bg-blue-700 transition">
                <FaEye className="mr-3" /> Review
              </Link>
            </li>
            <li>
              <Link to="/schedule" className="flex items-center p-4 hover:bg-blue-700 transition">
                <FaClock className="mr-3" /> Schedule
              </Link>
            </li>
            <li>
              <Link to="/analytics" className="flex items-center p-4 hover:bg-blue-700 transition">
                <FaChartBar className="mr-3" /> Analytics
              </Link>
            </li>
            <li>
              <button
                onClick={handleLogout}
                className="flex items-center w-full p-4 text-left hover:bg-red-700 transition"
              >
                <FaSignOutAlt className="mr-3" /> Logout
              </button>
            </li>
          </ul>
        ) : (
          <ul>
            <li>
              <Link to="/login" className="flex items-center p-4 hover:bg-blue-700 transition">
                <FaSignInAlt className="mr-3" /> Login
              </Link>
            </li>
          </ul>
        )}
      </nav>
      {user && (
        <div className="p-6 border-t border-blue-700">
          <div className="flex items-center space-x-2">
            <FaUser className="text-lg" />
            <div>
              <p className="text-sm font-semibold">{user.name || 'Unknown User'}</p>
              <p className="text-xs text-gray-300">{user.designation || 'No Designation'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;