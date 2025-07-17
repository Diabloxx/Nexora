import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { 
  MessageSquare, 
  Users, 
  Globe, 
  Shield, 
  Zap, 
  Heart,
  ArrowRight,
  Star,
  Play,
  CheckCircle,
  AlertCircle,
  Info,
  XCircle
} from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'update';
  priority: 'low' | 'normal' | 'high' | 'critical';
  author: {
    displayName: string;
    globalRole: string;
  };
  publishedAt: string;
  isPinned: boolean;
}

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/announcements/public');
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-400" />;
      case 'update': return <Star className="w-5 h-5 text-blue-400" />;
      default: return <Info className="w-5 h-5 text-gray-400" />;
    }
  };

  const getAnnouncementBorder = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-500/30';
      case 'warning': return 'border-yellow-500/30';
      case 'error': return 'border-red-500/30';
      case 'update': return 'border-blue-500/30';
      default: return 'border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation */}
      <nav className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
                src="/logo-trans.png" 
                alt="Nexora Logo" 
                className="w-10 h-10 object-contain"
              />
              <span className="ml-3 text-2xl font-bold text-white">Nexora</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <button
                    onClick={() => navigate('/app')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
                  >
                    Open App
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                  {(user.globalRole === 'admin' || user.globalRole === 'owner' || user.globalRole === 'staff') && (
                    <button
                      onClick={() => navigate('/admin')}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Admin Panel
                    </button>
                  )}
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => navigate('/auth')}
                    className="text-gray-300 hover:text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate('/auth')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                Welcome to{' '}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Nexora
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-12">
                The next-generation communication platform that brings teams together with 
                powerful real-time messaging, voice chat, and collaboration tools.
              </p>
              
              {!user && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                  <button
                    onClick={() => navigate('/auth')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors flex items-center"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                  <button className="flex items-center text-gray-300 hover:text-white px-6 py-4 rounded-lg font-medium transition-colors">
                    <Play className="w-5 h-5 mr-2" />
                    Watch Demo
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-3xl opacity-30 transform scale-150"></div>
                <img 
                  src="/mascot.png" 
                  alt="Nexora Mascot" 
                  className="relative w-80 h-80 md:w-96 md:h-96 object-contain animate-pulse"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-gray-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything you need to stay connected
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Powerful features designed to enhance communication and collaboration for teams of all sizes.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 hover:border-purple-500/50 transition-colors">
              <MessageSquare className="w-12 h-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Real-time Messaging</h3>
              <p className="text-gray-300">
                Lightning-fast messaging with rich media support, reactions, and thread conversations.
              </p>
            </div>
            
            <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 hover:border-blue-500/50 transition-colors">
              <Users className="w-12 h-12 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Team Collaboration</h3>
              <p className="text-gray-300">
                Create servers, channels, and organize your team with powerful role-based permissions.
              </p>
            </div>
            
            <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 hover:border-green-500/50 transition-colors">
              <Shield className="w-12 h-12 text-green-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Enterprise Security</h3>
              <p className="text-gray-300">
                End-to-end encryption, secure authentication, and comprehensive admin controls.
              </p>
            </div>
            
            <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 hover:border-yellow-500/50 transition-colors">
              <Zap className="w-12 h-12 text-yellow-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Lightning Fast</h3>
              <p className="text-gray-300">
                Optimized performance with instant message delivery and minimal latency.
              </p>
            </div>
            
            <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 hover:border-pink-500/50 transition-colors">
              <Globe className="w-12 h-12 text-pink-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Cross-Platform</h3>
              <p className="text-gray-300">
                Available on all your devices with seamless synchronization across platforms.
              </p>
            </div>
            
            <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 hover:border-red-500/50 transition-colors">
              <Heart className="w-12 h-12 text-red-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Community Focused</h3>
              <p className="text-gray-300">
                Built by the community, for the community. Open source and transparent development.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Announcements Section */}
      {announcements.length > 0 && (
        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Latest News</h2>
              <p className="text-lg text-gray-300">
                Stay updated with the latest announcements and updates from the Nexora team.
              </p>
            </div>
            
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading announcements...</p>
                </div>
              ) : announcements.length > 0 ? (
                announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`bg-gray-800 p-6 rounded-xl border ${getAnnouncementBorder(announcement.type)} ${
                    announcement.isPinned ? 'ring-2 ring-yellow-500/30' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getAnnouncementIcon(announcement.type)}
                      <div>
                        <h3 className="text-xl font-bold text-white">{announcement.title}</h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <span>By {announcement.author.displayName}</span>
                          <span>•</span>
                          <span>{new Date(announcement.publishedAt).toLocaleDateString()}</span>
                          {announcement.isPinned && (
                            <>
                              <span>•</span>
                              <span className="text-yellow-400 font-medium">Pinned</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{announcement.content}</p>
                </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No announcements available at this time.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {!user && (
        <section className="px-4 py-20 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-900/50 to-pink-900/50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to revolutionize your team communication?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of teams already using Nexora to collaborate more effectively.
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors inline-flex items-center"
            >
              Start Your Journey
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold">
                  N
                </div>
                <span className="ml-2 text-xl font-bold text-white">Nexora</span>
              </div>
              <p className="text-gray-400">
                The future of team communication and collaboration.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-bold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><button className="hover:text-white transition-colors">Features</button></li>
                <li><button className="hover:text-white transition-colors">Pricing</button></li>
                <li><button className="hover:text-white transition-colors">Security</button></li>
                <li><button className="hover:text-white transition-colors">Enterprise</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-bold mb-4">Community</h3>
              <ul className="space-y-2 text-gray-400">
                <li><button className="hover:text-white transition-colors">Discord</button></li>
                <li><button className="hover:text-white transition-colors">GitHub</button></li>
                <li><button className="hover:text-white transition-colors">Twitter</button></li>
                <li><button className="hover:text-white transition-colors">Blog</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-bold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><button className="hover:text-white transition-colors">Help Center</button></li>
                <li><button className="hover:text-white transition-colors">Contact Us</button></li>
                <li><button className="hover:text-white transition-colors">Status</button></li>
                <li><button className="hover:text-white transition-colors">Privacy</button></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Nexora. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
