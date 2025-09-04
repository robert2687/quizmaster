import React from 'react';
import { ToastMessage } from '../types';

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const toastTypeClasses = {
  success: {
    bg: 'bg-gradient-to-r from-green-500 to-teal-500',
    iconColor: 'text-white',
    textColor: 'text-white',
  },
  info: {
    bg: 'bg-gradient-to-r from-sky-500 to-cyan-500',
    iconColor: 'text-white',
    textColor: 'text-white',
  },
};

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const typeStyle = toastTypeClasses[toast.type] || toastTypeClasses.info;

  return (
    <div
      className={`relative flex items-center w-full max-w-sm p-4 mb-4 rounded-lg shadow-lg ${typeStyle.bg} ${typeStyle.textColor} transform transition-all duration-300 ease-in-out animate-toast-in`}
      role="alert"
    >
      {toast.icon && (
         <div className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 ${typeStyle.iconColor}`}>
           {toast.icon}
           <span className="sr-only">Icon</span>
         </div>
      )}
      <div className="ml-3 text-sm font-medium pr-4">{toast.message}</div>
      <button
        type="button"
        className="absolute top-2 right-2 -mx-1.5 -my-1.5 bg-white/20 text-white rounded-lg focus:ring-2 focus:ring-white p-1.5 hover:bg-white/30 inline-flex h-8 w-8"
        onClick={() => onDismiss(toast.id)}
        aria-label="Close"
      >
        <span className="sr-only">Close</span>
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
        </svg>
      </button>
    </div>
  );
};

export default Toast;