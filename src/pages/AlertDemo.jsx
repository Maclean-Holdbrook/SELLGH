import { useState } from 'react';
import { useAlert } from '../contexts/AlertContext';
import Navbar from '../components/Navbar';

const AlertDemo = () => {
  const alert = useAlert();
  const [customMessage, setCustomMessage] = useState('');
  const [customDuration, setCustomDuration] = useState(4000);

  const handleConfirmDemo = async () => {
    const confirmed = await alert.confirm(
      'This is a demo confirmation dialog. Click confirm or cancel to see how it works!',
      {
        title: 'Demo Confirmation',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        type: 'warning'
      }
    );

    if (confirmed) {
      alert.success('You clicked Confirm!');
    } else {
      alert.info('You clicked Cancel');
    }
  };

  const handleDeleteDemo = async () => {
    const confirmed = await alert.confirm(
      'Are you sure you want to delete this item? This action cannot be undone.',
      {
        title: 'Delete Item',
        confirmText: 'Yes, Delete',
        cancelText: 'Cancel',
        type: 'error'
      }
    );

    if (confirmed) {
      alert.success('Item deleted successfully');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Alert System Demo
          </h1>
          <p className="text-lg text-gray-600">
            Test all the different alert types and confirm dialogs
          </p>
        </div>

        {/* Toast Alerts Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Toast Alerts
          </h2>
          <p className="text-gray-600 mb-6">
            These alerts appear in the top-right corner and auto-dismiss after a few seconds.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => alert.success('Success! Operation completed.')}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 hover:shadow-lg"
            >
              Success Alert
            </button>

            <button
              onClick={() => alert.error('Error! Something went wrong.')}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 hover:shadow-lg"
            >
              Error Alert
            </button>

            <button
              onClick={() => alert.warning('Warning! Please be careful.')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 hover:shadow-lg"
            >
              Warning Alert
            </button>

            <button
              onClick={() => alert.info('Info: Here is some information.')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 hover:shadow-lg"
            >
              Info Alert
            </button>
          </div>
        </div>

        {/* Confirm Dialogs Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Confirmation Dialogs
          </h2>
          <p className="text-gray-600 mb-6">
            These modals require user confirmation before proceeding.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleConfirmDemo}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 hover:shadow-lg"
            >
              Basic Confirmation
            </button>

            <button
              onClick={handleDeleteDemo}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 hover:shadow-lg"
            >
              Delete Confirmation
            </button>

            <button
              onClick={async () => {
                const confirmed = await alert.confirm(
                  'Do you want to proceed with this action?',
                  {
                    title: 'Confirm Action',
                    confirmText: 'Yes, Proceed',
                    cancelText: 'No, Go Back',
                    type: 'success'
                  }
                );
                if (confirmed) {
                  alert.success('Action confirmed!');
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 hover:shadow-lg"
            >
              Success Type Confirm
            </button>

            <button
              onClick={async () => {
                const confirmed = await alert.confirm(
                  'This is important information. Please read carefully.',
                  {
                    title: 'Important Notice',
                    confirmText: 'I Understand',
                    cancelText: 'Cancel',
                    type: 'info'
                  }
                );
                if (confirmed) {
                  alert.info('Acknowledged!');
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 hover:shadow-lg"
            >
              Info Type Confirm
            </button>
          </div>
        </div>

        {/* Custom Message Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Custom Alert
          </h2>
          <p className="text-gray-600 mb-6">
            Create your own alert with custom message and duration.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <input
                type="text"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Enter your custom message"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (ms) - 0 for no auto-dismiss
              </label>
              <input
                type="number"
                value={customDuration}
                onChange={(e) => setCustomDuration(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => alert.success(customMessage || 'Custom success!', customDuration)}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl"
              >
                Success
              </button>
              <button
                onClick={() => alert.error(customMessage || 'Custom error!', customDuration)}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl"
              >
                Error
              </button>
              <button
                onClick={() => alert.warning(customMessage || 'Custom warning!', customDuration)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-4 rounded-xl"
              >
                Warning
              </button>
              <button
                onClick={() => alert.info(customMessage || 'Custom info!', customDuration)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl"
              >
                Info
              </button>
            </div>
          </div>
        </div>

        {/* Multiple Alerts Demo */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Multiple Alerts
          </h2>
          <p className="text-gray-600 mb-6">
            Test showing multiple alerts at once - they stack nicely!
          </p>

          <button
            onClick={() => {
              alert.success('First alert - Success!');
              setTimeout(() => alert.info('Second alert - Info!'), 300);
              setTimeout(() => alert.warning('Third alert - Warning!'), 600);
              setTimeout(() => alert.error('Fourth alert - Error!'), 900);
            }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 hover:shadow-lg"
          >
            Show 4 Alerts in Sequence
          </button>
        </div>

        {/* Real World Examples */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Real-World Examples
          </h2>
          <p className="text-gray-600 mb-6">
            Common use cases in the application
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => alert.success('Product added to cart!')}
              className="bg-white border-2 border-green-200 hover:border-green-400 text-gray-800 font-semibold py-4 px-6 rounded-xl transition-all duration-200"
            >
              Add to Cart
            </button>

            <button
              onClick={() => alert.success('Item added to wishlist!')}
              className="bg-white border-2 border-pink-200 hover:border-pink-400 text-gray-800 font-semibold py-4 px-6 rounded-xl transition-all duration-200"
            >
              Add to Wishlist
            </button>

            <button
              onClick={() => alert.success('Order placed successfully!')}
              className="bg-white border-2 border-blue-200 hover:border-blue-400 text-gray-800 font-semibold py-4 px-6 rounded-xl transition-all duration-200"
            >
              Order Placed
            </button>

            <button
              onClick={() => alert.info('Processing payment...')}
              className="bg-white border-2 border-cyan-200 hover:border-cyan-400 text-gray-800 font-semibold py-4 px-6 rounded-xl transition-all duration-200"
            >
              Payment Processing
            </button>

            <button
              onClick={() => alert.error('Payment failed. Try again.')}
              className="bg-white border-2 border-red-200 hover:border-red-400 text-gray-800 font-semibold py-4 px-6 rounded-xl transition-all duration-200"
            >
              Payment Error
            </button>

            <button
              onClick={() => alert.warning('Stock running low!')}
              className="bg-white border-2 border-yellow-200 hover:border-yellow-400 text-gray-800 font-semibold py-4 px-6 rounded-xl transition-all duration-200"
            >
              Low Stock Warning
            </button>
          </div>
        </div>

        {/* Code Examples */}
        <div className="mt-8 bg-gray-900 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Quick Usage</h2>
          <pre className="bg-gray-800 p-4 rounded-xl overflow-x-auto">
            <code>{`import { useAlert } from '../contexts/AlertContext';

function MyComponent() {
  const alert = useAlert();

  // Show alerts
  alert.success('Success message');
  alert.error('Error message');
  alert.warning('Warning message');
  alert.info('Info message');

  // Confirm dialog
  const confirmed = await alert.confirm('Are you sure?');
  if (confirmed) {
    // Do something
  }
}`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default AlertDemo;
