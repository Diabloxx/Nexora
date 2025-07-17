import React, { useEffect, useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
  return (
    <div className="flex h-screen bg-nexora-dark overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-glow-purple opacity-30 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none"></div>
      
      {/* Modern Server List Sidebar */}
      <div className="w-20 bg-sidebar-gradient border-r border-purple-800/30 flex flex-col items-center py-6 space-y-4 overflow-y-auto backdrop-blur-lg relative z-20">{/* Increased z-index */}ver, setCurrentChannel, createServer } from '../store/slices/serverSlice';
import { socketService } from '../services/socketService';
import { Plus, Hash, VolumeX, Settings, Mic, Headphones } from 'lucide-react';
import ChatArea from './chat/ChatArea';
import MembersList from './members/MembersList';
import ServerSettingsModal from './server/ServerSettingsModal';

const MainApp: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const serverState = useAppSelector((state) => state.servers);
  const dispatch = useAppDispatch();

  const [showCreateServerModal, setShowCreateServerModal] = useState(false);
  const [showServerManagementModal, setShowServerManagementModal] = useState(false);
  const [newServerName, setNewServerName] = useState('');

  // Debug logging for modal state
  console.log('Modal state - showCreateServerModal:', showCreateServerModal);
  console.log('Modal state - showServerManagementModal:', showServerManagementModal);

  // Type-safe access to server state
  const servers = (serverState as any)?.servers || [];
  const currentServer = (serverState as any)?.currentServer || null;
  const currentChannel = (serverState as any)?.currentChannel || null;
  const isLoading = (serverState as any)?.isLoading || false;

  // Create a welcome server if no servers exist
  const welcomeServer = useMemo(() => ({
    id: 'welcome',
    name: 'Nexora Welcome',
    description: 'Welcome to Nexora!',
    owner: user?.id || 'system',
    members: [],
    roles: [],
    invites: [],
    isPublic: false,
    memberCount: 1,
    channels: [
      { 
        id: 'welcome-general', 
        name: 'general', 
        type: 'text' as const, 
        server: 'welcome',
        position: 0,
        nsfw: false,
        rateLimitPerUser: 0,
        topic: 'Welcome to Nexora! Start your journey here.' 
      },
      { 
        id: 'welcome-announcements', 
        name: 'announcements', 
        type: 'text' as const, 
        server: 'welcome',
        position: 1,
        nsfw: false,
        rateLimitPerUser: 0,
        topic: 'Important announcements and updates' 
      },
      { 
        id: 'welcome-voice', 
        name: 'General Voice', 
        type: 'voice' as const,
        server: 'welcome',
        position: 2,
        nsfw: false,
        rateLimitPerUser: 0
      }
    ]
  }), [user?.id]);

  const displayServers = servers.length > 0 ? servers : [welcomeServer];
  const displayCurrentServer = currentServer || (servers.length === 0 ? welcomeServer : null);

  useEffect(() => {
    // Connect to socket when user is authenticated
    if (user) {
      const token = localStorage.getItem('token');
      if (token) {
        socketService.connect(token);
        dispatch(fetchUserServers());
      }
    }

    return () => {
      socketService.disconnect();
    };
  }, [user, dispatch]);

  // Auto-select welcome server and channel if no servers exist
  useEffect(() => {
    if (servers.length === 0 && !currentServer) {
      dispatch(setCurrentServer(welcomeServer as any));
      dispatch(setCurrentChannel(welcomeServer.channels[0] as any));
    }
  }, [servers.length, currentServer, dispatch, welcomeServer]);

  const handleServerSelect = (server: any) => {
    console.log('Selecting server:', server);
    console.log('Server ID:', server.id || server._id);
    dispatch(setCurrentServer(server));
    // Automatically select first text channel
    const firstTextChannel = server.channels?.find((ch: any) => ch.type === 'text');
    if (firstTextChannel) {
      console.log('Selected channel:', firstTextChannel);
      dispatch(setCurrentChannel(firstTextChannel));
    } else {
      console.log('No text channels found in server:', server);
    }
  };

  const handleChannelSelect = (channel: any) => {
    console.log('Selected channel:', channel);
    dispatch(setCurrentChannel(channel));
  };

  const handleCreateServer = async () => {
    if (newServerName.trim()) {
      try {
        console.log('Creating server:', newServerName.trim());
        const resultAction = await dispatch(createServer({ 
          name: newServerName.trim(),
          description: `${newServerName.trim()} server` 
        }));
        
        console.log('Create server result:', resultAction);
        
        if (createServer.fulfilled.match(resultAction)) {
          console.log('Server created successfully:', resultAction.payload);
          console.log('Server channels:', resultAction.payload.channels);
          setShowCreateServerModal(false);
          setNewServerName('');
          // Select the newly created server
          dispatch(setCurrentServer(resultAction.payload));
          // Select the first text channel
          const firstTextChannel = resultAction.payload.channels?.find((ch: any) => ch.type === 'text');
          console.log('First text channel:', firstTextChannel);
          if (firstTextChannel) {
            dispatch(setCurrentChannel(firstTextChannel));
          }
        } else if (createServer.rejected.match(resultAction)) {
          console.error('Server creation rejected:', resultAction.payload);
          alert('Failed to create server: ' + resultAction.payload);
        }
      } catch (error) {
        console.error('Failed to create server:', error);
        alert('Failed to create server: ' + error);
      }
    }
  };

  return (
    <div className="flex h-screen bg-nexora-dark overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-glow-purple opacity-30 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none"></div>
      
      {/* Modern Server List Sidebar */}
      <div className="w-20 bg-sidebar-gradient border-r border-purple-800/30 flex flex-col items-center py-6 space-y-4 overflow-y-auto backdrop-blur-lg relative z-10">
        {/* Nexora Home Button */}
        <div className="relative group">
          <div className="w-16 h-16 bg-nexora-gradient rounded-3xl flex items-center justify-center shadow-2xl hover:rounded-2xl transition-all duration-300 cursor-pointer transform hover:scale-110 hover:shadow-purple-500/50 ring-2 ring-purple-500/20 hover:ring-purple-400/40">
            <img 
              src="/logo-trans.png" 
              alt="Nexora Logo" 
              className="w-12 h-12 object-contain drop-shadow-2xl"
            />
          </div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"></div>
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-nexora-gradient rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"></div>
        </div>
        
        <div className="w-12 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
        
        {/* Enhanced Server List */}
        {displayServers.map((server: any) => (
          <div
            key={server.id}
            onClick={() => handleServerSelect(server)}
            className="relative group"
          >
            <div
              className={`w-16 h-16 rounded-3xl flex items-center justify-center font-bold cursor-pointer transition-all duration-300 transform hover:scale-110 hover:rounded-2xl shadow-xl ring-2 ${
                (currentServer?.id || displayCurrentServer?.id) === server.id 
                  ? 'bg-nexora-gradient rounded-2xl scale-110 shadow-2xl shadow-purple-500/50 ring-purple-400/50' 
                  : 'bg-gradient-to-br from-purple-800/60 to-purple-900/80 hover:from-purple-700/70 hover:to-purple-800/90 backdrop-blur-lg ring-purple-700/30 hover:ring-purple-500/40 hover:shadow-purple-500/30'
              }`}
            >
              {server.icon ? (
                <img src={server.icon} alt={server.name} className="w-16 h-16 rounded-3xl object-cover" />
              ) : (
                <span className="text-white text-2xl drop-shadow-2xl font-bold">{server.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            
            {/* Enhanced Active Server Indicator */}
            {(currentServer?.id || displayCurrentServer?.id) === server.id && (
              <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-2 h-10 bg-purple-400 rounded-r-full shadow-xl animate-pulse"></div>
            )}
            
            {/* Enhanced Hover Effect */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"></div>
            
            {/* Glow Effect */}
            <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl ${
              (currentServer?.id || displayCurrentServer?.id) === server.id 
                ? 'bg-nexora-gradient' 
                : 'bg-purple-600'
            }`}></div>
          </div>
        ))}
        
        {/* Enhanced Add Server Button */}
        <div className="relative group z-50">
          <div 
            onClick={() => {
              console.log('Add server button clicked!');
              setShowCreateServerModal(true);
            }}
            className="w-16 h-16 bg-gradient-to-br from-emerald-500/30 to-green-600/40 rounded-3xl flex items-center justify-center cursor-pointer hover:from-emerald-400/40 hover:to-green-500/50 transition-all duration-300 hover:rounded-2xl transform hover:scale-110 border-2 border-emerald-500/40 backdrop-blur-lg shadow-xl hover:shadow-emerald-500/30 ring-2 ring-emerald-600/20 hover:ring-emerald-400/40 relative z-10"
          >
            <Plus className="w-10 h-10 text-emerald-300 drop-shadow-2xl group-hover:rotate-90 transition-transform duration-300 pointer-events-none" />
          </div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg pointer-events-none"></div>
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-emerald-500 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl pointer-events-none"></div>
        </div>
        
        {/* Debug Test Button */}
        <button 
          onClick={() => {
            console.log('Debug test button clicked!');
            setShowCreateServerModal(true);
          }}
          className="w-16 h-16 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors z-50 relative"
        >
          TEST
        </button>
      </div>
      
      {/* Modern Channel List */}
      {(currentServer || displayCurrentServer) && (
        <div className="w-72 bg-gradient-to-b from-purple-900/20 to-purple-950/30 border-r border-purple-800/30 flex flex-col backdrop-blur-sm">
          {/* Enhanced Server Header */}
          <div className="h-18 border-b border-purple-700/30 px-6 py-4 bg-gradient-to-r from-purple-900/30 to-purple-800/20 backdrop-blur-sm">
            <div className="flex items-center justify-between group">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-nexora-gradient rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/25 ring-2 ring-purple-500/20">
                    <span className="text-white font-bold text-lg drop-shadow-lg">
                      {(currentServer || displayCurrentServer)?.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-purple-900 shadow-lg"></div>
                </div>
                <div className="flex-1">
                  <h1 className="text-white font-bold text-xl truncate drop-shadow-lg group-hover:text-purple-200 transition-colors">
                    {(currentServer || displayCurrentServer)?.name}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-purple-300 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      {(currentServer || displayCurrentServer)?.memberCount || 0} members
                    </span>
                    <span className="text-purple-400">
                      • Online now
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowServerManagementModal(true)}
                className="text-purple-400 hover:text-white hover:bg-purple-700/30 transition-all duration-200 p-3 rounded-xl group transform hover:scale-105"
                title="Server Settings"
              >
                <Settings className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
          </div>

          {/* Channel Categories */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Enhanced Text Channels */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-purple-300 font-semibold text-sm uppercase tracking-wider flex items-center">
                  <Hash className="w-4 h-4 mr-2" />
                  Text Channels
                </h2>
                <Plus className="w-4 h-4 text-purple-400 hover:text-purple-200 cursor-pointer transition-all duration-200 hover:scale-110 transform hover:rotate-90" />
              </div>
              <div className="space-y-2">
                {/* Enhanced Default channels if no channels exist */}
                {(!(currentServer || displayCurrentServer)?.channels || (currentServer || displayCurrentServer)?.channels.length === 0) && (
                  <>
                    <div
                      onClick={() => handleChannelSelect({ id: 'general', name: 'general', type: 'text' })}
                      className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-200 group border border-transparent hover:border-purple-600/30 ${
                        currentChannel?.id === 'general'
                          ? 'bg-nexora-gradient text-white shadow-xl shadow-purple-500/25 transform scale-[1.02] border-purple-500/50'
                          : 'text-purple-200 hover:bg-purple-800/30 hover:text-white'
                      }`}
                    >
                      <Hash className="w-5 h-5 flex-shrink-0 group-hover:text-purple-300 transition-colors" />
                      <span className="font-medium truncate">general</span>
                      <div className="ml-auto flex items-center space-x-2">
                        {currentChannel?.id === 'general' && (
                          <div className="w-2 h-2 bg-purple-300 rounded-full animate-pulse shadow-lg"></div>
                        )}
                        <div className="text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          💬
                        </div>
                      </div>
                    </div>
                    <div
                      onClick={() => handleChannelSelect({ id: 'random', name: 'random', type: 'text' })}
                      className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-200 group border border-transparent hover:border-purple-600/30 ${
                        currentChannel?.id === 'random'
                          ? 'bg-nexora-gradient text-white shadow-xl shadow-purple-500/25 transform scale-[1.02] border-purple-500/50'
                          : 'text-purple-200 hover:bg-purple-800/30 hover:text-white'
                      }`}
                    >
                      <Hash className="w-5 h-5 flex-shrink-0 group-hover:text-purple-300 transition-colors" />
                      <span className="font-medium truncate">random</span>
                      <div className="ml-auto flex items-center space-x-2">
                        {currentChannel?.id === 'random' && (
                          <div className="w-2 h-2 bg-purple-300 rounded-full animate-pulse shadow-lg"></div>
                        )}
                        <div className="text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          🎲
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                {/* Enhanced Actual server channels */}
                {(currentServer || displayCurrentServer)?.channels?.filter((ch: any) => ch.type === 'text').map((channel: any) => (
                  <div
                    key={channel.id}
                    onClick={() => handleChannelSelect(channel)}
                    className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-200 group border border-transparent hover:border-purple-600/30 ${
                      currentChannel?.id === channel.id
                        ? 'bg-nexora-gradient text-white shadow-xl shadow-purple-500/25 transform scale-[1.02] border-purple-500/50'
                        : 'text-purple-200 hover:bg-purple-800/30 hover:text-white'
                    }`}
                  >
                    <Hash className="w-5 h-5 flex-shrink-0 group-hover:text-purple-300 transition-colors" />
                    <span className="font-medium truncate">{channel.name}</span>
                    <div className="ml-auto flex items-center space-x-2">
                      {currentChannel?.id === channel.id && (
                        <div className="w-2 h-2 bg-purple-300 rounded-full animate-pulse shadow-lg"></div>
                      )}
                      <div className="text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        💬
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Voice Channels */}
            {(currentServer || displayCurrentServer)?.channels?.filter((ch: any) => ch.type === 'voice').length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-purple-300 font-semibold text-sm uppercase tracking-wider flex items-center">
                    <VolumeX className="w-4 h-4 mr-2" />
                    Voice Channels
                  </h2>
                  <Plus className="w-4 h-4 text-purple-400 hover:text-purple-200 cursor-pointer transition-colors hover:scale-110 transform" />
                </div>
                <div className="space-y-2">
                  {(currentServer || displayCurrentServer)?.channels?.filter((ch: any) => ch.type === 'voice').map((channel: any) => (
                    <div
                      key={channel.id}
                      className="flex items-center space-x-3 p-3 rounded-xl text-purple-200 hover:bg-purple-800/30 hover:text-white cursor-pointer transition-all duration-200 group border border-transparent hover:border-purple-600/30"
                    >
                      <VolumeX className="w-5 h-5 flex-shrink-0 group-hover:text-purple-300 transition-colors" />
                      <span className="font-medium truncate">{channel.name}</span>
                      <div className="ml-auto flex items-center space-x-2">
                        <div className="text-purple-400 text-xs bg-purple-800/30 px-2 py-1 rounded-lg">
                          0/∞
                        </div>
                        <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Modern User Info Panel */}
          <div className="h-16 bg-gradient-to-r from-purple-950/40 to-purple-900/30 border-t border-purple-700/30 backdrop-blur-lg">
            <div className="flex items-center px-4 h-full">
              {/* User Avatar */}
              <div className="relative">
                <div className="w-10 h-10 bg-nexora-gradient rounded-xl flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-purple-500/20">
                  {user?.displayName?.[0] || 'U'}
                </div>
                {/* Online Status */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-purple-900 shadow-lg"></div>
              </div>
              
              {/* User Info */}
              <div className="flex-1 min-w-0 ml-3">
                <div className="text-white text-sm font-semibold truncate drop-shadow-lg">
                  {user?.displayName || 'User'}
                </div>
                <div className="text-purple-300 text-xs truncate">
                  #{user?.username || 'unknown'}
                </div>
              </div>
              
              {/* Control Buttons */}
              <div className="flex items-center space-x-1">
                <button 
                  className="p-2 text-purple-300 hover:text-white hover:bg-purple-700/30 rounded-lg transition-all duration-200 hover:scale-105 group"
                  title="Mute/Unmute"
                >
                  <Mic className="w-4 h-4 group-hover:drop-shadow-lg" />
                </button>
                <button 
                  className="p-2 text-purple-300 hover:text-white hover:bg-purple-700/30 rounded-lg transition-all duration-200 hover:scale-105 group"
                  title="Deafen/Undeafen"
                >
                  <Headphones className="w-4 h-4 group-hover:drop-shadow-lg" />
                </button>
                <button 
                  className="p-2 text-purple-300 hover:text-white hover:bg-purple-700/30 rounded-lg transition-all duration-200 hover:scale-105 group"
                  title="User Settings"
                >
                  <Settings className="w-4 h-4 group-hover:drop-shadow-lg" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content Area with Enhanced Empty States */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-purple-950/20 to-purple-900/10 backdrop-blur-sm">
        {currentChannel ? (
          <ChatArea channel={currentChannel} />
        ) : (currentServer || displayCurrentServer) ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 bg-nexora-gradient rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/25">
                <Hash className="w-12 h-12 text-white drop-shadow-lg" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3 drop-shadow-lg">
                Welcome to {(currentServer || displayCurrentServer)?.name}
              </h2>
              <p className="text-purple-300 text-lg mb-6 leading-relaxed">
                Select a channel from the sidebar to start your conversation journey
              </p>
              <div className="bg-gradient-to-r from-purple-800/20 to-purple-700/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-600/20">
                <p className="text-purple-200 text-sm">
                  💬 Text channels for conversations<br/>
                  🔊 Voice channels for real-time chat<br/>
                  ⚡ Real-time messaging powered by Nexora
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-lg">
              <div className="w-32 h-32 bg-nexora-gradient rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-purple-500/25 animate-bounce-subtle">
                <img 
                  src="/logo-trans.png" 
                  alt="Nexora Logo" 
                  className="w-20 h-20 object-contain drop-shadow-2xl"
                />
              </div>
              <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
                Welcome to Nexora
              </h2>
              <p className="text-purple-300 text-xl mb-8 leading-relaxed">
                Your gateway to seamless real-time communication
              </p>
              {displayServers.length === 0 && (
                <div className="space-y-4">
                  <button
                    onClick={() => setShowCreateServerModal(true)}
                    className="bg-nexora-gradient hover:bg-nexora-gradient-hover text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-xl shadow-purple-500/25 backdrop-blur-sm"
                  >
                    Create Your First Server
                  </button>
                  <p className="text-purple-400 text-sm">
                    Start building your community today
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Members List - Show only when in a channel */}
      {currentChannel && (
        <MembersList server={currentServer || displayCurrentServer} />
      )}
      
      {/* Enhanced Create Server Modal */}
      {showCreateServerModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-900/90 to-purple-950/90 backdrop-blur-xl rounded-2xl p-8 w-full max-w-md border border-purple-700/30 shadow-2xl shadow-purple-500/20">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-nexora-gradient rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Plus className="w-8 h-8 text-white drop-shadow-lg" />
              </div>
              <h2 className="text-white text-2xl font-bold mb-2 drop-shadow-lg">Create Server</h2>
              <p className="text-purple-300">Build your community and start connecting with others!</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-purple-200 text-sm font-medium mb-2">
                  Server Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your server name..."
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateServer()}
                  className="w-full bg-purple-800/30 border border-purple-600/50 text-white rounded-xl px-4 py-3 backdrop-blur-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 placeholder-purple-400"
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateServerModal(false);
                    setNewServerName('');
                  }}
                  className="px-6 py-3 text-purple-300 hover:text-white hover:bg-purple-800/30 rounded-xl transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateServer}
                  disabled={!newServerName.trim() || isLoading}
                  className="px-6 py-3 bg-nexora-gradient hover:bg-nexora-gradient-hover text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg shadow-purple-500/25 transform hover:scale-105"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </div>
                  ) : (
                    'Create Server'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Server Management Modal */}
      {showServerManagementModal && (currentServer || displayCurrentServer) && (
        <ServerSettingsModal
          isOpen={showServerManagementModal}
          onClose={() => setShowServerManagementModal(false)}
          server={currentServer || displayCurrentServer}
        />
      )}
    </div>
  );
};

export default MainApp;
