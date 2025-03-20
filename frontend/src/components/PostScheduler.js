import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import axios from 'axios';
import DateTimePicker from 'react-datetime-picker';
import { FaClock, FaCalendarAlt, FaTrash, FaLinkedin } from 'react-icons/fa';
import moment from 'moment'

function PostScheduler({ post }) {
  const [tag, setTag] = useState('');
  const [scheduledTime, setScheduledTime] = useState(new Date()); // Initial time
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [error, setError] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const schedulePost = async () => {
    console.log('schedulePost called - post:', post, 'user:', user);
    console.log('Scheduled time selected:', scheduledTime);
    if (!post || !user) {
      console.log('Early return - missing post or user');
      setError('Please select a post and ensure you are logged in.');
      return;
    }
    try {
      setError(null);
      const formattedTime = moment(scheduledTime).format('DD/MM/YYYY HH:mm:ss A') //scheduledTime.toISOString().replace('T', ' ').split('.')[0];
      console.log('Sending axios.post with:', {
        content: post,
        tag,
        scheduled_time: formattedTime,
        user_urn: user.urn,
      });
    //   return ;
      const response = await axios.post('http://localhost:5000/api/schedule-post', {
        content: post,
        tag,
        scheduled_time: formattedTime,
        user_urn: user.urn,
      });
      console.log('Schedule response:', response.data);
      fetchScheduledPosts();
      setTag('');
      setScheduledTime(new Date()); // Reset after success
      navigate('/');
    } catch (error) {
      console.error('Error scheduling post:', error.response?.data || error);
      setError(error.response?.data?.message || 'Failed to schedule post.');
    }
  };

  const fetchScheduledPosts = async () => {
    if (!user) {
      console.log('No user, skipping fetch');
      setFetchError('User not authenticated.');
      return;
    }
    try {
      console.log('Fetching scheduled posts for user_urn:', user.urn);
      const response = await axios.get('http://localhost:5000/api/scheduled-posts', {
        params: { user_urn: user.urn },
      });
      console.log('Scheduled posts response:', response.data);
      setScheduledPosts(response.data.posts);
      setFetchError(null);
    } catch (error) {
      console.error('Error fetching scheduled posts:', error.response?.data || error);
      setFetchError('Failed to load scheduled posts.');
    }
  };

  const cancelPost = async (postId) => {
    console.log('cancelPost called with postId:', postId);
    try {
      const response = await axios.post('http://localhost:5000/api/cancel-post', {
        id: postId,
      });
      console.log('Cancel response:', response.data);
      if (response.data.success) {
        fetchScheduledPosts();
      } else {
        setError(response.data.message || 'Failed to cancel post.');
      }
    } catch (error) {
      console.error('Error canceling post:', error.response?.data || error);
      setError(error.response?.data?.message || 'Failed to cancel post.');
    }
  };

  useEffect(() => {
    fetchScheduledPosts();
    const interval = setInterval(fetchScheduledPosts, 60000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-blue-800 mb-4 flex items-center">
        <FaClock className="mr-2" /> Schedule LinkedIn Post
      </h2>
      {post ? (
        <>
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Post to Schedule</label>
            <p className="p-3 bg-gray-50 rounded-md border text-gray-800">{post}</p>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2 flex items-center">
              <FaLinkedin className="mr-2 text-blue-500" /> Tag
            </label>
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Enter unique tag"
              className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2 flex items-center">
              <FaCalendarAlt className="mr-2 text-blue-500" /> Schedule Time
            </label>
            <DateTimePicker
              onChange={setScheduledTime}
              value={scheduledTime}
              className="w-full p-3 border rounded-md"
              minDate={new Date()} // Prevent past dates
              format="y-MM-dd HH:mm:ss" // Ensure clear format
            />
          </div>
          {error && (
            <p className="text-red-600 mb-4">{error}</p>
          )}
          <button
            onClick={schedulePost}
            disabled={!post || !user}
            className={`w-full py-3 rounded-md transition font-semibold flex items-center justify-center ${
              !post || !user
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <FaClock className="mr-2" /> Schedule
          </button>
        </>
      ) : (
        <p className="text-gray-600">No post selected for scheduling.</p>
      )}
      <h3 className="text-xl font-semibold text-blue-800 mt-8 mb-4">Scheduled Posts</h3>
      {fetchError ? (
        <p className="text-red-600">{fetchError}</p>
      ) : scheduledPosts.length > 0 ? (
        <ul className="space-y-4">
          {scheduledPosts.map((scheduledPost) => (
            <li key={scheduledPost.id} className="p-4 bg-gray-50 rounded-md border flex justify-between items-center">
              <div>
                <p className="text-gray-800 whitespace-pre-wrap">{scheduledPost.content}</p>
                <p className="text-sm text-gray-600">Scheduled: {scheduledPost.scheduled_time}</p>
                <p className="text-sm text-gray-600">Tag: {scheduledPost.tag}</p>
              </div>
              <button
                onClick={() => cancelPost(scheduledPost.id)}
                className="text-red-600 hover:text-red-800"
              >
                <FaTrash />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600">No posts scheduled yet.</p>
      )}
    </div>
  );
}

export default PostScheduler;