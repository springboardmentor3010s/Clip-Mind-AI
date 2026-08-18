import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#070B16] text-slate-100 font-sans selection:bg-blue-500 selection:text-white flex flex-col justify-center items-center p-4 antialiased">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
};
