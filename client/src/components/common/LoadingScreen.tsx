import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500 mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <img 
              src="/logo-trans.png" 
              alt="Nexora Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
        </div>
        <h2 className="text-white text-2xl font-bold mt-4">Nexora</h2>
        <p className="text-gray-400 mt-2">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
