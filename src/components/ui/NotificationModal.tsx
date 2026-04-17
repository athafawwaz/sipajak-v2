import React, { useEffect, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useToastStore } from '../../store/toastStore';
import type { ToastVariant } from '../../types';
import Button from './Button';

const variantConfig: Record<ToastVariant, { bg: string; icon: React.ReactNode; text: string; buttonColor: 'primary' | 'danger' | 'warning' | 'secondary' }> = {
  success: {
    bg: 'bg-emerald-50 text-emerald-600',
    icon: <CheckCircle className="w-16 h-16 text-emerald-500" />,
    text: 'text-emerald-800',
    buttonColor: 'primary',
  },
  error: {
    bg: 'bg-red-50 text-red-600',
    icon: <AlertCircle className="w-16 h-16 text-red-500" />,
    text: 'text-red-800',
    buttonColor: 'danger',
  },
  info: {
    bg: 'bg-blue-50 text-blue-600',
    icon: <Info className="w-16 h-16 text-blue-500" />,
    text: 'text-blue-800',
    buttonColor: 'primary',
  },
  warning: {
    bg: 'bg-amber-50 text-amber-600',
    icon: <AlertTriangle className="w-16 h-16 text-amber-500" />,
    text: 'text-amber-800',
    buttonColor: 'warning',
  },
};

const NotificationModal: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  // If there are multiple toasts, we just show the most recent one (the last one)
  const activeToast = toasts[toasts.length - 1];

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeToast) {
        removeToast(activeToast.id);
      }
    },
    [activeToast, removeToast]
  );

  useEffect(() => {
    if (activeToast) {
      document.addEventListener('keydown', handleEscape);
      // Optional: Prevent background scrolling when modal is open
      // document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      // document.body.style.overflow = '';
    };
  }, [activeToast, handleEscape]);

  if (!activeToast) return null;

  const config = variantConfig[activeToast.variant];
  const titleMap: Record<ToastVariant, string> = {
    success: 'Berhasil',
    error: 'Gagal',
    warning: 'Peringatan',
    info: 'Informasi',
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
      />

      {/* Modal content */}
      <div
        className={cn(
          'relative w-full max-w-sm bg-white rounded-2xl shadow-2xl animate-scale-in flex flex-col',
          'overflow-hidden'
        )}
      >
        <button
          onClick={() => removeToast(activeToast.id)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 flex flex-col items-center text-center">
          <div className={cn('p-4 rounded-full mb-4', config.bg)}>
            {config.icon}
          </div>
          
          <h2 className={cn('text-xl font-bold mb-2', config.text)}>
            {titleMap[activeToast.variant]}
          </h2>
          
          <p className="text-gray-600 mb-6 text-sm">
            {activeToast.message}
          </p>

          <Button 
            className="w-full justify-center" 
            variant={config.buttonColor}
            onClick={() => removeToast(activeToast.id)}
          >
            Tutup
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NotificationModal;
