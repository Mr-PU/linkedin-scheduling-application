import React, { useState } from 'react';
import axios from 'axios';
import { FaPen } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

function PostGenerator({ onPostsGenerated }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('http://localhost:5000/api/generate-posts', { prompt });
      const generatedPosts = response.data.variations;
      console.log('Generated posts from backend:', generatedPosts);
      onPostsGenerated(generatedPosts);
      console.log('Navigating to /review');
      navigate('/review');
    } catch (error) {
      console.error('Error generating posts:', error.response?.data || error.message);
      setError('Failed to generate posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-blue-800 mb-4 flex items-center">
        <FaPen className="mr-2" /> Generate LinkedIn Posts
      </h2>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter a prompt for post generation..."
        className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows="16"
        disabled={loading}
      />
      {error && <p className="text-red-600 mt-2 mb-4">{error}</p>}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className={`mt-4 w-full py-3 rounded-md transition font-semibold flex items-center justify-center ${
          loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        <FaPen className="mr-2" />
        {loading ? 'Generating...' : 'Generate Posts'}
      </button>
    </div>
  );
}

export default PostGenerator;