import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaCheck } from 'react-icons/fa';

function PostReview({ posts, onPostSelected }) {
  const [selectedPost, setSelectedPost] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const navigate = useNavigate();

  const handleSelect = (post) => {
    setSelectedPost(post);
    setEditedContent(post);
  };

  const handleSubmit = () => {
    if (selectedPost) {
      onPostSelected(editedContent);
      setSelectedPost(null);
      setEditedContent('');
      navigate('/schedule');
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-blue-800 mb-6 flex items-center">
        <FaEye className="mr-2" /> Review LinkedIn Posts
      </h2>
      {posts && posts.length > 0 ? (
        <>
          <div className="space-y-6 mb-6">
            {posts.map((post, index) => (
              <div
                key={index}
                className="p-6 bg-gray-50 rounded-md border shadow-sm flex flex-col justify-between hover:bg-gray-100 transition"
              >
                <div className="text-gray-800 max-h-48 overflow-y-auto mb-4 whitespace-pre-wrap break-words">
                  {post}
                </div>
                <button
                  onClick={() => handleSelect(post)}
                  className="self-end bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition flex items-center"
                >
                  <FaCheck className="mr-2" /> Select
                </button>
              </div>
            ))}
          </div>
          {selectedPost && (
            <div className="mt-6">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                maxLength={3000}
                className="w-full p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-y"
                placeholder="Edit your selected post here..."
              />
              <p className="text-sm text-gray-600 mt-2">{editedContent.length}/3000 characters</p>
              <button
                onClick={handleSubmit}
                className="mt-4 w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition font-semibold flex items-center justify-center"
              >
                <FaCheck className="mr-2" /> Schedule Post
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="text-gray-600">No posts generated yet.</p>
      )}
    </div>
  );
}

export default PostReview;