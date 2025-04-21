
import React from "react";

const LoadingOverlay = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md">
    <div className="flex flex-col items-center space-y-2 text-white">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      <p>Loading facial recognition...</p>
    </div>
  </div>
);

export default LoadingOverlay;
