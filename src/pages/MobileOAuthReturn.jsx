import { useEffect, useMemo } from 'react';

const buildAppReturnUrl = () => {
  const currentUrl = new URL(window.location.href);
  const appCallback = currentUrl.searchParams.get('app_callback');

  if (!appCallback || !/^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(appCallback)) {
    return null;
  }

  const targetUrl = new URL(appCallback);

  currentUrl.searchParams.forEach((value, key) => {
    if (key !== 'app_callback') {
      targetUrl.searchParams.set(key, value);
    }
  });

  if (currentUrl.hash) {
    targetUrl.hash = currentUrl.hash.slice(1);
  }

  return targetUrl.toString();
};

const MobileOAuthReturn = () => {
  const appReturnUrl = useMemo(buildAppReturnUrl, []);

  useEffect(() => {
    if (!appReturnUrl) {
      return;
    }

    window.location.replace(appReturnUrl);

    const timeoutId = window.setTimeout(() => {
      window.location.href = appReturnUrl;
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, [appReturnUrl]);

  if (!appReturnUrl) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Unable to open the app</h1>
          <p className="text-slate-600 leading-7">
            The mobile return link is missing or invalid. Go back to the app and try Google sign-in again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-3">Returning to SellGH</h1>
        <p className="text-slate-600 leading-7 mb-6">
          If the app does not open automatically, tap the button below.
        </p>
        <a
          href={appReturnUrl}
          className="inline-flex items-center justify-center rounded-2xl bg-indigo-700 px-6 py-3 font-semibold text-white hover:bg-indigo-800"
        >
          Open SellGH App
        </a>
      </div>
    </div>
  );
};

export default MobileOAuthReturn;
