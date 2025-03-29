// src/app/mymech/_components/DiagnosisForm.tsx
import React from "react";
import { Loader } from "lucide-react";

interface DiagnosisFormProps {
  userQuery: string;
  setUserQuery: (query: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
}

export default function DiagnosisForm({
  userQuery,
  setUserQuery,
  onSubmit,
  loading,
  error,
}: DiagnosisFormProps) {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-800 mb-3">
        Describe Your Vehicle Issue
      </h3>

      <p className="text-gray-600 mb-4">
        Provide details about the symptoms, when they occur, and any relevant
        information that might help diagnose the problem.
      </p>

      <div className="mb-4">
        <textarea
          value={userQuery}
          onChange={(e) => setUserQuery(e.target.value)}
          placeholder="E.g., My car is making a grinding noise when I brake, or the check engine light is on and the car feels sluggish when accelerating..."
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          rows={5}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={onSubmit}
          disabled={loading || !userQuery.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center"
        >
          {loading ? (
            <>
              <Loader size={18} className="animate-spin mr-2" />
              Analyzing...
            </>
          ) : (
            "Diagnose Issue"
          )}
        </button>
      </div>
    </div>
  );
}
