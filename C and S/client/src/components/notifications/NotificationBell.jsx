import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle,
  Clock,
  Heart,
  AlertTriangle,
  Info,
  CheckCheck,
  X,
  ExternalLink,
} from 'lucide-react';
import notificationService from '../../services/notification.service';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'NEW_REQUEST':
      return <Clock className="w-4 h-4 text-amber-600" />;
    case 'REQUEST_APPROVED':
      return <CheckCircle className="w-4 h-4 text-emerald-600" />;
    case 'READY_FOR_PICKUP':
      return <Heart className="w-4 h-4 text-primary" />;
    case 'COLLECTION_CONFIRMED':
    case 'DONATION_COMPLETED':
      return <Heart className="w-4 h-4 text-emerald-600" />;
    case 'REQUEST_REJECTED':
    case 'EXPIRY_WARNING':
      return <AlertTriangle className="w-4 h-4 text-rose-500" />;
    default:
      return <Info className="w-4 h-4 text-secondary-500" />;
  }
};

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSec = Math.floor((now - date) / 1000);

  if (diffInSec < 60) return 'Just now';
  if (diffInSec < 3600) return `${Math.floor(diffInSec / 60)}m ago`;
  if (diffInSec < 86400) return `${Math.floor(diffInSec / 3600)}h ago`;
  if (diffInSec < 604800) return `${Math.floor(diffInSec / 86400)}d ago`;
  return date.toLocaleDateString();
};

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Ignore polling errors
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications({
        limit: 20,
        unreadOnly: filter === 'unread',
      });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.warn('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  // Poll count periodically
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch full list when dropdown opens or filter changes
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, filter]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id);
    }
    if (notification.data?.link) {
      setIsOpen(false);
      navigate(notification.data.link);
    }
  };

  const handleDeleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      fetchUnreadCount();
    } catch (err) {
      console.error(err);
    }
  };

  const displayedNotifications =
    filter === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-full text-secondary-600 hover:text-secondary-900 hover:bg-cream-200/70 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
        aria-label="View notifications"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-secondary-700" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-bold text-white bg-primary rounded-full ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-secondary-100 z-50 overflow-hidden transform transition-all duration-200 ease-out">
          {/* Header */}
          <div className="p-4 bg-cream-50 border-b border-secondary-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-heading font-semibold text-secondary-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary hover:text-primary-dark font-medium flex items-center gap-1 transition-colors"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 px-4 py-2 border-b border-secondary-50 bg-white">
            <button
              onClick={() => setFilter('all')}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-secondary-900 text-white'
                  : 'text-secondary-600 hover:bg-cream-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-secondary-900 text-white'
                  : 'text-secondary-600 hover:bg-cream-100'
              }`}
            >
              Unread only
            </button>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-secondary-50">
            {loading ? (
              <div className="py-8 text-center text-sm text-secondary-500">
                Loading notifications...
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="py-8 text-center px-4">
                <Bell className="w-8 h-8 text-secondary-300 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium text-secondary-600">No notifications yet</p>
                <p className="text-xs text-secondary-400 mt-0.5">
                  We will notify you about requests, approvals, and food pickups.
                </p>
              </div>
            ) : (
              displayedNotifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer group ${
                    notification.isRead ? 'bg-white hover:bg-cream-50/60' : 'bg-primary-50/30 hover:bg-primary-50/60'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white shadow-sm border border-secondary-100 shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={`text-xs font-semibold truncate ${notification.isRead ? 'text-secondary-800' : 'text-secondary-900'}`}>
                        {notification.title}
                      </span>
                      <span className="text-[10px] text-secondary-400 shrink-0">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-secondary-600 line-clamp-2 leading-relaxed">
                      {notification.message}
                    </p>
                    {notification.data?.link && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-primary font-medium mt-1 group-hover:underline">
                        View details <ExternalLink className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    {!notification.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary" title="Unread" />
                    )}
                    <button
                      onClick={(e) => handleDeleteNotification(notification._id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-secondary-400 hover:text-rose-500 rounded transition-all"
                      title="Dismiss notification"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
