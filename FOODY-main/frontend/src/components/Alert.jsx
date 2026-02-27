import React from 'react';
import { FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaExclamationCircle, FaTimes } from 'react-icons/fa';

const Alert = ({ 
  type = 'info', 
  title, 
  message, 
  onClose, 
  isVisible 
}) => {
  if (!isVisible) return null;

  const typeStyles = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-400',
      text: 'text-blue-800',
      iconColor: 'text-blue-400',
      icon: <FaInfoCircle />
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-400',
      text: 'text-green-800',
      iconColor: 'text-green-400',
      icon: <FaCheckCircle />
    },
    warning: {
      bg: 'bg-orange-50',
      border: 'border-orange-400',
      text: 'text-orange-800',
      iconColor: 'text-orange-400',
      icon: <FaExclamationTriangle />
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-400',
      text: 'text-red-800',
      iconColor: 'text-red-400',
      icon: <FaExclamationCircle />
    }
  };

  const style = typeStyles[type] || typeStyles.info;

  return (
    <div className="fixed top-24 left-1/2 z-[10001] w-[90%] sm:w-auto sm:min-w-[400px] max-w-lg animate-alert-slide transition-all duration-300">
      <div className={`${style.bg} ${style.border} border-l-4 p-4 rounded-xl shadow-2xl flex items-center space-x-4 border-opacity-50 backdrop-blur-sm bg-opacity-95`}>
        <div className={`flex-shrink-0 ${style.iconColor} text-xl`}>
          {style.icon}
        </div>
        <div className="flex-1">
          {title && <h3 className={`text-sm font-bold ${style.text} tracking-tight`}>{title}</h3>}
          <p className={`text-xs sm:text-sm ${style.text} font-medium leading-relaxed`}>
            {message}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 ml-auto rounded-full p-1.5 inline-flex items-center justify-center hover:bg-black/5 transition-all active:scale-90 ${style.text}`}
          >
            <span className="sr-only">Close</span>
            <FaTimes size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
