import { create } from 'zustand';
import type { ToastMessage, ToastVariant } from '../types';

interface ToastStore {
  toasts: ToastMessage[];
  addToast: (message: string, variant: ToastVariant) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (message, variant) => {
    const id = `toast-${Date.now()}`;
    const toast: ToastMessage = { id, message, variant };
    set({ toasts: [...get().toasts, toast] });

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      set({ toasts: get().toasts.filter((t) => t.id !== id) });
    }, 3000);
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
}));
