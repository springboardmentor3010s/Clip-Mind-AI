import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiUser, FiLogOut, FiSettings, FiSearch, FiVideo } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';
import videoService from '../services/videoService.js';


const Navbar = ({ onToggleSidebar, sidebarOpen }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // Fetch videos for search
  useEffect(() => {
    if (!isAuthenticated || !searchQuery.trim()) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }

    setSearchLoading(true);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const videos = await videoService.getVideos();
        const filtered = videos
          .filter((v) =>
            v.title.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 5);
        setSearchResults(filtered);
        setShowSearch(true);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, isAuthenticated]);

  // Close search on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close search on route change
  useEffect(() => {
    setShowSearch(false);
    setSearchQuery('');
  }, [location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/my-videos');
      setShowSearch(false);
    }
  };

  const handleResultClick = (videoId) => {
    navigate(`/videos/${videoId}`);
    setShowSearch(false);
    setSearchQuery('');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-4 sm:px-6">
      {/* Left: Hamburger (mobile) + Logo (unauthenticated) */}
      <div className="flex items-center space-x-3 flex-shrink-0">
        {isAuthenticated && onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        )}

        {!isAuthenticated && (
          <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-primary-600">
            <span>ClipMind AI</span>
          </Link>
        )}
      </div>

      {/* Center: Search bar (authenticated only) */}
      {isAuthenticated && (
        <div className="flex-1 max-w-md mx-4 hidden sm:block" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearch(true)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-100 border border-transparent rounded-lg focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
            />

            {/* Search Results Dropdown */}
            {showSearch && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                {searchLoading ? (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((video) => (
                      <button
                        key={video.id}
                        onClick={() => handleResultClick(video.id)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FiVideo className="text-primary-600 text-sm" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {video.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(video.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : searchQuery.trim() ? (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    No videos found
                  </div>
                ) : null}
              </div>
            )}
          </form>
        </div>
      )}

      {/* Right: User actions */}
      <div className="flex items-center space-x-4 flex-shrink-0">
        {isAuthenticated ? (
          <>
            <span className="text-sm text-gray-600 hidden md:block">
              Welcome, {user?.full_name || user?.username}
            </span>
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 focus:outline-none"
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="Profile Avatar"
                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center"
                  style={user?.avatar_url ? { display: 'none' } : {}}
                >
                  <FiUser className="text-primary-600" />
                </div>
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/dashboard"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    Settings
                  </Link>
                  {user?.role === 'Administrator' && (
                    <Link
                      to="/admin"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className={`text-sm font-medium ${
                location.pathname === '/login'
                  ? 'text-primary-600'
                  : 'text-gray-600 hover:text-primary-600'
              }`}
            >
              Login
            </Link>
            <Link
              to="/register"
              className={`text-sm font-medium px-4 py-2 rounded-md ${
                location.pathname === '/register'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Register
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;