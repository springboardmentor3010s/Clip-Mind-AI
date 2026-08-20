import React from 'react';
import { FiUpload, FiClock, FiCheckCircle, FiBarChart2 } from 'react-icons/fi';


const DashboardCards = ({ stats }) => {
  const cards = [
    {
      title: 'Total Uploads',
      value: stats?.total_uploads || 0,
      icon: FiUpload,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      change: '+0%',
    },
    {
      title: 'Recent Uploads',
      value: stats?.recent_uploads || 0,
      icon: FiClock,
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600',
      change: '+0%',
    },
    {
      title: 'Processing',
      value: stats?.processing || 0,
      icon: FiClock,
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-600',
      change: '0%',
    },
    {
      title: 'Completed',
      value: stats?.completed || 0,
      icon: FiCheckCircle,
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
      change: '+0%',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-transform hover:scale-105"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.bgColor} w-12 h-12 rounded-lg flex items-center justify-center`}>
                <Icon className={`text-xl ${card.textColor}`} />
              </div>
              <span className="text-xs font-medium text-gray-500">{card.change}</span>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-800">{card.value}</p>
              <p className="text-sm text-gray-500 mt-1">{card.title}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardCards;
