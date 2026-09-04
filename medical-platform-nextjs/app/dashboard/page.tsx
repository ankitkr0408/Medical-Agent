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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const tabs = [
    { label: 'Dashboard', component: DashboardTab, icon: '🏠' },
    { label: 'Upload & Analysis', component: UploadTab, icon: '📤' },
    { label: 'Collaboration', component: ChatTab, icon: '💬' },
    { label: 'Q&A', component: QATab, icon: '❓' },
    { label: 'Reports', component: ReportsTab, icon: '📊' },
  ];

  const ActiveComponent = tabs[activeTab].component;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar — hidden on mobile */}
      <div className="hidden md:flex">
        <Sidebar>
          <SidebarHeader>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              {open && <span className="text-lg font-bold text-gray-900">Health IQ</span>}
            </Link>
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              {tabs.map((tab, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton isActive={activeTab === index} onClick={() => setActiveTab(index)}>
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
                  <span className="text-white text-sm font-bold">{session?.user?.name?.charAt(0).toUpperCase()}</span>
                </div>
                {open && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{session?.user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                  </div>
                )}
              </div>
              <Button variant="destructive" size="sm" className="w-full" onClick={() => signOut({ callbackUrl: '/' })}>
                {open ? 'Logout' : '🚪'}
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
          {/* Desktop sidebar trigger */}
          <div className="hidden md:block">
            <SidebarTrigger />
          </div>
          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMobileNavOpen(o => !o)}
            aria-label="Open navigation"
          >
            <span className="text-xl">☰</span>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base md:text-xl font-bold text-gray-900 truncate">
              {tabs[activeTab].icon} {tabs[activeTab].label}
            </h1>
          </div>
          {/* Mobile logout */}
          <button
            className="md:hidden text-xs text-red-600 border border-red-200 rounded-lg px-3 py-1.5"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            Logout
          </button>
        </header>

        {/* Mobile bottom nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 text-xs transition ${activeTab === index ? 'text-purple-600' : 'text-gray-400'}`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              <span className="text-[10px] leading-none truncate max-w-[48px]">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Mobile slide-in nav (for full labels + logout) */}
        {mobileNavOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div className="w-64 bg-white h-full shadow-xl flex flex-col p-4">
              <div className="flex items-center justify-between mb-6">
                <span className="font-bold text-gray-900">Health IQ</span>
                <button onClick={() => setMobileNavOpen(false)} className="text-gray-400 text-xl">✕</button>
              </div>
              <div className="flex-1 space-y-1">
                {tabs.map((tab, index) => (
                  <button
                    key={index}
                    onClick={() => { setActiveTab(index); setMobileNavOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition ${activeTab === index ? 'bg-purple-50 text-purple-700' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <span className="text-xl">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-sm font-bold">{session?.user?.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{session?.user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                  </div>
                </div>
                <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full py-2 bg-red-600 text-white rounded-lg text-sm font-medium">
                  Logout
                </button>
              </div>
            </div>
            <div className="flex-1 bg-black/40" onClick={() => setMobileNavOpen(false)} />
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-3 md:p-6 pb-20 md:pb-6">
          {activeTab === 0 && (
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 md:p-6 mb-4 md:mb-6 text-white">
              <h2 className="text-lg md:text-2xl font-bold mb-1">
                Welcome back, {session?.user?.name}! 👋
              </h2>
              <p className="text-blue-100 text-sm">
                Ready to analyze medical images with AI-powered precision
              </p>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 md:p-6">
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
