import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Sidebar from './components/Sidebar';
import PostGenerator from './components/PostGenerator';
import PostReview from './components/PostReview';
import PostScheduler from './components/PostScheduler';
import Analytics from './components/Analytics';
import Login from './components/Login';
import axios from 'axios';

function AppContent() {
  const [posts, setPosts] = useState([]);
  const [post, setPost] = useState('');
  const { user, setAuthenticatedUser } = useAuth();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true); // Start with loading true

  useEffect(() => {
    console.log('useEffect - Initial user:', user);
    const query = new URLSearchParams(location.search);
    const authenticated = query.get('authenticated') === 'true';
    const userUrn = query.get('user_urn');

    if (authenticated && userUrn && !user) {
      console.log('useEffect - Authenticating with user_urn:', userUrn);
      setAuthenticatedUser(userUrn, '');
      axios.get('http://localhost:5000/api/analytics', { params: { user_urn: userUrn } })
        .then((response) => {
          console.log('useEffect - Analytics response:', response.data);
        })
        .catch((error) => {
          console.error('useEffect - Analytics error:', error.response?.data || error);
        })
        .finally(() => {
          console.log('useEffect - Authentication complete');
          setIsLoading(false);
        });
    } else {
      console.log('useEffect - No authentication needed or already authenticated');
      setIsLoading(false);
    }
  }, [location, setAuthenticatedUser, user]);

  console.log('AppContent render - user:', user, 'isLoading:', isLoading);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-6 ml-64">
        {user ? (
          <Routes>
            <Route path="/" element={<PostGenerator onPostsGenerated={(ps) => setPosts(ps)} />} />
            <Route path="/review" element={<PostReview posts={posts} onPostSelected={(ed) => setPost(ed)} />} />
            <Route path="/schedule" element={<PostScheduler post={post} />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;