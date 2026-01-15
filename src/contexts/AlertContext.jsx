import { createContext, useContext, useState, useCallback } from 'react';

const AlertContext = createContext({});

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Generate unique ID for alerts
  const generateId = () => `alert-${Date.now()}-${Math.random()}`;

  // Show alert
  const showAlert = useCallback((message, type = 'info', duration = 4000) => {
    const id = generateId();
    const alert = { id, message, type, duration };

    setAlerts(prev => [...prev, alert]);

    // Auto dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        dismissAlert(id);
      }, duration);
    }

    return id;
  }, []);

  // Dismiss alert
  const dismissAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  // Convenience methods
  const success = useCallback((message, duration) => {
    return showAlert(message, 'success', duration);
  }, [showAlert]);

  const error = useCallback((message, duration) => {
    return showAlert(message, 'error', duration);
  }, [showAlert]);

  const warning = useCallback((message, duration) => {
    return showAlert(message, 'warning', duration);
  }, [showAlert]);

  const info = useCallback((message, duration) => {
    return showAlert(message, 'info', duration);
  }, [showAlert]);

  // Confirm dialog
  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        message,
        title: options.title || 'Confirm Action',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        type: options.type || 'warning',
        onConfirm: () => {
          setConfirmDialog(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmDialog(null);
          resolve(false);
        }
      });
    });
  }, []);

  const value = {
    alerts,
    confirmDialog,
    showAlert,
    dismissAlert,
    success,
    error,
    warning,
    info,
    confirm,
  };

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
};
