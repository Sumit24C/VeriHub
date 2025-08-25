import React, { useState } from "react";

const CookiePreferencesModal = ({ open, onClose }) => {
  const [preferences, setPreferences] = useState({
    analytics: true,
    marketing: false,
    necessary: true
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Cookie Preferences</h2>
        <form>
          <div className="mb-2">
            <label>
              <input type="checkbox" checked={preferences.necessary} disabled /> Necessary Cookies
            </label>
          </div>
          <div className="mb-2">
            <label>
              <input type="checkbox" checked={preferences.analytics} onChange={e => setPreferences({ ...preferences, analytics: e.target.checked })} /> Analytics Cookies
            </label>
          </div>
          <div className="mb-2">
            <label>
              <input type="checkbox" checked={preferences.marketing} onChange={e => setPreferences({ ...preferences, marketing: e.target.checked })} /> Marketing Cookies
            </label>
          </div>
        </form>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default CookiePreferencesModal;
