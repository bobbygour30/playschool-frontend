// components/NotificationBell.jsx
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell, X, CheckCheck, Trash2, Calendar, DollarSign, Award,
  Info, Clock, Loader2,
} from 'lucide-react';
import { notificationApi } from '../services/api';

const TYPE_ICON = {
  leave: Calendar,
  holiday: Calendar,
  fee: DollarSign,
  expense: DollarSign,
  salary: DollarSign,
  achievement: Award,
  general: Info,
};

const CATEGORY_STYLE = {
  info: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-100' },
  success: { bg: 'bg-green-50', text: 'text-green-600', ring: 'ring-green-100' },
  warning: { bg: 'bg-yellow-50', text: 'text-yellow-600', ring: 'ring-yellow-100' },
  alert: { bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-100' },
};

const timeAgo = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

// Drop this into your header/topbar: <NotificationBell audience="admin" />
export default function NotificationBell({ audience = 'admin', pollInterval = 30000 }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all | unread
  const btnRef = useRef(null);
  const [anchorRect, setAnchorRect] = useState(null);

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationApi.getUnreadCount(audience);
      if (res.data?.success) setUnreadCount(res.data.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = { audience };
      if (filter === 'unread') params.is_read = false;
      const res = await notificationApi.getNotifications(params);
      if (res.data?.success) {
        setNotifications(Array.isArray(res.data.data) ? res.data.data : []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, pollInterval);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open) {
      if (btnRef.current) setAnchorRect(btnRef.current.getBoundingClientRect());
      fetchNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, filter]);

  const handleMarkRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead(audience);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all read:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleClickNotification = (n) => {
    if (!n.is_read) handleMarkRead(n._id);
    if (n.action_url) window.location.href = n.action_url;
  };

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
        title="Notifications"
      >
        <Bell size={22} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && anchorRect && createPortal(
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[100] w-[380px] max-w-[92vw] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
            style={{
              top: Math.min(anchorRect.bottom + 8, window.innerHeight - 480),
              left: Math.max(8, Math.min(anchorRect.right - 380, window.innerWidth - 396)),
            }}
          >
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 flex items-center justify-between">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Bell size={18} /> Notifications
              </h3>
              <button onClick={() => setOpen(false)} className="text-white hover:bg-white/20 rounded-lg p-1">
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
              <div className="flex gap-1">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    filter === 'all' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    filter === 'unread' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  Unread
                </button>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                >
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[380px] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin text-indigo-500" size={28} />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <Bell className="mx-auto text-gray-300 mb-2" size={36} />
                  <p className="text-sm text-gray-500">No notifications</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = TYPE_ICON[n.type] || Info;
                  const style = CATEGORY_STYLE[n.category] || CATEGORY_STYLE.info;
                  return (
                    <div
                      key={n._id}
                      onClick={() => handleClickNotification(n)}
                      className={`flex gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
                        !n.is_read ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${style.bg} ring-4 ${style.ring}`}>
                        <Icon size={16} className={style.text} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                            {n.title}
                          </p>
                          {!n.is_read && <span className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[11px] text-gray-400 flex items-center gap-1">
                            <Clock size={10} /> {timeAgo(n.created_at)}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(n._id); }}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}