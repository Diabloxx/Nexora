import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { joinServer } from '../../store/slices/serverSlice';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Handle pending invite after user logs in
    if (user) {
      const pendingInvite = localStorage.getItem('pendingInvite');
      if (pendingInvite) {
        localStorage.removeItem('pendingInvite');
        dispatch(joinServer(pendingInvite))
          .unwrap()
          .then(() => {
            console.log('Successfully joined server via pending invite');
          })
          .catch((error) => {
            console.error('Failed to join server via pending invite:', error);
          });
      }
    }
  }, [user, dispatch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-nexora-900 via-nexora-800 to-nexora-700 flex items-center justify-center p-4">
      <div className="bg-bg-modal rounded-xl shadow-2xl w-full max-w-md p-8 border border-nexora-700/30">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/logo-trans.png" 
              alt="Nexora Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold bg-nexora-gradient bg-clip-text text-transparent mb-2">
            Nexora
          </h1>
          <p className="text-gray-400">
            {isLogin ? 'Welcome back to Nexora!' : 'Join the Nexora community'}
          </p>
        </div>

        {isLogin ? <LoginForm /> : <RegisterForm />}

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-nexora-400 hover:text-nexora-300 text-sm font-medium transition-colors"
          >
            {isLogin 
              ? "Don't have an account? Sign up" 
              : 'Already have an account? Sign in'
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;