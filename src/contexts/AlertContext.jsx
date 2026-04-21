import { createContext, useCallback, useContext, useState } from 'react';

const AlertContext = createContext(null);

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

  const dismissAlert = useCallback((id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  const showAlert = useCallback((message, type = 'info', duration = 4000) => {
    const normalizedMessage = typeof message === 'string' ? message.trim() : '';

    if (!normalizedMessage) {
      return null;
    }

    const id = `alert-${Date.now()}-${Math.random()}`;
    const alert = { id, message: normalizedMessage, type, duration };

    setAlerts((prev) => [...prev, alert]);

    if (duration > 0) {
      setTimeout(() => {
        dismissAlert(id);
      }, duration);
    }

    return id;
  }, [dismissAlert]);

  const success = useCallback((message, duration) => showAlert(message, 'success', duration), [showAlert]);
  const error = useCallback((message, duration) => showAlert(message, 'error', duration), [showAlert]);
  const warning = useCallback((message, duration) => showAlert(message, 'warning', duration), [showAlert]);
  const info = useCallback((message, duration) => showAlert(message, 'info', duration), [showAlert]);

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
        },
      });
    });
  }, []);

  return (
    <AlertContext.Provider
      value={{
        alerts,
        confirmDialog,
        showAlert,
        dismissAlert,
        success,
        error,
        warning,
        info,
        confirm,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};
