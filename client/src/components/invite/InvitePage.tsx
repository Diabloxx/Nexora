import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { joinServer } from '../../store/slices/serverSlice';
import { Users, Hash, Shield } from 'lucide-react';
import LoadingScreen from '../common/LoadingScreen';

interface InviteInfo {
  server: {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    memberCount: number;
  };
  inviter: {
    username: string;
    displayName: string;
    avatar?: string;
  };
  channelName?: string;
}

const InvitePage: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInviteInfo = async () => {
      if (!inviteCode) return;
      
      try {
        // In a real implementation, you'd have an endpoint to get invite info without joining
        // For now, we'll simulate this
        setInviteInfo({
          server: {
            id: 'temp',
            name: 'Awesome Server',
            description: 'A great place to chat and collaborate',
            memberCount: 42
          },
          inviter: {
            username: 'john_doe',
            displayName: 'John Doe'
          },
          channelName: 'general'
        });
      } catch (err) {
        setError('Invalid or expired invite link');
      } finally {
        setLoading(false);
      }
    };

    fetchInviteInfo();
  }, [inviteCode]);

  const handleJoinServer = async () => {
    if (!inviteCode || !user) return;
    
    setJoining(true);
    try {
      await dispatch(joinServer(inviteCode)).unwrap();
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Failed to join server');
    } finally {
      setJoining(false);
    }
  };

  const handleLoginFirst = () => {
    // Store the invite code to join after login
    localStorage.setItem('pendingInvite', inviteCode || '');
    navigate('/auth');
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Invite Invalid</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => navigate(user ? '/app' : '/auth')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {user ? 'Go to App' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!inviteInfo) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Invite not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Server Icon */}
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-white">
              {inviteInfo.server.name[0]}
            </span>
          </div>

          {/* Server Info */}
          <h1 className="text-2xl font-bold text-white mb-2">
            {inviteInfo.server.name}
          </h1>
          
          {inviteInfo.server.description && (
            <p className="text-gray-400 mb-4">{inviteInfo.server.description}</p>
          )}

          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="flex items-center text-gray-400">
              <Users className="w-4 h-4 mr-1" />
              <span className="text-sm">{inviteInfo.server.memberCount} members</span>
            </div>
            {inviteInfo.channelName && (
              <div className="flex items-center text-gray-400">
                <Hash className="w-4 h-4 mr-1" />
                <span className="text-sm">{inviteInfo.channelName}</span>
              </div>
            )}
          </div>

          {/* Inviter Info */}
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <p className="text-gray-400 text-sm mb-2">Invited by</p>
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-sm font-bold text-white">
                  {inviteInfo.inviter.displayName[0]}
                </span>
              </div>
              <span className="text-white font-medium">{inviteInfo.inviter.displayName}</span>
            </div>
          </div>

          {/* Action Buttons */}
          {user ? (
            <button
              onClick={handleJoinServer}
              disabled={joining}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {joining ? 'Joining...' : 'Join Server'}
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-400 text-sm">You need to sign in to join this server</p>
              <button
                onClick={handleLoginFirst}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Sign In to Join
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvitePage;
