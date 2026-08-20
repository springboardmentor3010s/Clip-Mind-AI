import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';


const roleColors = {
  Administrator: 'bg-purple-100 text-purple-800 border-purple-200',
  'Content Creator': 'bg-blue-100 text-blue-800 border-blue-200',
  Educator: 'bg-green-100 text-green-800 border-green-200',
  Learner: 'bg-orange-100 text-orange-800 border-orange-200',
};

const roleIcons = {
  Administrator: '👑',
  'Content Creator': '🎥',
  Educator: '📚',
  Learner: '🎓',
};

const RoleMenu = ({ role }) => {
  const { user } = useAuth();
  const userRole = role || user?.role || 'Learner';
  const colorClass = roleColors[userRole] || roleColors['Learner'];
  const icon = roleIcons[userRole] || roleIcons['Learner'];

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
      <span className="mr-1">{icon}</span>
      {userRole}
    </div>
  );
};

export default RoleMenu;
