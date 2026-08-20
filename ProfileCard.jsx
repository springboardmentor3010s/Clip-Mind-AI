import React from 'react';
import { FiUser, FiMail, FiCalendar, FiEdit3 } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';
import RoleMenu from './RoleMenu.jsx';


const ProfileCard = () => {
  const { user } = useAuth();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Profile</h3>
        <button className="text-gray-400 hover:text-gray-600">
          <FiEdit3 className="text-lg" />
        </button>
      </div>

      <div className="flex items-center space-x-4 mb-4">
        {user?.avatar_url ? (
          <img
            src={user.avatar_url}
            alt="Profile Avatar"
            className="w-16 h-16 rounded-full object-cover border border-gray-200"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center"
          style={user?.avatar_url ? { display: 'none' } : {}}
        >
          <FiUser className="text-primary-600 text-2xl" />
        </div>
        <div>
          <p className="text-xl font-semibold text-gray-800">{user?.full_name || 'N/A'}</p>
          <p className="text-sm text-gray-500">@{user?.username || 'N/A'}</p>
        </div>
      </div>

      <RoleMenu />

      <div className="mt-4 space-y-3">
        <div className="flex items-center space-x-3">
          <FiMail className="text-gray-400" />
          <span className="text-sm text-gray-700">{user?.email || 'N/A'}</span>
        </div>
        <div className="flex items-center space-x-3">
          <FiCalendar className="text-gray-400" />
          <span className="text-sm text-gray-700">
            Joined: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
