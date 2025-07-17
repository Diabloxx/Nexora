import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { getCurrentUser } from './store/slices/authSlice';
import { notificationService } from './services/notificationService';
import AuthPage from './components/auth/AuthPage';
import MainApp from './components/MainApp';
import LoadingScreen from './components/common/LoadingScreen';
import InvitePage from './components/invite/InvitePage';
import LandingPage from './components/LandingPage';
import AdminPanel from './components/AdminPanel';

function App() {
  const { user, isLoading } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Check for existing token and validate user
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(getCurrentUser());
    }
    
    // Request notification permission
    notificationService.requestPermission().then(permission => {
      console.log('Notification permission:', permission);
    });
  }, [dispatch]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <div className="h-screen bg-gray-800">
        <Routes>
          {/* Landing page - public route */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Invite route - accessible without authentication */}
          <Route path="/invite/:inviteCode" element={<InvitePage />} />
          
          {/* Authentication route */}
          <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/app" replace />} />
          
          {/* Admin panel - requires admin/staff permissions */}
          <Route path="/admin" element={
            user && (user.globalRole === 'admin' || user.globalRole === 'staff') ? 
              <AdminPanel /> : 
              <Navigate to="/auth" replace />
          } />
          
          {/* Main application routes */}
          <Route path="/app/*" element={user ? <MainApp /> : <Navigate to="/auth" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
