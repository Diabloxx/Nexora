import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchMessages, sendMessage, addMessage, editMessage, deleteMessage, updateMessageReactions } from '../../store/slices/chatSlice';
import { socketService } from '../../services/socketService';
import { notificationService } from '../../services/notificationService';
import { Hash, Plus, Send, MoreHorizontal, Edit3, Trash2, Smile, Reply, Pin, FileText, ImageIcon } from 'lucide-react';

interface ChatAreaProps {
  channel: any;
}

const ChatArea: React.FC<ChatAreaProps> = ({ channel }) => {
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { messages, isLoading, typingUsers } = useAppSelector((state: any) => state.chat);
  const { user } = useAppSelector((state: any) => state.auth);
  const dispatch = useAppDispatch();

  const channelMessages = useMemo(() => messages[channel?.id || ''] || [], [messages, channel?.id]);
  const currentTypingUsers = typingUsers[channel?.id || ''] || [];

  useEffect(() => {
    if (channel?.id) {
      console.log('Fetching messages for channel:', channel.id);
      
      // Don't fetch messages for welcome channels
      if (channel.id && channel.id.startsWith('welcome-')) {
        console.log('Skipping message fetch for welcome channel');
        return;
      }
      
      // Join the channel
      console.log('Joining channel:', channel.id);
      socketService.joinChannel(channel.id);
      
      // Fetch messages for this channel
      dispatch(fetchMessages({ channelId: channel.id }));

      // Set up socket listeners
      const handleNewMessage = (message: any) => {
        console.log('Received new message via socket:', message);
        console.log('Current channel ID:', channel.id);
        console.log('Message channel ID:', message.channel);
        if (message.channel === channel.id) {
          console.log('Adding message to current channel');
          dispatch(addMessage(message));
          
          // Show notification if message is not from current user
          if (message.author.id !== user?.id) {
            const serverState = (window as any).__REDUX_STORE__?.getState()?.servers;
            const currentServer = serverState?.currentServer;
            notificationService.showMessageNotification(
              message, 
              channel.name, 
              currentServer?.name
            );
          }
        } else {
          console.log('Message not for current channel, ignoring');
        }
      };

      const handleMessageReaction = (data: any) => {
        console.log('Received reaction update:', data);
        dispatch(updateMessageReactions(data));
      };

      socketService.on('new_message', handleNewMessage);
      socketService.on('message_reaction', handleMessageReaction);

      return () => {
        socketService.off('new_message', handleNewMessage);
        socketService.off('message_reaction', handleMessageReaction);
        // Leave the channel when component unmounts or channel changes
        socketService.leaveChannel(channel.id);
      };
    }
  }, [channel?.id, channel?.name, user?.id, dispatch]);

  useEffect(() => {
    scrollToBottom();
  }, [channelMessages]);

  useEffect(() => {
    // Smooth scroll to bottom when new messages are added
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    
    return () => clearTimeout(timer);
  }, [channelMessages.length]);

  // Guard clause for null channel
  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-purple-950/10 to-purple-900/5">
        <div className="text-purple-400">No channel selected</div>
      </div>
    );
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageInput.trim() && !selectedFile) || !channel?.id) return;

    console.log('Sending message to channel:', channel.id, 'Content:', messageInput.trim());

    // Check if this is a welcome server channel (mock channel)
    if (channel.id && channel.id.startsWith('welcome-')) {
      console.log('Cannot send messages to welcome channels - they are mock channels');
      setMessageInput('');
      setSelectedFile(null);
      setReplyingTo(null);
      return;
    }

    try {
      let attachments: any[] = [];
      
      // Upload file if one is selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        const uploadResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          attachments = [uploadResult.data];
        } else {
          throw new Error('File upload failed');
        }
      }

      const result = await dispatch(sendMessage({
        channelId: channel.id,
        content: messageInput.trim() || (selectedFile ? `Uploaded ${selectedFile.name}` : ''),
        type: replyingTo ? 'reply' : 'default',
        replyTo: replyingTo?.id,
        attachments
      }));
      
      console.log('Send message result:', result);
      
      if (sendMessage.fulfilled.match(result)) {
        setMessageInput('');
        setSelectedFile(null);
        setReplyingTo(null);
        stopTyping();
      } else if (sendMessage.rejected.match(result)) {
        console.error('Message send rejected:', result.payload);
        alert('Failed to send message: ' + result.payload);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message: ' + error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageInput(value);

    // Handle typing indicator
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      socketService.startTyping(channel.id);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  };

  const stopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      socketService.stopTyping(channel.id);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!newContent.trim()) return;
    
    try {
      await dispatch(editMessage({ messageId, content: newContent.trim() }));
      setEditingMessage(null);
      setEditContent('');
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    
    try {
      await dispatch(deleteMessage(messageId));
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ emoji })
      });

      if (response.ok) {
        const data = await response.json();
        // Update the message reactions in the store
        dispatch(updateMessageReactions({ messageId, reactions: data.data }));
      } else {
        console.error('Failed to add reaction');
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleReply = (message: any) => {
    setReplyingTo(message);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // We'll implement file upload later
      console.log('File selected:', file.name);
    }
  };

  const startEdit = (message: any) => {
    setEditingMessage(message.id);
    setEditContent(message.content);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const shouldShowDateDivider = (currentMsg: any, prevMsg: any) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.createdAt).toDateString();
    const prevDate = new Date(prevMsg.createdAt).toDateString();
    return currentDate !== prevDate;
  };

  const loadMoreMessages = async () => {
    if (loadingMoreMessages || !hasMoreMessages || !channel?.id || channelMessages.length === 0) {
      return;
    }

    setLoadingMoreMessages(true);
    try {
      const oldestMessage = channelMessages[0];
      const response = await fetch(`/api/messages/${channel.id}/history?limit=25&before=${oldestMessage.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const olderMessages = data.data.messages;
        
        if (olderMessages.length > 0) {
          // For now, just log that we got more messages
          // In a full implementation, we'd need to update the store properly
          console.log('Loaded', olderMessages.length, 'older messages');
          setHasMoreMessages(olderMessages.length === 25);
        } else {
          setHasMoreMessages(false);
        }
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setLoadingMoreMessages(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-purple-950/10 to-purple-900/5 backdrop-blur-sm h-full">
      {/* Enhanced Chat Header */}
      <div className="flex-shrink-0 h-16 border-b border-purple-700/30 px-6 bg-gradient-to-r from-purple-900/20 to-purple-800/10 backdrop-blur-lg">
        <div className="flex items-center h-full">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-nexora-gradient rounded-xl flex items-center justify-center shadow-lg ring-2 ring-purple-500/20">
              <Hash className="w-5 h-5 text-white drop-shadow-lg" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg drop-shadow-lg">
                {channel.name}
              </h1>
              {channel.topic && (
                <p className="text-purple-300 text-sm">
                  {channel.topic}
                </p>
              )}
            </div>
          </div>
          <div className="ml-auto flex items-center space-x-2">
            <div className="text-purple-300 text-sm flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Chat Messages - Fixed height with scroll */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-gradient-to-b from-transparent to-purple-950/5 scroll-smooth">
        <div className="p-6 space-y-1 min-h-full flex flex-col">
          {/* Load More Messages Button */}
          {channelMessages.length > 0 && hasMoreMessages && (
            <div className="text-center mb-6 flex-shrink-0">
              <button
                onClick={loadMoreMessages}
                disabled={loadingMoreMessages}
                className="bg-gradient-to-r from-purple-800/50 to-purple-700/50 hover:from-purple-700/60 hover:to-purple-600/60 text-white px-6 py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm border border-purple-600/30 transform hover:scale-105 shadow-lg"
              >
                {loadingMoreMessages ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  'Load More Messages'
                )}
              </button>
            </div>
          )}
        
        {channelMessages.length === 0 ? (
          <div className="text-center text-purple-300 mb-8">
            <div className="w-20 h-20 bg-nexora-gradient rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-2xl shadow-purple-500/25 ring-4 ring-purple-500/20">
              #
            </div>
            <h2 className="text-3xl font-bold mb-4 text-white drop-shadow-lg">Welcome to #{channel.name}</h2>
            {channel.id && channel.id.startsWith('welcome-') ? (
              <div className="space-y-6 max-w-2xl mx-auto">
                <p className="text-xl text-purple-200">This is a preview of Nexora's beautiful interface.</p>
                <div className="bg-gradient-to-br from-purple-800/30 to-purple-900/20 border border-purple-600/30 rounded-2xl p-8 backdrop-blur-sm">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-nexora-gradient rounded-full flex items-center justify-center shadow-xl">
                      <img 
                        src="/logo-trans.png" 
                        alt="Nexora Logo" 
                        className="w-10 h-10 object-contain drop-shadow-lg"
                      />
                    </div>
                  </div>
                  <p className="text-purple-200 font-semibold mb-4 text-lg">🚀 Ready to start your journey?</p>
                  <p className="text-md mb-4 text-purple-300">Create your own server to unlock:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-purple-700/20 rounded-xl p-4 border border-purple-600/20">
                      <div className="text-2xl mb-2">💬</div>
                      <div className="text-purple-200 font-medium">Real-time messaging</div>
                      <div className="text-purple-400 text-sm">Instant communication</div>
                    </div>
                    <div className="bg-purple-700/20 rounded-xl p-4 border border-purple-600/20">
                      <div className="text-2xl mb-2">👥</div>
                      <div className="text-purple-200 font-medium">Invite friends</div>
                      <div className="text-purple-400 text-sm">Build your community</div>
                    </div>
                    <div className="bg-purple-700/20 rounded-xl p-4 border border-purple-600/20">
                      <div className="text-2xl mb-2">📢</div>
                      <div className="text-purple-200 font-medium">Multiple channels</div>
                      <div className="text-purple-400 text-sm">Organize conversations</div>
                    </div>
                    <div className="bg-purple-700/20 rounded-xl p-4 border border-purple-600/20">
                      <div className="text-2xl mb-2">🟢</div>
                      <div className="text-purple-200 font-medium">See who's online</div>
                      <div className="text-purple-400 text-sm">Stay connected</div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-yellow-400/20 to-orange-400/20 border border-yellow-400/30 rounded-xl p-4">
                    <p className="text-yellow-300 font-semibold flex items-center">
                      <span className="text-2xl mr-2">✨</span>
                      Click the "+" button in the server list to get started!
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-lg">This is the beginning of the #{channel.name} channel.</p>
            )}
          </div>
        ) : (
          <div className="flex-1">
            {channelMessages.map((message: any, index: number) => {
              const prevMessage = index > 0 ? channelMessages[index - 1] : null;
              const showDate = shouldShowDateDivider(message, prevMessage);
              const isConsecutive = prevMessage && 
                prevMessage.author.id === message.author.id && 
                new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() < 300000; // 5 minutes

              return (
                <React.Fragment key={message.id}>
                  {showDate && (
                    <div className="flex items-center my-8">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-600/50 to-transparent"></div>
                      <div className="px-4 py-2 bg-gradient-to-r from-purple-800/30 to-purple-700/30 backdrop-blur-sm rounded-full border border-purple-600/30">
                        <span className="text-purple-200 text-xs font-medium">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-600/50 to-transparent"></div>
                    </div>
                  )}
                  
                  <div className={`flex items-start space-x-4 hover:bg-purple-800/10 hover:backdrop-blur-sm px-4 py-3 rounded-xl group relative transition-all duration-200 border border-transparent hover:border-purple-700/30 ${
                    isConsecutive ? 'mt-1' : 'mt-4'
                  }`}>
                  {!isConsecutive && (
                    <div className="w-12 h-12 bg-nexora-gradient rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-xl ring-2 ring-purple-500/20">
                      {message.author.displayName?.[0] || message.author.username?.[0] || 'U'}
                    </div>
                  )}
                  {isConsecutive && <div className="w-12 flex-shrink-0" />}
                  
                  <div className="flex-1 min-w-0">
                    {!isConsecutive && (
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-white font-semibold text-lg drop-shadow-lg">
                          {message.author.displayName || message.author.username}
                        </span>
                        <span className="text-purple-300 text-sm bg-purple-800/20 px-2 py-1 rounded-lg">
                          {formatDate(message.createdAt)} at {formatTime(message.createdAt)}
                        </span>
                        {message.editedAt && (
                          <span className="text-purple-400 text-sm italic">(edited)</span>
                        )}
                      </div>
                    )}
                    
                    {/* Reply indicator */}
                    {replyingTo?.id === message.id && (
                      <div className="mb-3 pl-4 border-l-4 border-purple-500 bg-purple-800/20 rounded-r-lg py-2">
                        <div className="text-purple-300 text-sm">
                          <span className="font-semibold">{replyingTo.author.displayName}</span>: {replyingTo.content.slice(0, 50)}...
                        </div>
                      </div>
                    )}
                    
                    {/* Enhanced Message content */}
                    {editingMessage === message.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleEditMessage(message.id, editContent);
                            } else if (e.key === 'Escape') {
                              cancelEdit();
                            }
                          }}
                          className="w-full bg-purple-800/30 border border-purple-600/50 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 backdrop-blur-sm"
                          autoFocus
                        />
                        <div className="text-xs text-purple-300 bg-purple-800/20 px-3 py-2 rounded-lg">
                          Press <kbd className="bg-purple-700/50 px-2 py-1 rounded text-purple-200">Enter</kbd> to save • Press <kbd className="bg-purple-700/50 px-2 py-1 rounded text-purple-200">Esc</kbd> to cancel
                        </div>
                      </div>
                    ) : (
                      <div className="text-purple-100 break-words leading-relaxed text-base">
                        {message.content}
                      </div>
                    )}
                    
                    {/* Enhanced Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {message.attachments.map((attachment: any) => (
                          <div key={attachment.id} className="bg-gradient-to-r from-purple-800/30 to-purple-700/20 rounded-2xl p-4 border border-purple-600/30 backdrop-blur-sm max-w-md">
                            {attachment.contentType.startsWith('image/') ? (
                              <img 
                                src={attachment.url} 
                                alt={attachment.filename}
                                className="max-w-full rounded-xl shadow-lg ring-2 ring-purple-500/20"
                                style={{ maxWidth: '400px', maxHeight: '300px' }}
                              />
                            ) : (
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-nexora-gradient rounded-xl flex items-center justify-center shadow-lg">
                                  <FileText className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <div className="text-white font-semibold">{attachment.filename}</div>
                                  <div className="text-purple-300 text-sm">{(attachment.size / 1024).toFixed(1)} KB</div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Enhanced Reactions */}
                    {message.reactions && message.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {message.reactions.map((reaction: any, reactionIndex: number) => (
                          <button
                            key={reactionIndex}
                            onClick={() => handleReaction(message.id, reaction.emoji)}
                            className="flex items-center space-x-2 bg-gradient-to-r from-purple-800/40 to-purple-700/30 hover:from-purple-700/50 hover:to-purple-600/40 rounded-xl px-3 py-2 text-sm transition-all duration-200 border border-purple-600/30 backdrop-blur-sm transform hover:scale-105"
                          >
                            <span className="text-lg">{reaction.emoji}</span>
                            <span className="text-purple-200 font-medium">{reaction.count}</span>
                          </button>
                        ))}
                        <button
                          onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                          className="bg-gradient-to-r from-purple-800/40 to-purple-700/30 hover:from-purple-700/50 hover:to-purple-600/40 rounded-xl px-3 py-2 text-purple-300 hover:text-white transition-all duration-200 border border-purple-600/30 backdrop-blur-sm transform hover:scale-105"
                        >
                          <Smile className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Enhanced Message Actions - Show on hover */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-gradient-to-r from-purple-900/90 to-purple-800/90 backdrop-blur-lg rounded-xl shadow-2xl flex border border-purple-600/30">
                    <button
                      onClick={() => handleReaction(message.id, '👍')}
                      className="p-3 hover:bg-purple-700/30 rounded-l-xl transition-all duration-200 group/btn"
                      title="Add reaction"
                    >
                      <Smile className="w-4 h-4 text-purple-300 group-hover/btn:text-white group-hover/btn:scale-110 transition-all duration-200" />
                    </button>
                    <button
                      onClick={() => handleReply(message)}
                      className="p-3 hover:bg-purple-700/30 transition-all duration-200 group/btn"
                      title="Reply"
                    >
                      <Reply className="w-4 h-4 text-purple-300 group-hover/btn:text-white group-hover/btn:scale-110 transition-all duration-200" />
                    </button>
                    {user?.id === message.author.id && (
                      <>
                        <button
                          onClick={() => startEdit(message)}
                          className="p-3 hover:bg-purple-700/30 transition-all duration-200 group/btn"
                          title="Edit message"
                        >
                          <Edit3 className="w-4 h-4 text-purple-300 group-hover/btn:text-white group-hover/btn:scale-110 transition-all duration-200" />
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          className="p-3 hover:bg-red-700/30 transition-all duration-200 group/btn"
                          title="Delete message"
                        >
                          <Trash2 className="w-4 h-4 text-purple-300 group-hover/btn:text-red-400 group-hover/btn:scale-110 transition-all duration-200" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => console.log('Pin message')}
                      className="p-3 hover:bg-purple-700/30 transition-all duration-200 group/btn"
                      title="Pin message"
                    >
                      <Pin className="w-4 h-4 text-purple-300 group-hover/btn:text-white group-hover/btn:scale-110 transition-all duration-200" />
                    </button>
                    <button
                      onClick={() => console.log('More actions')}
                      className="p-3 hover:bg-purple-700/30 rounded-r-xl transition-all duration-200 group/btn"
                      title="More"
                    >
                      <MoreHorizontal className="w-4 h-4 text-purple-300 group-hover/btn:text-white group-hover/btn:scale-110 transition-all duration-200" />
                    </button>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          </div>
        )}
        
        {/* Enhanced Load more messages button */}
        {hasMoreMessages && (
          <div className="flex justify-center my-6">
            <button
              onClick={loadMoreMessages}
              className="px-6 py-3 bg-gradient-to-r from-purple-800/50 to-purple-700/50 hover:from-purple-700/60 hover:to-purple-600/60 rounded-xl text-white font-medium transition-all duration-200 backdrop-blur-sm border border-purple-600/30 transform hover:scale-105 shadow-lg"
            >
              {loadingMoreMessages ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </div>
              ) : (
                'Load more messages'
              )}
            </button>
          </div>
        )}
        
        {/* Enhanced Typing Indicator */}
        {currentTypingUsers.length > 0 && (
          <div className="flex items-center space-x-3 px-6 py-4 bg-gradient-to-r from-purple-800/20 to-purple-700/10 backdrop-blur-sm rounded-2xl border border-purple-600/20 mx-4">
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse shadow-lg"></div>
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse shadow-lg" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse shadow-lg" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <span className="text-purple-200 font-medium">
              {currentTypingUsers.length === 1 
                ? `${currentTypingUsers[0]} is typing...`
                : currentTypingUsers.length === 2
                ? `${currentTypingUsers[0]} and ${currentTypingUsers[1]} are typing...`
                : `${currentTypingUsers.length} people are typing...`
              }
            </span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Enhanced Chat Input */}
      <div className="flex-shrink-0 p-6 bg-gradient-to-r from-purple-900/20 to-purple-800/10 backdrop-blur-lg border-t border-purple-700/30">
        {/* Reply Preview */}
        {replyingTo && (
          <div className="mb-4 bg-gradient-to-r from-purple-800/30 to-purple-700/20 rounded-xl p-4 border border-purple-600/30 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Reply className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-purple-200 font-medium">Replying to {replyingTo.author.displayName}</div>
                  <div className="text-purple-300 text-sm truncate max-w-md">{replyingTo.content}</div>
                </div>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-purple-400 hover:text-white transition-colors p-2 hover:bg-purple-700/30 rounded-lg"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* File Preview */}
        {selectedFile && (
          <div className="mb-4 bg-gradient-to-r from-purple-800/30 to-purple-700/20 rounded-xl p-4 border border-purple-600/30 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-nexora-gradient rounded-lg flex items-center justify-center shadow-lg">
                  {selectedFile.type.startsWith('image/') ? (
                    <ImageIcon className="w-5 h-5 text-white" />
                  ) : (
                    <FileText className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <div className="text-purple-200 font-medium">{selectedFile.name}</div>
                  <div className="text-purple-300 text-sm">{(selectedFile.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-purple-400 hover:text-white transition-colors p-2 hover:bg-purple-700/30 rounded-lg"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {channel.id && channel.id.startsWith('welcome-') ? (
          <div className="bg-gradient-to-r from-purple-800/30 to-purple-700/20 rounded-2xl px-6 py-4 flex items-center backdrop-blur-lg border border-purple-600/30">
            <input
              type="text"
              placeholder="Create a server to start chatting..."
              disabled
              className="flex-1 bg-transparent text-purple-400 placeholder-purple-400 outline-none cursor-not-allowed text-lg"
            />
            <div className="flex items-center space-x-3 ml-4">
              <button
                type="button"
                disabled
                className="text-purple-600 cursor-not-allowed p-2"
              >
                <Plus className="w-6 h-6" />
              </button>
              <button
                type="button"
                disabled
                className="text-purple-600 cursor-not-allowed p-2"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <form onSubmit={handleSendMessage} className="bg-gradient-to-r from-purple-800/30 to-purple-700/20 rounded-2xl px-6 py-4 flex items-center backdrop-blur-lg border border-purple-600/30 shadow-xl">
              <input
                type="text"
                placeholder={
                  replyingTo 
                    ? `Reply to ${replyingTo.author.displayName}...`
                    : `Message #${channel.name}`
                }
                value={messageInput}
                onChange={handleInputChange}
                onBlur={stopTyping}
                className="flex-1 bg-transparent text-white placeholder-purple-300 outline-none text-lg"
                maxLength={2000}
              />
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              
              <div className="flex items-center space-x-2 ml-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-purple-300 hover:text-white p-2 rounded-xl hover:bg-purple-700/30 transition-all duration-200 transform hover:scale-110"
                  title="Upload file"
                >
                  <Plus className="w-6 h-6" />
                </button>
                
                <button
                  type="submit"
                  disabled={!messageInput.trim() && !selectedFile}
                  className="text-purple-300 hover:text-white p-2 rounded-xl hover:bg-purple-700/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-110 disabled:hover:scale-100"
                  title="Send message"
                >
                  <Send className="w-6 h-6" />
                </button>
              </div>
            </form>
            
            {/* Character count */}
            {messageInput.length > 1800 && (
              <div className="text-right">
                <span className={`text-sm px-3 py-1 rounded-lg backdrop-blur-sm ${
                  messageInput.length > 2000 
                    ? 'text-red-300 bg-red-900/20 border border-red-600/30' 
                    : 'text-yellow-300 bg-yellow-900/20 border border-yellow-600/30'
                }`}>
                  {messageInput.length}/2000
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatArea;
