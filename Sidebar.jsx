import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiHome, FiUser, FiUpload, FiVideo, FiBarChart2, FiSettings,
  FiLogOut, FiFileText, FiList, FiZap, FiBookmark, FiBookOpen, FiUsers,
  FiPlayCircle, FiClock, FiLayers,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';
import bookmarkService from '../services/bookmarkService.js';
import logo from '../assets/logo.png';


const Sidebar = ({ onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [redirectingAnalytics, setRedirectingAnalytics] = useState(false);

  useEffect(() => {
    loadBookmarkCount();
  }, []);

  const loadBookmarkCount = async () => {
    try {
      const bookmarks = await bookmarkService.getBookmarks();
      setBookmarkCount(bookmarks.length);
    } catch (err) {
      console.error('Failed to load bookmark count:', err);
    }
  };

  // Route History to the creator's content history for creators, and the
  // watch-history page for everyone else.
  const historyPath = user?.role === 'Content Creator' ? '/watch-history/creator' : '/history';

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: FiHome, roles: ['Content Creator', 'Educator', 'Learner'] },
    { name: 'Profile', path: '/profile', icon: FiUser, roles: ['Administrator', 'Content Creator', 'Educator', 'Learner'] },
    { name: 'Upload Video', path: '/upload', icon: FiUpload, roles: ['Content Creator', 'Educator'] },
    { name: 'Browse', path: '/browse', icon: FiPlayCircle, roles: ['Learner'] },
    { name: 'My Videos', path: '/my-videos', icon: FiVideo, roles: [ 'Content Creator', 'Educator'] },
    { name: 'History', path: historyPath, icon: FiClock, roles: ['Content Creator', 'Learner'] },
    { name: 'Bookmarks', path: '/bookmarks', icon: FiBookmark, roles: ['Content Creator', 'Educator', 'Learner'] },
    { name: 'Classroom Analytics', path: '/classroom-analytics', icon: FiBarChart2, roles: ['Educator'] },
    { name: 'Admin Dashboard', path: '/admin', icon: FiUsers, roles: ['Administrator'] },
    { name: 'Settings', path: '/settings', icon: FiSettings, roles: ['Administrator', 'Content Creator', 'Educator', 'Learner'] },
  ];

  // Dynamic menu items based on current route
  const getDynamicMenuItems = () => {
    const path = location.pathname;
    const match = path.match(/^\/videos\/(\d+)/);
    if (match) {
      const basePath = `/videos/${match[1]}`;
      return [
        { name: 'Video Detail', path: basePath, icon: FiVideo, roles: ['Content Creator', 'Educator', 'Learner'] },
        { name: 'Transcript', path: `${basePath}/transcript`, icon: FiFileText, roles: ['Content Creator', 'Educator', 'Learner'] },
        { name: 'Summary', path: `${basePath}/summary`, icon: FiList, roles: ['Content Creator', 'Educator', 'Learner'] },
        { name: 'Key Moments', path: `${basePath}/key-moments`, icon: FiZap, roles: ['Content Creator', 'Educator', 'Learner'] },
        { name: 'Analytics', path: `${basePath}/analytics`, icon: FiBarChart2, roles: ['Content Creator', 'Educator', 'Learner'] },
        { name: 'Notes', path: `${basePath}/notes`, icon: FiBookOpen, roles: ['Content Creator', 'Educator', 'Learner'] },
        { name: 'Learning Materials', path: `${basePath}/materials`, icon: FiLayers, roles: ['Educator'] },
        { name: 'Classroom', path: `/classrooms/${match[1]}`, icon: FiUsers, roles: ['Educator','Learner'] },
      ];
    }
    return [];
  };

  const dynamicMenuItems = getDynamicMenuItems();
  const userRole = user?.role || 'Learner';

  const handleAnalyticsClick = async (e) => {
    e.preventDefault();
    if (redirectingAnalytics) return;
    setRedirectingAnalytics(true);
    try {
      navigate('/analytics');
    } catch (err) {
      console.error('Failed to navigate to analytics:', err);
      navigate('/my-videos');
    } finally {
      setRedirectingAnalytics(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const linkClass = (isActive) =>
    `flex items-center space-x-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-white/15 text-white'
        : 'text-white/80 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <aside className="h-screen w-64 sidebar-gradient flex flex-col">
      {/* Logo */}
      <div className="flex items-center space-x-3 px-5 h-16 border-b border-white/20 flex-shrink-0">
        <img src={logo} alt="ClipMind AI" className="h-16 w-16 object-contain" />
        <span className="text-lg font-bold text-white">ClipMind AI</span>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-white/20 flex-shrink-0">
        <div className="flex items-center space-x-3">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt="Profile Avatar"
              className="w-10 h-10 rounded-full object-cover border border-white/30"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
            style={user?.avatar_url ? { display: 'none' } : {}}
          >
            <FiUser className="text-white text-lg" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm truncate">
              {user?.full_name || user?.username}
            </p>
            <p className="text-xs text-white/60">{userRole}</p>
          </div>
        </div>
      </div>

      {/* Navigation — scrollable */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {dynamicMenuItems.length > 0 && (
          <>
            <div className="px-4 py-2 text-xs font-semibold text-white/50 uppercase tracking-wider">
              Current Video
            </div>
            {dynamicMenuItems
              .filter((item) => item.roles.includes(userRole))
              .map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={linkClass(isActive)}
                  >
                    <Icon className="text-lg flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            <div className="my-2 border-t border-white/20"></div>
          </>
        )}

        {menuItems
          .filter((item) => item.roles.includes(userRole))
          .map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isAnalytics = item.name === 'Analytics';

            if (isAnalytics) {
              return (
                <button
                  key={item.path}
                  onClick={(e) => {
                    handleAnalyticsClick(e);
                    onClose?.();
                  }}
                  disabled={redirectingAnalytics}
                  className={`w-full ${linkClass(isActive)} disabled:opacity-50`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="text-lg flex-shrink-0" />
                    <span>{redirectingAnalytics ? 'Loading...' : item.name}</span>
                  </div>
                </button>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`${linkClass(isActive)} justify-between`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="text-lg flex-shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.name === 'Bookmarks' && bookmarkCount > 0 && (
                  <span className="bg-white text-indigo-700 rounded-full px-2 text-xs py-0.5 min-w-[20px] text-center font-semibold">
                    {bookmarkCount}
                  </span>
                )}
              </Link>
            );
          })}
      </nav>

      {/* Logout — pinned to bottom */}
      <div className="border-t border-white/20 p-4 flex-shrink-0">
        <button
          onClick={() => {
            handleLogout();
            onClose?.();
          }}
          className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
        >
          <FiLogOut className="text-lg" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
