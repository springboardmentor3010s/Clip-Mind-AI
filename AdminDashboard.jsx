import React, { useRef, useState } from 'react';
import {
  FiGrid, FiUsers, FiVideo, FiActivity, FiCpu, FiHardDrive,
  FiBarChart2, FiSettings, FiShield,
} from 'react-icons/fi';
import AdminOverview from '../components/admin/AdminOverview.jsx';
import AdminUsers from '../components/admin/AdminUsers.jsx';
import AdminContent from '../components/admin/AdminContent.jsx';
import AdminActivity from '../components/admin/AdminActivity.jsx';
import AdminJobs from '../components/admin/AdminJobs.jsx';
import AdminStorage from '../components/admin/AdminStorage.jsx';
import AdminAnalytics from '../components/admin/AdminAnalytics.jsx';
import AdminSettings from '../components/admin/AdminSettings.jsx';
import AdminAuditReports from '../components/admin/AdminAuditReports.jsx';


const TABS = [
  { id: 'overview', label: 'Overview', icon: FiGrid, component: AdminOverview },
  { id: 'users', label: 'Users & Roles', icon: FiUsers, component: AdminUsers },
  { id: 'content', label: 'Content', icon: FiVideo, component: AdminContent },
  { id: 'activity', label: 'Activity', icon: FiActivity, component: AdminActivity },
  { id: 'jobs', label: 'AI Jobs', icon: FiCpu, component: AdminJobs },
  { id: 'storage', label: 'Storage', icon: FiHardDrive, component: AdminStorage },
  { id: 'analytics', label: 'Analytics', icon: FiBarChart2, component: AdminAnalytics },
  { id: 'settings', label: 'Settings', icon: FiSettings, component: AdminSettings },
  { id: 'audit', label: 'Audit & Reports', icon: FiShield, component: AdminAuditReports },
];

const AdminDashboard = () => {
  const [active, setActive] = useState('overview');
  const rootRef = useRef(null);
  const ActiveComponent = TABS.find((t) => t.id === active)?.component || AdminOverview;

  // When switching tabs, bring the page back to the top so the sticky tab bar
  // never hides the top of the newly loaded tab's content.
  const switchTab = (id) => {
    setActive(id);
    const scroller = rootRef.current?.parentElement;
    if (scroller && typeof scroller.scrollTo === 'function') {
      scroller.scrollTo({ top: 0, behavior: 'auto' });
    }
    if (window.scrollY > 0) {
      window.scrollTo(0, 0);
    }
  };

  return (
    <div ref={rootRef} className="pt-14">
      {/* Sticky tab bar — fixed directly beneath the navbar, spanning the
          content column (right of the sidebar) so it always sits next to it. */}
      <div className="fixed top-16 left-0 lg:left-64 right-0 z-30 border-b border-slate-200 bg-white px-4 py-2 shadow-sm">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === active;
            return (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="text-lg" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      <ActiveComponent />
    </div>
  );
};

export default AdminDashboard;

