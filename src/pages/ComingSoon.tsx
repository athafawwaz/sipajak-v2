import React from 'react';
import { Rocket } from 'lucide-react';

interface ComingSoonProps {
  title: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 animate-bounce">
        <Rocket className="w-10 h-10 text-blue-600" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-500 max-w-md mx-auto">
        Kami sedang membangun fitur ini untuk Anda. Pantau terus untuk pembaruan selanjutnya!
      </p>
      <div className="mt-8 flex gap-3">
        <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
        <div className="w-3 h-3 bg-blue-300 rounded-full animate-pulse [animation-delay:200ms]" />
        <div className="w-3 h-3 bg-blue-200 rounded-full animate-pulse [animation-delay:400ms]" />
      </div>
    </div>
  );
};

export default ComingSoon;
