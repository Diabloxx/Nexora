import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { 
  updateServerSettings, 
  createInvite, 
  fetchServerInvites, 
  deleteInvite, 
  kickMember, 
  banMember,
  deleteServer,
  leaveServer 
} from '../../store/slices/serverSlice';
import { 
  X, 
  Settings, 
  Users, 
  Link, 
  Trash2, 
  Copy, 
  Plus, 
  Crown, 
  UserMinus, 
  Ban,
  LogOut,
  AlertTriangle
} from 'lucide-react';
import { Server, Invite } from '../../store/slices/serverSlice';

interface ServerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  server: Server;
}

type SettingsTab = 'overview' | 'members' | 'invites' | 'delete';

const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({ isOpen, onClose, server }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState<SettingsTab>('overview');
  const [isLoading, setIsLoading] = useState(false);
  
  // Overview tab state
  const [serverName, setServerName] = useState(server.name);
  const [serverDescription, setServerDescription] = useState(server.description || '');
  const [isPublic, setIsPublic] = useState(server.isPublic);
  
  // Invites tab state
  const [invites, setInvites] = useState<Invite[]>(server.invites || []);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [inviteExpiry, setInviteExpiry] = useState('7d');
  const [inviteMaxUses, setInviteMaxUses] = useState('');
  
  // Member management state
  const [banReason, setBanReason] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    type: 'kick' | 'ban' | 'delete' | 'leave' | null;
    target?: string;
  }>({ type: null });

  const isOwner = server.owner === user?.id;

  useEffect(() => {
    if (isOpen && activeTab === 'invites') {
      dispatch(fetchServerInvites(server.id))
        .unwrap()
        .then((fetchedInvites) => {
          setInvites(fetchedInvites);
        })
        .catch(console.error);
    }
  }, [isOpen, activeTab, dispatch, server.id]);

  const handleUpdateServer = async () => {
    if (!isOwner) return;
    
    setIsLoading(true);
    try {
      await dispatch(updateServerSettings({
        serverId: server.id,
        name: serverName,
        description: serverDescription,
        isPublic
      })).unwrap();
    } catch (error) {
      console.error('Failed to update server:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvite = async () => {
    setIsCreatingInvite(true);
    try {
      const expiresAt = inviteExpiry !== 'never' 
        ? new Date(Date.now() + parseExpiration(inviteExpiry)).toISOString()
        : undefined;
      
      const newInvite = await dispatch(createInvite({
        serverId: server.id,
        maxUses: inviteMaxUses ? parseInt(inviteMaxUses) : undefined,
        expiresAt
      })).unwrap();
      
      setInvites(prev => [...prev, newInvite]);
      setInviteExpiry('7d');
      setInviteMaxUses('');
    } catch (error) {
      console.error('Failed to create invite:', error);
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const handleDeleteInvite = async (inviteCode: string) => {
    try {
      await dispatch(deleteInvite({ serverId: server.id, inviteCode })).unwrap();
      setInvites(prev => prev.filter(inv => inv.code !== inviteCode));
    } catch (error) {
      console.error('Failed to delete invite:', error);
    }
  };

  const handleKickMember = async (userId: string) => {
    try {
      await dispatch(kickMember({ serverId: server.id, userId })).unwrap();
      setShowConfirmDialog({ type: null });
    } catch (error) {
      console.error('Failed to kick member:', error);
    }
  };

  const handleBanMember = async (userId: string) => {
    try {
      await dispatch(banMember({ serverId: server.id, userId, reason: banReason })).unwrap();
      setShowConfirmDialog({ type: null });
      setBanReason('');
    } catch (error) {
      console.error('Failed to ban member:', error);
    }
  };

  const handleDeleteServer = async () => {
    try {
      await dispatch(deleteServer(server.id)).unwrap();
      onClose();
    } catch (error) {
      console.error('Failed to delete server:', error);
    }
  };

  const handleLeaveServer = async () => {
    try {
      await dispatch(leaveServer(server.id)).unwrap();
      onClose();
    } catch (error) {
      console.error('Failed to leave server:', error);
    }
  };

  const copyInviteLink = (code: string) => {
    const inviteLink = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(inviteLink);
    // TODO: Show toast notification
  };

  const parseExpiration = (duration: string): number => {
    const units: { [key: string]: number } = {
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '12h': 12 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    return units[duration] || units['7d'];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Settings },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'invites', label: 'Invites', icon: Link },
    { id: 'delete', label: isOwner ? 'Delete Server' : 'Leave Server', icon: isOwner ? Trash2 : LogOut },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-purple-900/90 to-purple-950/90 backdrop-blur-xl rounded-2xl w-full max-w-5xl h-5/6 flex border border-purple-700/30 shadow-2xl shadow-purple-500/20">
        {/* Enhanced Sidebar */}
        <div className="w-72 bg-gradient-to-b from-purple-900/50 to-purple-950/30 rounded-l-2xl p-6 border-r border-purple-700/30 backdrop-blur-lg">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-nexora-gradient rounded-2xl flex items-center justify-center shadow-xl ring-2 ring-purple-500/20">
                <span className="text-white font-bold text-lg drop-shadow-lg">
                  {server.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-white font-bold text-lg truncate drop-shadow-lg">{server.name}</h2>
                <p className="text-purple-300 text-sm">Server Settings</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-purple-400 hover:text-white p-2 hover:bg-purple-700/30 rounded-xl transition-all duration-200 transform hover:scale-110"
            >
              <X size={20} />
            </button>
          </div>
          
          <nav className="space-y-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl text-left transition-all duration-200 transform hover:scale-[1.02] ${
                    activeTab === tab.id 
                      ? 'bg-nexora-gradient text-white shadow-lg shadow-purple-500/25 ring-2 ring-purple-400/30' 
                      : 'text-purple-200 hover:bg-purple-800/30 hover:text-white border border-transparent hover:border-purple-600/30'
                  }`}
                >
                  <Icon size={18} className={`${activeTab === tab.id ? 'drop-shadow-lg' : ''}`} />
                  <span className={`font-medium ${activeTab === tab.id ? 'drop-shadow-lg' : ''}`}>{tab.label}</span>
                </button>
              );
            })}
          </nav>
          
          {/* Server Info */}
          <div className="mt-8 p-4 bg-gradient-to-r from-purple-800/20 to-purple-700/10 rounded-xl border border-purple-600/30">
            <div className="text-purple-200 text-sm">
              <div className="flex justify-between">
                <span>Members:</span>
                <span className="font-medium">{server.memberCount || 0}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Created:</span>
                <span className="font-medium">{formatDate(new Date().toISOString())}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Your Role:</span>
                <span className={`font-medium ${isOwner ? 'text-yellow-300' : 'text-purple-300'}`}>
                  {isOwner ? 'Owner' : 'Member'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Main content */}
        <div className="flex-1 p-8 overflow-y-auto bg-gradient-to-br from-purple-950/20 to-purple-900/10 rounded-r-2xl">
          {activeTab === 'overview' && (
            <div>
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-10 h-10 bg-nexora-gradient rounded-xl flex items-center justify-center shadow-lg">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white drop-shadow-lg">Server Overview</h3>
              </div>
              
              <div className="space-y-8">
                <div className="bg-gradient-to-r from-purple-800/20 to-purple-700/10 p-6 rounded-2xl border border-purple-600/30 backdrop-blur-sm">
                  <label className="block text-lg font-semibold text-purple-200 mb-3">
                    Server Name
                  </label>
                  <input
                    type="text"
                    value={serverName}
                    onChange={(e) => setServerName(e.target.value)}
                    disabled={!isOwner}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    placeholder="Server name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={serverDescription}
                    onChange={(e) => setServerDescription(e.target.value)}
                    disabled={!isOwner}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    placeholder="Tell people what this server is about..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    disabled={!isOwner}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-600 rounded bg-gray-700"
                  />
                  <label htmlFor="isPublic" className="ml-2 text-sm text-gray-300">
                    Make this server discoverable
                  </label>
                </div>

                {isOwner && (
                  <div className="flex justify-end">
                    <button
                      onClick={handleUpdateServer}
                      disabled={isLoading}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-6">
                Members ({server.members.length})
              </h3>
              
              <div className="space-y-3">
                {server.members.map((member) => (
                  <div
                    key={member.user.id}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {member.user.displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium">
                            {member.user.displayName}
                          </span>
                          {member.user.id === server.owner && (
                            <Crown size={14} className="text-yellow-500" />
                          )}
                        </div>
                        <span className="text-gray-400 text-sm">
                          @{member.user.username}
                        </span>
                      </div>
                    </div>
                    
                    {isOwner && member.user.id !== server.owner && member.user.id !== user?.id && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setShowConfirmDialog({ type: 'kick', target: member.user.id })}
                          className="p-1 text-yellow-500 hover:text-yellow-400"
                          title="Kick Member"
                        >
                          <UserMinus size={16} />
                        </button>
                        <button
                          onClick={() => setShowConfirmDialog({ type: 'ban', target: member.user.id })}
                          className="p-1 text-red-500 hover:text-red-400"
                          title="Ban Member"
                        >
                          <Ban size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'invites' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Invites</h3>
                <button
                  onClick={handleCreateInvite}
                  disabled={isCreatingInvite}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <Plus size={16} />
                  <span>Create Invite</span>
                </button>
              </div>

              {/* Create invite form */}
              <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <h4 className="text-white font-medium mb-4">Create New Invite</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Max Uses (optional)
                    </label>
                    <input
                      type="number"
                      value={inviteMaxUses}
                      onChange={(e) => setInviteMaxUses(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Unlimited"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Expires After
                    </label>
                    <select
                      value={inviteExpiry}
                      onChange={(e) => setInviteExpiry(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="30m">30 minutes</option>
                      <option value="1h">1 hour</option>
                      <option value="6h">6 hours</option>
                      <option value="12h">12 hours</option>
                      <option value="1d">1 day</option>
                      <option value="7d">7 days</option>
                      <option value="30d">30 days</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Invites list */}
              <div className="space-y-3">
                {invites.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No invites created yet</p>
                ) : (
                  invites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                    >
                      <div>
                        <div className="flex items-center space-x-3">
                          <code className="px-2 py-1 bg-gray-600 rounded text-sm text-green-400">
                            {invite.code}
                          </code>
                          <button
                            onClick={() => copyInviteLink(invite.code)}
                            className="text-gray-400 hover:text-white"
                            title="Copy invite link"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          Created by {invite.createdBy.displayName} • {formatDate(invite.createdAt)}
                          {invite.maxUses && ` • ${invite.uses}/${invite.maxUses} uses`}
                          {invite.expiresAt && ` • Expires ${formatDate(invite.expiresAt)}`}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteInvite(invite.code)}
                        className="text-red-500 hover:text-red-400"
                        title="Delete invite"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'delete' && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-6">
                {isOwner ? 'Delete Server' : 'Leave Server'}
              </h3>
              
              <div className="bg-red-900 bg-opacity-50 border border-red-700 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="text-red-500 mt-1" size={20} />
                  <div>
                    <h4 className="text-red-400 font-medium mb-2">
                      {isOwner ? 'Delete Server' : 'Leave Server'}
                    </h4>
                    <p className="text-gray-300 mb-4">
                      {isOwner 
                        ? 'Are you sure you want to delete this server? This action cannot be undone. All channels, messages, and member data will be permanently lost.'
                        : 'Are you sure you want to leave this server? You can rejoin with an invite link if available.'
                      }
                    </p>
                    <button
                      onClick={() => setShowConfirmDialog({ 
                        type: isOwner ? 'delete' : 'leave' 
                      })}
                      className={`px-4 py-2 rounded-md font-medium ${
                        isOwner 
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                      }`}
                    >
                      {isOwner ? 'Delete Server' : 'Leave Server'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation dialog */}
      {showConfirmDialog.type && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              {showConfirmDialog.type === 'kick' && 'Kick Member'}
              {showConfirmDialog.type === 'ban' && 'Ban Member'}
              {showConfirmDialog.type === 'delete' && 'Delete Server'}
              {showConfirmDialog.type === 'leave' && 'Leave Server'}
            </h3>
            
            <p className="text-gray-300 mb-4">
              {showConfirmDialog.type === 'kick' && 'Are you sure you want to kick this member?'}
              {showConfirmDialog.type === 'ban' && 'Are you sure you want to ban this member?'}
              {showConfirmDialog.type === 'delete' && 'This action cannot be undone.'}
              {showConfirmDialog.type === 'leave' && 'Are you sure you want to leave this server?'}
            </p>

            {showConfirmDialog.type === 'ban' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reason (optional)
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Reason for ban..."
                  rows={2}
                />
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDialog({ type: null })}
                className="px-4 py-2 text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (showConfirmDialog.type === 'kick' && showConfirmDialog.target) {
                    handleKickMember(showConfirmDialog.target);
                  } else if (showConfirmDialog.type === 'ban' && showConfirmDialog.target) {
                    handleBanMember(showConfirmDialog.target);
                  } else if (showConfirmDialog.type === 'delete') {
                    handleDeleteServer();
                  } else if (showConfirmDialog.type === 'leave') {
                    handleLeaveServer();
                  }
                }}
                className={`px-4 py-2 rounded-md font-medium ${
                  showConfirmDialog.type === 'delete' || showConfirmDialog.type === 'ban'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : showConfirmDialog.type === 'kick'
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {showConfirmDialog.type === 'kick' && 'Kick'}
                {showConfirmDialog.type === 'ban' && 'Ban'}
                {showConfirmDialog.type === 'delete' && 'Delete'}
                {showConfirmDialog.type === 'leave' && 'Leave'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerSettingsModal;
