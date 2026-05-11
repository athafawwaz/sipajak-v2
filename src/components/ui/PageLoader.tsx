import React from 'react';
import { Loader2 } from 'lucide-react';

const PageLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm animate-fade-in">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-gray-100 border-t-primary animate-spin" />
        <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary animate-pulse" />
      </div>
      <div className="mt-4 flex flex-col items-center">
        <p className="text-sm font-medium text-gray-600 tracking-wide">Memuat Halaman...</p>
        <div className="mt-2 w-32 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className="w-full h-full bg-primary origin-left animate-loading-bar" />
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
