

export default function History({ analysisHistory = [] }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-8">
  <div className="container mx-auto px-4 sm:px-6 lg:px-8 bg-white rounded-xl shadow-xl p-8">
        <div className="mb-6">
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition mb-4"
          >
            &larr; Back
          </button>
          <h2 className="text-2xl font-bold text-blue-700 text-center">Query History</h2>
        </div>
        {analysisHistory.length === 0 ? (
          <div className="text-gray-400 text-center">No history yet.</div>
        ) : (
          <div className="flex flex-col gap-6">
            {analysisHistory.map((msg, idx) => (
              <div key={idx} className="border-b pb-4 flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                  <span className={`font-bold ${msg.role === 'user' ? 'text-blue-600' : 'text-green-600'}`}>{msg.role === 'user' ? 'You:' : 'AI:'}</span>
                  <span className="ml-2 text-gray-800">{msg.text}</span>
                </div>
                {msg.timestamp && (
                  <span className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleString()}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
