// 🔔 src/components/Toast.js
// Componente de notificação toast global

import React from 'react';
import { useApp } from '../context/AppContext';
import './componentsCss/Toast.css';

const Toast = () => {
  const { toastMessage, toastType, hideToast } = useApp();

  if (!toastMessage) return null;

  const toastIcons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div
      className={`toast toast-${toastType}`}
      onClick={hideToast}
    >
      <span className="toast-icon">{toastIcons[toastType] || 'ℹ️'}</span>
      <span className="toast-message">{toastMessage}</span>
      <button
        className="toast-close"
        onClick={(e) => {
          e.stopPropagation();
          hideToast();
        }}
      >
        ✕
      </button>
    </div>
  );
};

export default Toast;
