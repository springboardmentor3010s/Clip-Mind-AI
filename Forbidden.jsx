import React from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiHome } from 'react-icons/fi';


const Forbidden = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center pt-16">
      <div className="text-center">
        <div className="text-9xl font-bold text-red-200 mb-4">403</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Access Forbidden</h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          You don't have permission to access this page. Please contact your
          administrator if you believe this is an error.
        </p>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          <FiHome />
          <span>Go to Homepage</span>
        </Link>
      </div>
    </div>
  );
};

export default Forbidden;
