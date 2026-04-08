'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardTab from '@/components/dashboard/DashboardTab';
import UploadTab from '@/components/dashboard/UploadTab';
import ChatTab from '@/components/dashboard/ChatTab';
import QATab from '@/components/dashboard/QATab';
import ReportsTab from '@/components/dashboard/ReportsTab';

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [enableXAI, setEnableXAI] = useState(true);
  const [includeReferences, setIncludeReferences] = useState(true);

  if (!session) {
    router.push('/login');
    return null;
  }

  const tabs = [
    { label: '🏠 Dashboard', component: DashboardTab },
    { label: '📤 Upload & Analysis', component: UploadTab },
    { label: '💬 Collaboration', component: ChatTab },
    { label: '❓ Q&A', component: QATab },
    { label: '📊 Reports', component: ReportsTab },
  ];

  const ActiveComponent = tabs[activeTab].component;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🏥 Advanced Medical Image Analysis
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, <span className="font-semibold">{session.user?.name}</span>!
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={enableXAI}
                    onChange={(e) => setEnableXAI(e.target.checked)}
                    className="rounded"
                  />
                  🔬 Explainable AI
                </label>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={includeReferences}
                    onChange={(e) => setIncludeReferences(e.target.checked)}
                    className="rounded"
                  />
                  📚 Medical References
                </label>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-200">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`flex-1 px-6 py-4 text-sm font-medium transition ${
                  activeTab === index
                    ? 'border-b-2 border-purple-600 text-purple-600 bg-purple-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <ActiveComponent
              enableXAI={enableXAI}
              includeReferences={includeReferences}
              setActiveTab={setActiveTab}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
