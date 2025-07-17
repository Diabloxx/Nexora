// Notification utility for desktop notifications

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  silent?: boolean;
}

class NotificationService {
  private permission: NotificationPermission = 'default';

  constructor() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return 'denied';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    if (this.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission;
    }

    return this.permission;
  }

  async showNotification(options: NotificationOptions): Promise<void> {
    // Check if we're in focus
    if (document.hasFocus()) {
      return; // Don't show notification if window is in focus
    }

    const permission = await this.requestPermission();
    
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/logo.png',
      tag: options.tag,
      silent: options.silent || false,
      badge: '/logo.png'
    });

    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    // Handle click to focus window
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }

  showMessageNotification(message: any, channelName: string, serverName?: string): void {
    const title = serverName ? `${serverName} • #${channelName}` : `#${channelName}`;
    const body = `${message.author.displayName || message.author.username}: ${message.content}`;
    
    this.showNotification({
      title,
      body,
      tag: `message-${message.id}`,
      icon: message.author.avatar || '/logo.png'
    });
  }

  showFriendRequestNotification(fromUser: any): void {
    this.showNotification({
      title: 'New Friend Request',
      body: `${fromUser.displayName || fromUser.username} sent you a friend request`,
      tag: 'friend-request',
      icon: fromUser.avatar || '/logo.png'
    });
  }

  showServerInviteNotification(serverName: string, fromUser: any): void {
    this.showNotification({
      title: 'Server Invitation',
      body: `${fromUser.displayName || fromUser.username} invited you to join ${serverName}`,
      tag: 'server-invite',
      icon: '/logo.png'
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;
