import React, { useState, useEffect } from 'react';
import {
  FiUser, FiCpu, FiVideo, FiFileText, FiBarChart2,
  FiDroplet, FiBell, FiLock, FiHardDrive, FiInfo,
  FiRefreshCw, FiTrash2, FiLogOut, FiSave, FiCheck,
  FiLoader, FiAlertCircle,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useNavigate } from 'react-router-dom';
import videoService from '../services/videoService.js';
import authService from '../services/authService.js';
import bookmarkService from '../services/bookmarkService.js';


const Settings = () => {
  const { user, logout, updateProfile } = useAuth();
  const { settings, updateSetting, updateCategory, resetSettings } = useSettings();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Real data from backend
  const [storageData, setStorageData] = useState({
    totalSize: 0,
    videoCount: 0,
    transcriptCount: 0,
    summaryCount: 0,
    keyMomentCount: 0,
    bookmarkCount: 0,
  });

  // Profile form state — synced with user from auth context
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    avatar_url: user?.avatar_url || '',
    email: user?.email || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Sync profile form when user data changes
  useEffect(() => {
    setProfileForm({
      full_name: user?.full_name || '',
      avatar_url: user?.avatar_url || '',
      email: user?.email || '',
    });
  }, [user]);

  // Fetch real data on mount
  useEffect(() => {
    fetchStorageData();
  }, []);

  const fetchStorageData = async () => {
    try {
      setLoading(true);

      const [videosResult, bookmarksResult] = await Promise.allSettled([
        videoService.getVideos(),
        bookmarkService.getBookmarks(),
      ]);

      const videos = videosResult.status === 'fulfilled' ? videosResult.value : [];
      const bookmarks = bookmarksResult.status === 'fulfilled' ? bookmarksResult.value : [];

      // Calculate total file size
      const totalSize = videos.reduce((sum, v) => sum + (v.file_size || 0), 0);

      // Count content
      let transcriptCount = 0;
      let summaryCount = 0;
      let keyMomentCount = 0;

      // Fetch transcripts, summaries, and key moments for each video
      const contentResults = await Promise.allSettled(
        videos.map(async (video) => {
          const [transcript, summary, moments] = await Promise.allSettled([
            videoService.getTranscript(video.id).catch(() => null),
            videoService.getSummary(video.id).catch(() => null),
            videoService.getKeyMoments(video.id).catch(() => []),
          ]);

          return {
            hasTranscript: transcript.status === 'fulfilled' && transcript.value !== null,
            hasSummary: summary.status === 'fulfilled' && summary.value !== null,
            momentCount:
              moments.status === 'fulfilled' && Array.isArray(moments.value)
                ? moments.value.length
                : 0,
          };
        })
      );

      contentResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value.hasTranscript) transcriptCount++;
          if (result.value.hasSummary) summaryCount++;
          keyMomentCount += result.value.momentCount;
        }
      });

      setStorageData({
        totalSize,
        videoCount: videos.length,
        transcriptCount,
        summaryCount,
        keyMomentCount,
        bookmarkCount: Array.isArray(bookmarks) ? bookmarks.length : 0,
      });
    } catch (err) {
      console.error('Failed to load storage data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
  };

  const STORAGE_LIMIT_GB = 10;
  const storageUsedGB = storageData.totalSize / (1024 * 1024 * 1024);
  const storagePercent = Math.min((storageUsedGB / STORAGE_LIMIT_GB) * 100, 100);

  const handleProfileSave = async () => {
    try {
      setProfileSaving(true);
      setError('');
      await updateProfile({
        email: profileForm.email,
        full_name: profileForm.full_name,
        avatar_url: profileForm.avatar_url,
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSaveAll = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleResetSettings = () => {
    if (!window.confirm('Reset all settings to defaults?')) return;
    resetSettings();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to permanently delete your account? This cannot be undone.')) return;
    if (!window.confirm('This will delete all your videos, transcripts, summaries, and data. Continue?')) return;
    try {
      await authService.deleteAccount();
      await logout();
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete account');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarItems = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'ai', label: 'AI Settings', icon: FiCpu },
    { id: 'processing', label: 'Video Processing', icon: FiVideo },
    { id: 'export', label: 'Export', icon: FiFileText },
    { id: 'dashboard', label: 'Dashboard', icon: FiBarChart2 },
    { id: 'appearance', label: 'Appearance', icon: FiDroplet },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
    { id: 'security', label: 'Security', icon: FiLock },
    { id: 'storage', label: 'Storage', icon: FiHardDrive },
    { id: 'about', label: 'About', icon: FiInfo },
  ];

  const Toggle = ({ checked, onChange, label }) => (
    <label className="flex items-center justify-between py-3 cursor-pointer">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-primary-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  );

  const RadioGroup = ({ options, value, onChange }) => (
    <div className="flex flex-col sm:flex-row gap-3">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            value === opt.value
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  const SectionCard = ({ title, children }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="pt-6 pb-12">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">Settings</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Manage your preferences and application settings
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
            <FiAlertCircle className="mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:sticky lg:top-20">
              <nav className="space-y-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                        activeSection === item.id
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`text-lg ${activeSection === item.id ? 'text-primary-600' : 'text-gray-500'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FiLogOut className="text-lg" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile Section */}
            {activeSection === 'profile' && (
              <SectionCard title="Profile Settings">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-4">
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt="Profile Avatar"
                        className="w-20 h-20 rounded-full object-cover border border-gray-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center"
                      style={user?.avatar_url ? { display: 'none' } : {}}
                    >
                      <span className="text-2xl font-bold text-primary-600">
                        {user?.full_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Avatar URL</label>
                      <input
                        type="url"
                        value={profileForm.avatar_url}
                        onChange={(e) => setProfileForm({ ...profileForm, avatar_url: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="https://example.com/avatar.jpg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                      <input
                        type="text"
                        defaultValue={user?.username || ''}
                        disabled
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                      <input
                        type="text"
                        defaultValue={user?.role || 'Learner'}
                        disabled
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleProfileSave}
                      disabled={profileSaving}
                      className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                      {profileSaving ? (
                        <><FiLoader className="animate-spin mr-2" /> Saving...</>
                      ) : profileSaved ? (
                        <><FiCheck className="mr-2" /> Profile Saved!</>
                      ) : (
                        <><FiSave className="mr-2" /> Save Profile</>
                      )}
                    </button>
                  </div>
                </div>
              </SectionCard>
            )}

            {/* AI Settings Section */}
            {activeSection === 'ai' && (
              <SectionCard title="AI Settings">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Transcript Model</label>
                    <RadioGroup
                      options={[
                        { label: 'Whisper Tiny', value: 'whisper-tiny' },
                        { label: 'Whisper Base', value: 'whisper-base' },
                        { label: 'Whisper Small', value: 'whisper-small' },
                        { label: 'Whisper Medium', value: 'whisper-medium' },
                      ]}
                      value={settings.aiSettings.transcriptModel}
                      onChange={(v) => updateSetting('aiSettings', 'transcriptModel', v)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Summary Model</label>
                    <RadioGroup
                      options={[
                        { label: 'BART Large CNN', value: 'bart-large-cnn' },
                        { label: 'DistilBART', value: 'distilbart' },
                        { label: 'FLAN-T5 Base', value: 'flan-t5-base' },
                        { label: 'FLAN-T5 Large', value: 'flan-t5-large' },
                      ]}
                      value={settings.aiSettings.summaryModel}
                      onChange={(v) => updateSetting('aiSettings', 'summaryModel', v)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Keyword Extraction</label>
                    <RadioGroup
                      options={[{ label: 'KeyBERT', value: 'keybert' }]}
                      value={settings.aiSettings.keywordExtraction}
                      onChange={(v) => updateSetting('aiSettings', 'keywordExtraction', v)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Summary Length</label>
                    <RadioGroup
                      options={[
                        { label: 'Short', value: 'short' },
                        { label: 'Medium', value: 'medium' },
                        { label: 'Detailed', value: 'detailed' },
                      ]}
                      value={settings.aiSettings.summaryLength}
                      onChange={(v) => updateSetting('aiSettings', 'summaryLength', v)}
                    />
                  </div>
                </div>
              </SectionCard>
            )}

            {/* Video Processing Section */}
            {activeSection === 'processing' && (
              <SectionCard title="Video Processing">
                <div className="divide-y divide-gray-100">
                  <Toggle label="Auto Generate Transcript" checked={settings.processingSettings.autoTranscript} onChange={(v) => updateSetting('processingSettings', 'autoTranscript', v)} />
                  <Toggle label="Auto Generate Summary" checked={settings.processingSettings.autoSummary} onChange={(v) => updateSetting('processingSettings', 'autoSummary', v)} />
                  <Toggle label="Auto Detect Key Moments" checked={settings.processingSettings.autoKeyMoments} onChange={(v) => updateSetting('processingSettings', 'autoKeyMoments', v)} />
                  <Toggle label="Auto Generate Keywords" checked={settings.processingSettings.autoKeywords} onChange={(v) => updateSetting('processingSettings', 'autoKeywords', v)} />
                </div>
              </SectionCard>
            )}

            {/* Export Settings Section */}
            {activeSection === 'export' && (
              <SectionCard title="Export Settings">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Default Export Format</label>
                    <RadioGroup
                      options={[
                        { label: 'PDF', value: 'pdf' },
                        { label: 'TXT', value: 'txt' },
                        { label: 'DOCX', value: 'docx' },
                      ]}
                      value={settings.exportSettings.defaultFormat}
                      onChange={(v) => updateSetting('exportSettings', 'defaultFormat', v)}
                    />
                  </div>
                  <div className="divide-y divide-gray-100">
                    <Toggle label="Include Timestamp" checked={settings.exportSettings.includeTimestamp} onChange={(v) => updateSetting('exportSettings', 'includeTimestamp', v)} />
                    <Toggle label="Include Keywords" checked={settings.exportSettings.includeKeywords} onChange={(v) => updateSetting('exportSettings', 'includeKeywords', v)} />
                    <Toggle label="Include Speaker Labels" checked={settings.exportSettings.includeSpeakerLabels} onChange={(v) => updateSetting('exportSettings', 'includeSpeakerLabels', v)} />
                  </div>
                </div>
              </SectionCard>
            )}

            {/* Dashboard Settings Section */}
            {activeSection === 'dashboard' && (
              <SectionCard title="Dashboard Settings">
                <div className="divide-y divide-gray-100">
                  <Toggle label="Show Analytics Cards" checked={settings.dashboardSettings.showAnalyticsCards} onChange={(v) => updateSetting('dashboardSettings', 'showAnalyticsCards', v)} />
                  <Toggle label="Show Watch Time" checked={settings.dashboardSettings.showWatchTime} onChange={(v) => updateSetting('dashboardSettings', 'showWatchTime', v)} />
                  <Toggle label="Show AI Statistics" checked={settings.dashboardSettings.showAiStatistics} onChange={(v) => updateSetting('dashboardSettings', 'showAiStatistics', v)} />
                  <Toggle label="Show Notes" checked={settings.dashboardSettings.showNotes} onChange={(v) => updateSetting('dashboardSettings', 'showNotes', v)} />
                </div>
              </SectionCard>
            )}

            {/* Appearance Section */}
            {activeSection === 'appearance' && (
              <SectionCard title="Appearance">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                    <RadioGroup
                      options={[
                        { label: '☀ Light', value: 'light' },
                        { label: '🌙 Dark', value: 'dark' },
                        { label: '💻 System', value: 'system' },
                      ]}
                      value={settings.appearance.theme}
                      onChange={(v) => updateSetting('appearance', 'theme', v)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                    <RadioGroup
                      options={[
                        { label: 'Blue', value: 'blue' },
                        { label: 'Green', value: 'green' },
                        { label: 'Purple', value: 'purple' },
                      ]}
                      value={settings.appearance.primaryColor}
                      onChange={(v) => updateSetting('appearance', 'primaryColor', v)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
                    <RadioGroup
                      options={[
                        { label: 'Small', value: 'small' },
                        { label: 'Medium', value: 'medium' },
                        { label: 'Large', value: 'large' },
                      ]}
                      value={settings.appearance.fontSize}
                      onChange={(v) => updateSetting('appearance', 'fontSize', v)}
                    />
                  </div>
                </div>
              </SectionCard>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <SectionCard title="Notifications">
                <div className="divide-y divide-gray-100">
                  <Toggle label="Email Notifications" checked={settings.notifications.emailNotifications} onChange={(v) => updateSetting('notifications', 'emailNotifications', v)} />
                  <Toggle label="Summary Ready Notification" checked={settings.notifications.summaryReady} onChange={(v) => updateSetting('notifications', 'summaryReady', v)} />
                  <Toggle label="Processing Complete" checked={settings.notifications.processingComplete} onChange={(v) => updateSetting('notifications', 'processingComplete', v)} />
                  <Toggle label="Weekly Report" checked={settings.notifications.weeklyReport} onChange={(v) => updateSetting('notifications', 'weeklyReport', v)} />
                </div>
              </SectionCard>
            )}

            {/* Security Section */}
            {activeSection === 'security' && (
              <SectionCard title="Privacy & Security">
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Account Email</p>
                        <p className="text-xs text-gray-500 mt-1">{user?.email || 'N/A'}</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Verified</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Two-Factor Authentication</p>
                        <p className="text-xs text-gray-500 mt-1">Add an extra layer of security</p>
                      </div>
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">Not Enabled</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Member Since</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={handleDeleteAccount}
                      className="w-full sm:w-auto flex items-center justify-center px-4 py-2.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                    >
                      <FiTrash2 className="mr-2" />
                      Delete Account
                    </button>
                    <p className="text-xs text-gray-400 mt-2">
                      This will permanently delete your account and all associated data.
                    </p>
                  </div>
                </div>
              </SectionCard>
            )}

            {/* Storage Section */}
            {activeSection === 'storage' && (
              <SectionCard title="Storage">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <FiLoader className="animate-spin text-2xl text-primary-600" />
                    <span className="ml-2 text-gray-500">Loading storage data...</span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-500">Storage Used</span>
                        <span className="text-sm font-medium text-gray-700">
                          {formatFileSize(storageData.totalSize)} / {STORAGE_LIMIT_GB} GB
                        </span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="bg-primary-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${storagePercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-gray-800">{storageData.videoCount}</p>
                        <p className="text-xs text-gray-500">Videos</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-gray-800">{storageData.transcriptCount}</p>
                        <p className="text-xs text-gray-500">Transcripts</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-gray-800">{storageData.summaryCount}</p>
                        <p className="text-xs text-gray-500">Summaries</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-gray-800">{storageData.keyMomentCount}</p>
                        <p className="text-xs text-gray-500">Key Moments</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-gray-800">{storageData.bookmarkCount}</p>
                        <p className="text-xs text-gray-500">Bookmarks</p>
                      </div>
                    </div>

                    <button
                      onClick={fetchStorageData}
                      className="w-full sm:w-auto flex items-center justify-center px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      <FiRefreshCw className="mr-2" />
                      Refresh Data
                    </button>
                  </div>
                )}
              </SectionCard>
            )}

            {/* About Section */}
            {activeSection === 'about' && (
              <SectionCard title="About">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <FiInfo className="text-2xl text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">ClipMind AI</h3>
                      <p className="text-sm text-gray-500">Version 1.0.0</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">Backend</p>
                      <p className="text-sm font-medium text-gray-800">FastAPI</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">Frontend</p>
                      <p className="text-sm font-medium text-gray-800">React + Vite</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">Database</p>
                      <p className="text-sm font-medium text-gray-800">PostgreSQL</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">AI Models</p>
                      <p className="text-sm font-medium text-gray-800">Whisper, Hugging Face, KeyBERT</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-2">Logged in as</p>
                    <p className="text-sm font-medium text-gray-800">{user?.full_name || user?.username}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <p className="text-xs text-gray-400 mt-1">Role: {user?.role || 'Learner'}</p>
                  </div>
                </div>
              </SectionCard>
            )}

            {/* Save Button (hidden for profile, storage, and about sections) */}
            {activeSection !== 'profile' && activeSection !== 'storage' && activeSection !== 'about' && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <button
                  onClick={handleSaveAll}
                  className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                  {saved ? (
                    <><FiCheck className="mr-2" /> Saved!</>
                  ) : (
                    <><FiSave className="mr-2" /> Save Changes</>
                  )}
                </button>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button className="w-full sm:w-auto flex items-center justify-center px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                    <FiRefreshCw className="mr-2" />
                    Reprocess AI Content
                  </button>
                  <button
                    onClick={handleResetSettings}
                    className="w-full sm:w-auto flex items-center justify-center px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    Reset Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
