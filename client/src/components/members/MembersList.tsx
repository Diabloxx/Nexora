import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchServerMembers } from '../../store/slices/serverSlice';

interface MembersListProps {
  server: any;
}

const MembersList: React.FC<MembersListProps> = ({ server }) => {
  const { currentServer } = useAppSelector((state: any) => state.servers);
  const { user } = useAppSelector((state: any) => state.auth);
  const dispatch = useAppDispatch();

  const members = currentServer?.members || [];
  const onlineMembers = members.filter((member: any) => member.user?.isOnline !== false);
  const offlineMembers = members.filter((member: any) => member.user?.isOnline === false);

  useEffect(() => {
    if (server?.id && !server.id.startsWith('welcome')) {
      // Fetch server members when server changes (but not for welcome server)
      dispatch(fetchServerMembers(server.id));
    }
  }, [server?.id, dispatch]);

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-green-500';
    }
  };

  const getStatusText = (status: string | undefined, isOnline: boolean) => {
    if (!isOnline) return 'Offline';
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      case 'busy': return 'Do Not Disturb';
      case 'offline': return 'Offline';
      default: return 'Online';
    }
  };

  const renderMember = (member: any) => {
    const memberUser = member.user || member;
    const isCurrentUser = memberUser.id === user?.id || memberUser._id === user?.id;
    
    return (
      <div
        key={memberUser.id || memberUser._id}
        className="flex items-center space-x-3 py-3 px-3 rounded-xl hover:bg-purple-800/20 hover:backdrop-blur-sm cursor-pointer group transition-all duration-200 border border-transparent hover:border-purple-600/30"
      >
        <div className="relative">
          <div className="w-10 h-10 bg-nexora-gradient rounded-2xl flex items-center justify-center text-white text-sm font-bold shadow-lg ring-2 ring-purple-500/20">
            {memberUser.displayName?.[0] || memberUser.username?.[0] || 'U'}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(memberUser.status)} rounded-full border-2 border-purple-900 shadow-lg`}></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-semibold truncate drop-shadow-lg ${isCurrentUser ? 'text-yellow-300' : 'text-white'}`}>
            {memberUser.displayName || memberUser.username}
            {isCurrentUser && ' (you)'}
          </div>
          <div className="text-purple-300 text-xs truncate">
            {getStatusText(memberUser.status, memberUser.isOnline !== false)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-64 bg-gradient-to-b from-purple-900/30 to-purple-950/20 border-l border-purple-700/30 flex flex-col backdrop-blur-lg">
      {/* Enhanced Header */}
      <div className="p-6 border-b border-purple-700/30 bg-gradient-to-r from-purple-900/20 to-purple-800/10">
        <h2 className="text-white font-bold text-lg drop-shadow-lg">Members</h2>
        <div className="text-purple-300 text-sm">
          {!server?.id?.startsWith('welcome') ? 
            `${onlineMembers.length} online` : 
            'Preview Mode'
          }
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {server?.id?.startsWith('welcome') ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-nexora-gradient rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-purple-500/25">
              <span className="text-white text-2xl">👥</span>
            </div>
            <div className="text-purple-200 text-sm uppercase tracking-wide font-semibold mb-4">
              Preview Mode
            </div>
            <div className="text-purple-300 text-sm mb-6 leading-relaxed">
              Create your own server to see real members and build your community!
            </div>
            
            {/* Enhanced Current User Example */}
            <div className="bg-gradient-to-r from-purple-800/30 to-purple-700/20 rounded-2xl p-4 border border-purple-600/30 backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-nexora-gradient rounded-2xl flex items-center justify-center text-white text-sm font-bold shadow-lg ring-2 ring-purple-500/20">
                    {user?.displayName?.[0] || 'U'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-purple-900 shadow-lg"></div>
                </div>
                <div className="flex-1 text-left">
                  <div className="text-yellow-300 text-sm font-semibold drop-shadow-lg">{user?.displayName} (you)</div>
                  <div className="text-purple-300 text-xs">Online • Server Creator</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {onlineMembers.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
                  <div className="text-purple-200 text-xs uppercase tracking-wide font-semibold">
                    Online — {onlineMembers.length}
                  </div>
                </div>
                <div className="space-y-2">
                  {onlineMembers.map(renderMember)}
                </div>
              </div>
            )}
            
            {offlineMembers.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-3 h-3 bg-gray-500 rounded-full shadow-lg"></div>
                  <div className="text-purple-300 text-xs uppercase tracking-wide font-semibold">
                    Offline — {offlineMembers.length}
                  </div>
                </div>
                <div className="space-y-2">
                  {offlineMembers.map(renderMember)}
                </div>
              </div>
            )}
            
            {members.length === 0 && (
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-800/40 to-purple-700/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-600/30">
                  <span className="text-purple-300 text-2xl">👥</span>
                </div>
                <div className="text-purple-300 text-sm">No members found</div>
                <div className="text-purple-400 text-xs mt-1">Invite some friends to get started!</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MembersList;
