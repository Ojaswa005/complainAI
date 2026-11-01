import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';

import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { RightSidebar } from './components/common/RightSidebar';
import { BottomNav } from './components/common/BottomNav';
import { ToastContainer } from './components/common/Toast';

import { ComplaintModal } from './components/feed/ComplaintModal';
import { ReportModal } from './components/feed/ReportModal';
import { AuthModal } from './components/auth/AuthModal';
import { EditProfileModal } from './components/profile/EditProfileModal';
import { ConfirmModal } from './components/common/ConfirmModal';
import { FollowListModal } from './components/profile/FollowListModal';
import { QuoteRepostModal } from './components/feed/QuoteRepostModal';

import { LandingPage } from './pages/LandingPage';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { ComplaintDetailsPage } from './pages/ComplaintDetailsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SavedPage } from './pages/SavedPage';

const queryClient = new QueryClient();

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  if (isLandingPage) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Navbar />
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <div className="max-w-7xl mx-auto w-full px-2 sm:px-4 lg:px-8 flex-1 flex justify-center">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Center Main Feed */}
        <main className="flex-1 min-w-0 max-w-2xl px-2 sm:px-4 py-6">
          {children}
        </main>

        {/* Right Sidebar */}
        <RightSidebar />
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ModalProvider>
          <AppLayout>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/trending" element={<HomePage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/complaint/:id" element={<ComplaintDetailsPage />} />
              <Route path="/u/:username" element={<ProfilePage />} />
              <Route path="/saved" element={<SavedPage />} />
            </Routes>
          </AppLayout>

          {/* Global Modals */}
          <ComplaintModal />
          <ReportModal />
          <AuthModal />
          <EditProfileModal />
          <ConfirmModal />
          <FollowListModal />
          <QuoteRepostModal />
          <ToastContainer />
        </ModalProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
