import { useAlert } from '../contexts/AlertContext';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const AlertContainer = () => {
  const { alerts, dismissAlert, confirmDialog } = useAlert();

  const getAlertStyles = (type) => {
    const styles = {
      success: {
        bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
        border: 'border-green-500',
        text: 'text-green-800',
        icon: 'text-green-600',
        iconBg: 'bg-green-100',
        Icon: CheckCircle,
      },
      error: {
        bg: 'bg-gradient-to-r from-red-50 to-rose-50',
        border: 'border-red-500',
        text: 'text-red-800',
        icon: 'text-red-600',
        iconBg: 'bg-red-100',
        Icon: AlertCircle,
      },
      warning: {
        bg: 'bg-gradient-to-r from-yellow-50 to-amber-50',
        border: 'border-yellow-500',
        text: 'text-yellow-800',
        icon: 'text-yellow-600',
        iconBg: 'bg-yellow-100',
        Icon: AlertTriangle,
      },
      info: {
        bg: 'bg-gradient-to-r from-blue-50 to-cyan-50',
        border: 'border-blue-500',
        text: 'text-blue-800',
        icon: 'text-blue-600',
        iconBg: 'bg-blue-100',
        Icon: Info,
      },
    };
    return styles[type] || styles.info;
  };

  const getConfirmStyles = (type) => {
    const styles = {
      success: {
        button: 'bg-green-600 hover:bg-green-700',
        icon: 'text-green-600',
      },
      error: {
        button: 'bg-red-600 hover:bg-red-700',
        icon: 'text-red-600',
      },
      warning: {
        button: 'bg-yellow-600 hover:bg-yellow-700',
        icon: 'text-yellow-600',
      },
      info: {
        button: 'bg-blue-600 hover:bg-blue-700',
        icon: 'text-blue-600',
      },
    };
    return styles[type] || styles.warning;
  };

  return (
    <>
      {/* Toast Alerts Container */}
      <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md w-full pointer-events-none">
        {alerts
          .filter((alert) => typeof alert?.message === 'string' && alert.message.trim())
          .map((alert) => {
          const style = getAlertStyles(alert.type);
          const Icon = style.Icon;

          return (
            <div
              key={alert.id}
              className={`
                ${style.bg} ${style.border}
                border-l-4 rounded-lg shadow-2xl p-4
                flex items-start gap-3
                pointer-events-auto
                animate-slide-in-right
                hover:shadow-3xl transition-all duration-300
                backdrop-blur-sm
              `}
            >
              {/* Icon */}
              <div className={`${style.iconBg} rounded-full p-2 flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${style.icon}`} />
              </div>

              {/* Message */}
              <div className={`flex-1 ${style.text} font-medium`}>
                {alert.message}
              </div>

              {/* Close Button */}
              <button
                onClick={() => dismissAlert(alert.id)}
                className={`
                  ${style.icon} hover:opacity-70
                  transition-opacity flex-shrink-0
                  focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${style.border} rounded-full p-1
                `}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirm Dialog Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={confirmDialog.onCancel}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in overflow-hidden">
            {/* Header with gradient */}
            <div className={`
              ${getConfirmStyles(confirmDialog.type).icon === 'text-red-600' ? 'bg-gradient-to-r from-red-500 to-rose-500' :
                getConfirmStyles(confirmDialog.type).icon === 'text-yellow-600' ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
                getConfirmStyles(confirmDialog.type).icon === 'text-green-600' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                'bg-gradient-to-r from-blue-500 to-cyan-500'
              } h-2`}
            />

            <div className="p-6">
              {/* Icon */}
              <div className="flex items-center justify-center mb-4">
                <div className={`
                  ${getConfirmStyles(confirmDialog.type).icon === 'text-red-600' ? 'bg-red-100' :
                    getConfirmStyles(confirmDialog.type).icon === 'text-yellow-600' ? 'bg-yellow-100' :
                    getConfirmStyles(confirmDialog.type).icon === 'text-green-600' ? 'bg-green-100' :
                    'bg-blue-100'
                  } rounded-full p-4`}
                >
                  {confirmDialog.type === 'error' && <AlertCircle className={`w-12 h-12 ${getConfirmStyles(confirmDialog.type).icon}`} />}
                  {confirmDialog.type === 'warning' && <AlertTriangle className={`w-12 h-12 ${getConfirmStyles(confirmDialog.type).icon}`} />}
                  {confirmDialog.type === 'success' && <CheckCircle className={`w-12 h-12 ${getConfirmStyles(confirmDialog.type).icon}`} />}
                  {confirmDialog.type === 'info' && <Info className={`w-12 h-12 ${getConfirmStyles(confirmDialog.type).icon}`} />}
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
                {confirmDialog.title}
              </h3>

              {/* Message */}
              <p className="text-gray-600 text-center mb-6">
                {confirmDialog.message}
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={confirmDialog.onCancel}
                  className="
                    flex-1 px-6 py-3 rounded-xl
                    bg-gray-100 hover:bg-gray-200
                    text-gray-700 font-semibold
                    transition-all duration-200
                    hover:shadow-md
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300
                  "
                >
                  {confirmDialog.cancelText}
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className={`
                    flex-1 px-6 py-3 rounded-xl
                    ${getConfirmStyles(confirmDialog.type).button}
                    text-white font-semibold
                    transition-all duration-200
                    hover:shadow-lg
                    focus:outline-none focus:ring-2 focus:ring-offset-2
                    ${getConfirmStyles(confirmDialog.type).icon === 'text-red-600' ? 'focus:ring-red-500' :
                      getConfirmStyles(confirmDialog.type).icon === 'text-yellow-600' ? 'focus:ring-yellow-500' :
                      getConfirmStyles(confirmDialog.type).icon === 'text-green-600' ? 'focus:ring-green-500' :
                      'focus:ring-blue-500'
                    }
                  `}
                >
                  {confirmDialog.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add custom animations */}
      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .shadow-3xl {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </>
  );
};

export default AlertContainer;
