// src/app/mymechc/_components/DiagnosisResult.tsx
import React from "react";
import {
  AlertCircle,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";

interface DiagnosisResultProps {
  diagnosis: {
    diagnosis: string;
    likelyIssue: string;
    severity: "low" | "medium" | "high";
    urgency: boolean;
    nextSteps: string[];
    estimatedCost: string;
    relevantSources?: number;
  };
  onNewDiagnosis: () => void;
}

export default function DiagnosisResult({
  diagnosis,
  onNewDiagnosis,
}: DiagnosisResultProps) {
  // Determine severity icon and color
  const getSeverityDetails = () => {
    switch (diagnosis.severity) {
      case "low":
        return {
          icon: <CheckCircle size={20} className="text-green-500" />,
          color: "text-green-700",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
        };
      case "medium":
        return {
          icon: <AlertTriangle size={20} className="text-yellow-500" />,
          color: "text-yellow-700",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
        };
      case "high":
        return {
          icon: <AlertCircle size={20} className="text-red-500" />,
          color: "text-red-700",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
        };
      default:
        return {
          icon: <HelpCircle size={20} className="text-gray-500" />,
          color: "text-gray-700",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
        };
    }
  };

  const severityDetails = getSeverityDetails();

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={onNewDiagnosis}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={16} className="mr-1" />
          New Diagnosis
        </button>
      </div>

      {/* Diagnosis summary */}
      <div
        className={`${severityDetails.bgColor} ${severityDetails.borderColor} border rounded-md p-4 mb-6`}
      >
        <div className="flex items-start">
          {severityDetails.icon}
          <div className="ml-3">
            <h3 className={`font-medium ${severityDetails.color}`}>
              {diagnosis.likelyIssue}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Severity:{" "}
              <span className="font-medium">
                {diagnosis.severity.charAt(0).toUpperCase() +
                  diagnosis.severity.slice(1)}
              </span>
              {diagnosis.urgency && (
                <span className="ml-2 text-red-600 font-medium">
                  • Requires immediate attention
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Full diagnosis */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-3">
          Detailed Diagnosis
        </h3>
        <div className="prose prose-sm max-w-none text-gray-700">
          {diagnosis.diagnosis.split("\n").map((paragraph, idx) => (
            <p key={idx} className="mb-2">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* Next steps */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-3">
          Recommended Next Steps
        </h3>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          {diagnosis.nextSteps.map((step, idx) => (
            <li key={idx}>{step}</li>
          ))}
        </ul>
      </div>

      {/* Cost estimate */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-2">
          Estimated Cost
        </h3>
        <p className="text-gray-700">{diagnosis.estimatedCost}</p>
      </div>

      {/* Knowledge base info */}
      {diagnosis.relevantSources && (
        <div className="text-xs text-gray-500 mt-6 pt-4 border-t border-gray-100">
          Analysis based on {diagnosis.relevantSources} relevant repair cases
          from our knowledge base.
        </div>
      )}
    </div>
  );
}
