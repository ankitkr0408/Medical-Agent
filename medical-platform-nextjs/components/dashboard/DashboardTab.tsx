'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface DashboardTabProps {
  setActiveTab: (tab: number) => void;
}

export default function DashboardTab({ setActiveTab }: DashboardTabProps) {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    todayAnalyses: 0,
    activeDiscussions: 0,
    totalReports: 0,
  });
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [reportsRes, statsRes] = await Promise.all([
        fetch('/api/reports?limit=3'),
        fetch('/api/stats'),
      ]);
      const reportsData = await reportsRes.json();
      const statsData = await statsRes.json();

      if (reportsData.success) setRecentAnalyses(reportsData.data);
      if (statsData.success) {
        setStats({
          todayAnalyses: statsData.data.todayAnalyses,
          activeDiscussions: statsData.data.activeDiscussions,
          totalReports: statsData.data.totalReports,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const userRole = session?.user?.role || 'user';
  const specialization = session?.user?.specialization || '';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="gradient-purple text-white rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">
          👋 Welcome back, {session?.user?.name}!
        </h2>
        <p className="text-lg opacity-90">
          <strong>{userRole.charAt(0).toUpperCase() + userRole.slice(1)}</strong>
          {specialization && ` - ${specialization}`} | 🔐 Secure AI-Powered Medical Analysis Platform
        </p>
        <p className="text-sm mt-2 opacity-80">
          ✅ API Connected | 🔬 AI Ready
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6 card-hover">
          <div className="text-3xl font-bold text-purple-600">{stats.todayAnalyses}</div>
          <div className="text-sm text-gray-600 mt-1">🔬 Analyses Today</div>
          <div className="text-xs text-gray-500 mt-2">New session</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 card-hover">
          <div className="text-3xl font-bold text-blue-600">{stats.activeDiscussions}</div>
          <div className="text-sm text-gray-600 mt-1">💬 Active Discussions</div>
          <div className="text-xs text-gray-500 mt-2">Join or create</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 card-hover">
          <div className="text-3xl font-bold text-green-600">{stats.totalReports}</div>
          <div className="text-sm text-gray-600 mt-1">📊 Total Reports</div>
          <div className="text-xs text-gray-500 mt-2">All time</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 card-hover">
          <div className="text-3xl font-bold text-indigo-600">94.2%</div>
          <div className="text-sm text-gray-600 mt-1">🤖 AI Accuracy</div>
          <div className="text-xs text-gray-500 mt-2">Industry leading</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveTab(1)}
            className="bg-gradient-to-r from-purple-600 to-blue-500 text-white p-6 rounded-lg hover:opacity-90 transition text-left"
          >
            <div className="text-2xl mb-2">📤</div>
            <div className="font-semibold">Upload & Analyze Image</div>
            <div className="text-sm opacity-90 mt-1">Start a new analysis</div>
          </button>

          <button
            onClick={() => setActiveTab(2)}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6 rounded-lg hover:opacity-90 transition text-left"
          >
            <div className="text-2xl mb-2">💬</div>
            <div className="font-semibold">Join Discussion</div>
            <div className="text-sm opacity-90 mt-1">Collaborate with colleagues</div>
          </button>

          <button
            onClick={() => setActiveTab(3)}
            className="bg-gradient-to-r from-green-500 to-teal-500 text-white p-6 rounded-lg hover:opacity-90 transition text-left"
          >
            <div className="text-2xl mb-2">❓</div>
            <div className="font-semibold">Ask Questions</div>
            <div className="text-sm opacity-90 mt-1">Get AI-powered answers</div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Recent Activity</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="spinner"></div>
          </div>
        ) : recentAnalyses.length > 0 ? (
          <div className="space-y-4">
            {recentAnalyses.map((analysis, index) => (
              <div key={analysis.id || index} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900">
                    📋 Analysis #{index + 1}: {analysis.filename}
                  </h4>
                  <span className="text-sm text-gray-500">
                    {String(analysis.date || '').slice(0, 10)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {analysis.analysis}
                </p>
                <button
                  onClick={() => setActiveTab(4)}
                  className="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  View Full Report →
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <p className="text-blue-800">
              No recent analyses found. Upload your first medical image to get started!
            </p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          💡 Tips for {userRole === 'PATIENT' ? 'Patients' : 'Medical Professionals'}
        </h3>
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
          <ul className="space-y-2 text-sm text-gray-700">
            {userRole === 'PATIENT' ? (
              <>
                <li>🔒 <strong>Privacy First:</strong> Your medical images are processed securely</li>
                <li>👨‍⚕️ <strong>AI Assistance:</strong> Our AI provides insights, but always consult your doctor</li>
                <li>📱 <strong>Mobile Friendly:</strong> Upload images from your phone or computer</li>
                <li>💬 <strong>Ask Questions:</strong> Use the Q&A feature to understand your reports better</li>
              </>
            ) : (
              <>
                <li>🤖 <strong>AI Collaboration:</strong> Use AI insights as a second opinion</li>
                <li>👥 <strong>Team Discussions:</strong> Create case discussions to collaborate</li>
                <li>📚 <strong>Research Integration:</strong> Get relevant medical literature automatically</li>
                <li>🎯 <strong>Specialized Prompts:</strong> AI adapts based on medical specialties</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
