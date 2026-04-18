'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import DashboardTab from '@/components/dashboard/DashboardTab';
import UploadTab from '@/components/dashboard/UploadTab';
import ChatTab from '@/components/dashboard/ChatTab';
import QATab from '@/components/dashboard/QATab';
import ReportsTab from '@/components/dashboard/ReportsTab';

function DashboardContent() {
  const { data: session } = useSession();
  const { open } = useSidebar();
  const [activeTab, setActiveTab] = useState(0);


  const tabs = [
    { label: 'Dashboard', component: DashboardTab, icon: '🏠' },
    { label: 'Upload & Analysis', component: UploadTab, icon: '📤' },
    { label: 'Collaboration', component: ChatTab, icon: '💬' },
    { label: 'Q&A', component: QATab, icon: '❓' },
    { label: 'Reports', component: ReportsTab, icon: '📊' },
  ];

  const ActiveComponent = tabs[activeTab].component;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar>
        <SidebarHeader>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            {open && (
              <span className="text-lg font-bold text-gray-900">Health IQ</span>
            )}
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
            {tabs.map((tab, index) => (
              <SidebarMenuItem key={index}>
                <SidebarMenuButton
                  isActive={activeTab === index}
                  onClick={() => setActiveTab(index)}
                >
                  <span className="text-xl">{tab.icon}</span>
                  {open && <span>{tab.label}</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>


        </SidebarContent>

        <SidebarFooter>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-bold">
                  {session?.user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              {open && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {session?.user?.email}
                  </p>
                </div>
              )}
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              {open ? 'Logout' : '🚪'}
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              {tabs[activeTab].label}
            </h1>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          {activeTab === 0 && (
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-6 text-white">
              <h2 className="text-2xl font-bold mb-2">
                Welcome back, {session?.user?.name}! 👋
              </h2>
              <p className="text-blue-100">
                Ready to analyze medical images with AI-powered precision
              </p>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <ActiveComponent
              enableXAI={true}
              includeReferences={true}
              setActiveTab={setActiveTab}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <DashboardContent />
    </SidebarProvider>
  );
}
