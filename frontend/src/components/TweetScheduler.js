import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DateTimePicker from 'react-datetime-picker';
import { FaClock, FaCalendarAlt, FaTrash, FaTwitter } from 'react-icons/fa'; // Added FaTwitter

function TweetScheduler({ tweet }) {
  const [tag, setTag] = useState('');
  const [scheduledTime, setScheduledTime] = useState(new Date());
  const [scheduledTweets, setScheduledTweets] = useState([]);
  const navigate = useNavigate();

  const scheduleTweet = async () => {
    if (!tweet) return;
    try {
      await axios.post('http://localhost:5000/api/schedule-tweet', {
        content: tweet,
        tag,
        scheduled_time: scheduledTime.toISOString().replace('T', ' ').split('.')[0],
      });
      fetchScheduledTweets();
      setTag('');
      setScheduledTime(new Date());
      navigate('/');
    } catch (error) {
      console.error('Error scheduling tweet:', error);
    }
  };

  const cancelTweet = async (tweetId) => {
    try {
      const response = await axios.post('http://localhost:5000/api/cancel-tweet', { id: tweetId });
      if (response.data.success) {
        fetchScheduledTweets();
      } else {
        console.error('Failed to cancel tweet:', response.data.message);
      }
    } catch (error) {
      console.error('Error canceling tweet:', error);
    }
  };

  const fetchScheduledTweets = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/scheduled-tweets');
      setScheduledTweets(response.data.tweets);
    } catch (error) {
      console.error('Error fetching scheduled tweets:', error);
    }
  };

  useEffect(() => {
    fetchScheduledTweets();
    const interval = setInterval(fetchScheduledTweets, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-blue-800 mb-4 flex items-center">
        <FaClock className="mr-2" /> Schedule Tweet
      </h2>
      {tweet ? (
        <>
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Tweet to Schedule</label>
            <p className="p-3 bg-gray-50 rounded-md border text-gray-800">{tweet}</p>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2 flex items-center">
              <FaTwitter className="mr-2 text-blue-500" /> Tag
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
            />
          </div>
          <button
            onClick={scheduleTweet}
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition font-semibold flex items-center justify-center"
          >
            <FaClock className="mr-2" /> Schedule
          </button>
        </>
      ) : (
        <p className="text-gray-600">No tweet selected for scheduling.</p>
      )}
      <h3 className="text-xl font-semibold text-blue-800 mt-8 mb-4 flex items-center">
        <FaClock className="mr-2" /> Scheduled Tweets
      </h3>
      {scheduledTweets.length > 0 ? (
        <ul className="space-y-4">
          {scheduledTweets.map((t) => (
            <li
              key={t.id}
              className="p-4 bg-gray-50 rounded-md border flex justify-between items-center hover:bg-gray-100 transition"
            >
              <div>
                <p className="text-gray-800">{t.content}</p>
                <p className="text-sm text-gray-600">Tag: {t.tag} | Time: {t.scheduled_time}</p>
              </div>
              <button
                onClick={() => cancelTweet(t.id)}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition flex items-center"
              >
                <FaTrash className="mr-2" /> Cancel
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600">No scheduled tweets.</p>
      )}
    </div>
  );
}

export default TweetScheduler;