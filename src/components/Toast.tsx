import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface ToastProps {
  message: string;
  subtext?: string;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, subtext, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 bg-[#4A3C31] text-[#F7F3EE] px-5 py-4 rounded-2xl shadow-xl max-w-md border border-[#FCE38A]/30 animate-bounce-in">
      <CheckCircle2 className="w-6 h-6 text-[#FCE38A] shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="font-semibold text-sm text-[#F7F3EE]">{message}</h4>
        {subtext && <p className="text-xs text-[#DDD1BD] mt-0.5">{subtext}</p>}
      </div>
      <button
        onClick={onClose}
        className="text-[#DDD1BD] hover:text-white transition-colors p-1"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
