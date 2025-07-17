import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { 
  Users, 
  Settings, 
  Shield, 
  BarChart3, 
  MessageSquare, 
  Bell,
  ArrowLeft,
  Search,
  Plus,
  Edit,
  Trash2,
  Crown,
  Star,
  AlertTriangle
} from 'lucide-react';

interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  globalRole: string;
  isOnline: boolean;
  createdAt: string;
  lastSeen: string;
  permissions: string[];
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: string;
  isActive: boolean;
  isPinned: boolean;
  targetAudience: string;
  publishedAt: string;
  author: {
    displayName: string;
  };
}

type AdminTab = 'overview' | 'users' | 'announcements' | 'settings';

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state: any) => state.auth);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    type: 'info',
    priority: 'normal',
    targetAudience: 'all',
    isPinned: false
  });

  // Check permissions
  useEffect(() => {
    if (!user || !['admin', 'owner', 'staff'].includes(user.globalRole)) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, announcementsRes] = await Promise.all([
        fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/admin/announcements', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.data || []);
      }

      if (announcementsRes.ok) {
        const announcementsData = await announcementsRes.json();
        setAnnouncements(announcementsData.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string, permissions: string[] = []) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ globalRole: newRole, permissions })
      });

      if (response.ok) {
        fetchData(); // Refresh data
      } else {
        alert('Failed to update user role');
      }
    } catch (error) {
      console.error('Failed to update user role:', error);
      alert('Failed to update user role');
    }
  };

  const createAnnouncement = async () => {
    try {
      const response = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newAnnouncement)
      });

      if (response.ok) {
        setShowCreateAnnouncement(false);
        setNewAnnouncement({
          title: '',
          content: '',
          type: 'info',
          priority: 'normal',
          targetAudience: 'all',
          isPinned: false
        });
        fetchData();
      } else {
        alert('Failed to create announcement');
      }
    } catch (error) {
      console.error('Failed to create announcement:', error);
      alert('Failed to create announcement');
    }
  };

  const deleteAnnouncement = async (announcementId: string) => {
    setConfirmDialog({
      show: true,
      title: 'Delete Announcement',
      message: 'Are you sure you want to delete this announcement? This action cannot be undone.',
      onConfirm: () => performDeleteAnnouncement(announcementId)
    });
  };

  const performDeleteAnnouncement = async (announcementId: string) => {
    setConfirmDialog({ ...confirmDialog, show: false });

    try {
      const response = await fetch(`/api/admin/announcements/${announcementId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        fetchData();
      } else {
        alert('Failed to delete announcement');
      }
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      alert('Failed to delete announcement');
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'text-red-400';
      case 'admin': return 'text-purple-400';
      case 'staff': return 'text-blue-400';
      case 'moderator': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'staff': return <Star className="w-4 h-4" />;
      case 'moderator': return <AlertTriangle className="w-4 h-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center space-x-3">
                <img 
                  src="/logo-trans.png" 
                  alt="Nexora Logo" 
                  className="w-8 h-8 object-contain"
                />
                <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
              </div>
              <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                {user?.globalRole?.toUpperCase()}
              </span>
            </div>
            <button
              onClick={() => navigate('/app')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Go to App
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 min-h-screen">
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Overview</span>
            </button>
            
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'users' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Users</span>
            </button>
            
            <button
              onClick={() => setActiveTab('announcements')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'announcements' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Bell className="w-5 h-5" />
              <span>Announcements</span>
            </button>
            
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-3xl font-bold text-white mb-8">Overview</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-blue-400 mr-3" />
                    <div>
                      <p className="text-gray-400 text-sm">Total Users</p>
                      <p className="text-2xl font-bold text-white">{users.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                  <div className="flex items-center">
                    <MessageSquare className="w-8 h-8 text-green-400 mr-3" />
                    <div>
                      <p className="text-gray-400 text-sm">Active Users</p>
                      <p className="text-2xl font-bold text-white">{users.filter(u => u.isOnline).length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                  <div className="flex items-center">
                    <Bell className="w-8 h-8 text-purple-400 mr-3" />
                    <div>
                      <p className="text-gray-400 text-sm">Announcements</p>
                      <p className="text-2xl font-bold text-white">{announcements.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
                <p className="text-gray-400">No recent activity to display.</p>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-white">User Management</h2>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {filteredUsers.map((userItem) => (
                        <tr key={userItem.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-white">{userItem.displayName}</div>
                              <div className="text-sm text-gray-400">@{userItem.username}</div>
                              <div className="text-xs text-gray-500">{userItem.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`flex items-center space-x-2 ${getRoleColor(userItem.globalRole)}`}>
                              {getRoleIcon(userItem.globalRole)}
                              <span className="text-sm font-medium capitalize">{userItem.globalRole}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              userItem.isOnline 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {userItem.isOnline ? 'Online' : 'Offline'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {new Date(userItem.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {user?.globalRole === 'owner' || (user?.globalRole === 'admin' && userItem.globalRole !== 'owner') ? (
                              <div className="flex items-center space-x-2">
                                <select
                                  value={userItem.globalRole}
                                  onChange={(e) => updateUserRole(userItem.id, e.target.value)}
                                  className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 text-sm"
                                >
                                  <option value="user">User</option>
                                  <option value="moderator">Moderator</option>
                                  <option value="staff">Staff</option>
                                  {user?.globalRole === 'owner' && <option value="admin">Admin</option>}
                                </select>
                              </div>
                            ) : (
                              <span className="text-gray-500">No access</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-white">Announcements</h2>
                <button
                  onClick={() => setShowCreateAnnouncement(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Announcement
                </button>
              </div>

              {showCreateAnnouncement && (
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-6">
                  <h3 className="text-xl font-bold text-white mb-4">Create New Announcement</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Announcement title..."
                      value={newAnnouncement.title}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                      className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none"
                    />
                    <textarea
                      placeholder="Announcement content..."
                      value={newAnnouncement.content}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                      rows={4}
                      className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none resize-none"
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <select
                        value={newAnnouncement.type}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, type: e.target.value })}
                        className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600"
                      >
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="success">Success</option>
                        <option value="error">Error</option>
                        <option value="update">Update</option>
                      </select>
                      <select
                        value={newAnnouncement.priority}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                        className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600"
                      >
                        <option value="low">Low Priority</option>
                        <option value="normal">Normal Priority</option>
                        <option value="high">High Priority</option>
                        <option value="critical">Critical Priority</option>
                      </select>
                      <select
                        value={newAnnouncement.targetAudience}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, targetAudience: e.target.value })}
                        className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600"
                      >
                        <option value="all">All Users</option>
                        <option value="users">Users Only</option>
                        <option value="staff">Staff Only</option>
                        <option value="admins">Admins Only</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center text-white">
                        <input
                          type="checkbox"
                          checked={newAnnouncement.isPinned}
                          onChange={(e) => setNewAnnouncement({ ...newAnnouncement, isPinned: e.target.checked })}
                          className="mr-2"
                        />
                        Pin this announcement
                      </label>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setShowCreateAnnouncement(false)}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={createAnnouncement}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">{announcement.title}</h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-400 mt-1">
                          <span>By {announcement.author.displayName}</span>
                          <span>•</span>
                          <span>{new Date(announcement.publishedAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className="capitalize">{announcement.type}</span>
                          {announcement.isPinned && (
                            <>
                              <span>•</span>
                              <span className="text-yellow-400">Pinned</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-gray-400 hover:text-white p-1">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteAnnouncement(announcement.id)}
                          className="text-gray-400 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-300">{announcement.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="text-3xl font-bold text-white mb-8">System Settings</h2>
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">Platform Configuration</h3>
                <p className="text-gray-400">System settings will be available in a future update.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">{confirmDialog.title}</h3>
            <p className="text-gray-300 mb-6">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDialog({ ...confirmDialog, show: false })}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
