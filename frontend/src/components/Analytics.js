import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import axios from 'axios';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { FaChartBar } from 'react-icons/fa';

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

function Analytics() {
  const [analytics, setAnalytics] = useState({
    posted: 0,
    scheduled: 0,
    canceled: 0,
    posts_by_day: {},
  });
  const { user } = useAuth();

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;
      try {
        const response = await axios.get('http://localhost:5000/api/analytics', {
          params: { user_urn: user.urn },
        });
        setAnalytics(response.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      }
    };
    fetchAnalytics();
  }, [user]);

  const pieData = {
    labels: ['Posted', 'Scheduled', 'Canceled'],
    datasets: [
      {
        data: [analytics.posted, analytics.scheduled, analytics.canceled],
        backgroundColor: ['#34D399', '#3B82F6', '#EF4444'],
        hoverBackgroundColor: ['#2DD4BF', '#60A5FA', '#F87171'],
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { color: '#1F2937' } },
      tooltip: { backgroundColor: '#1F2937' },
    },
  };

  const barData = {
    labels: Object.keys(analytics.posts_by_day),
    datasets: [
      {
        label: 'Posts Posted',
        data: Object.values(analytics.posts_by_day),
        backgroundColor: '#3B82F6',
        borderColor: '#2563EB',
        borderWidth: 1,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    scales: {
      x: { ticks: { color: '#1F2937' } },
      y: { ticks: { color: '#1F2937' }, beginAtZero: true },
    },
    plugins: {
      legend: { labels: { color: '#1F2937' } },
      tooltip: { backgroundColor: '#1F2937' },
    },
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-blue-800 mb-6 flex items-center">
        <FaChartBar className="mr-2" /> LinkedIn Analytics Dashboard
      </h2>
      <p className="text-gray-600 mb-4">Analytics for: {user?.urn}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-4 bg-green-100 rounded-md text-center">
          <h3 className="text-lg font-semibold text-green-800">Posts Posted</h3>
          <p className="text-3xl font-bold text-green-600">{analytics.posted}</p>
        </div>
        <div className="p-4 bg-blue-100 rounded-md text-center">
          <h3 className="text-lg font-semibold text-blue-800">Posts Scheduled</h3>
          <p className="text-3xl font-bold text-blue-600">{analytics.scheduled}</p>
        </div>
        <div className="p-4 bg-red-100 rounded-md text-center">
          <h3 className="text-lg font-semibold text-red-800">Posts Canceled</h3>
          <p className="text-3xl font-bold text-red-600">{analytics.canceled}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Post Status Distribution</h3>
          <Pie data={pieData} options={pieOptions} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Posts Posted (Last 7 Days)</h3>
          <Bar data={barData} options={barOptions} />
        </div>
      </div>
    </div>
  );
}

export default Analytics;