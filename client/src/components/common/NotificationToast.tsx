import React, { useEffect } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { removeNotification } from '../../store/slices/uiSlice';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
  autoHide?: boolean;
}

interface NotificationToastProps {
  notification: Notification;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (notification.autoHide !== false) {
      const timer = setTimeout(() => {
        dispatch(removeNotification(notification.id));
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notification.id, notification.autoHide, dispatch]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/50';
      case 'error':
        return 'bg-red-500/10 border-red-500/50';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/50';
      default:
        return 'bg-blue-500/10 border-blue-500/50';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 max-w-sm p-4 rounded-lg border ${getBackgroundColor()} backdrop-blur-sm shadow-lg z-50 animate-slide-in-right`}
    >
      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1">
          <h4 className="text-white font-medium">{notification.title}</h4>
          <p className="text-gray-300 text-sm mt-1">{notification.message}</p>
        </div>
        <button
          onClick={() => dispatch(removeNotification(notification.id))}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default NotificationToast;
