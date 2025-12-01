// components/ImageEditingNav.tsx
import React, { useState } from "react";

import { generatePDF, IReport } from "../utils/pdfGenerator";

interface ImageEditingNavProps {
  brightness: number;
  blur: number;
  grayscale: number;
  hueRotate: number;
  contrast: number;
  saturate: number;
  onChange: (
    key: "brightness" | "blur" | "grayscale" | "hueRotate" | "contrast" | "saturate",
    value: number
  ) => void;
  onGenerateReport?: () => void;
  isGeneratingReport?: boolean;
  damageCount?: number;
  isReportView?: boolean;
  report?: IReport;
}

const ImageEditingNav: React.FC<ImageEditingNavProps> = ({
  brightness,
  blur,
  grayscale,
  hueRotate,
  contrast,
  saturate,
  onChange,
  onGenerateReport,
  isGeneratingReport,
  damageCount,
  isReportView = false,
  report,
}) => {
  const [openSection, setOpenSection] = useState<string | null>("basic");

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <nav className="bg-gray-800 p-6 w-full h-full flex flex-col items-center overflow-y-auto">
      <div className="w-full flex justify-between items-center mb-6">
        <h1 className="text-2xl text-white font-semibold">Image Editing</h1>
      </div>

      {/* Generate Report Button */}
      {onGenerateReport && (
        <button
          onClick={onGenerateReport}
          disabled={isGeneratingReport || !damageCount || damageCount === 0}
          className={`w-full py-3 rounded-lg font-bold text-white shadow-lg transition-all mb-6 flex items-center justify-center gap-2 ${
            !damageCount || damageCount === 0
              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-500"
          }`}
        >
          {isGeneratingReport ? (
            <span>Saving...</span>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Generate Report ({damageCount || 0})
            </>
          )}
        </button>
      )}
      
      {/* Download Report Button (Report View) */}
      {isReportView && report && (
        <button
          onClick={() => generatePDF(report)}
          className="w-full py-3 rounded-lg font-bold text-white shadow-lg transition-all mb-6 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download Report
        </button>
      )}

      {!isReportView && (
      <div className="w-full space-y-4">
        {/* Basic Adjustments Accordion */}
        <div className="border border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("basic")}
            className="w-full px-4 py-3 bg-gray-700 flex justify-between items-center text-left text-sm font-medium text-white hover:bg-gray-600 focus:outline-none"
          >
            <span>Basic Adjustments</span>
            <svg
              className={`w-5 h-5 transform transition-transform ${
                openSection === "basic" ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {openSection === "basic" && (
            <div className="p-4 space-y-6 bg-gray-800">
              {/* Brightness */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-gray-300">Brightness</label>
                  <span className="text-sm text-gray-400">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={brightness}
                  onChange={(e) => onChange("brightness", parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Contrast */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-gray-300">Contrast</label>
                  <span className="text-sm text-gray-400">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={contrast}
                  onChange={(e) => onChange("contrast", parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Saturation */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-gray-300">Saturation</label>
                  <span className="text-sm text-gray-400">{saturate}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturate}
                  onChange={(e) => onChange("saturate", parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Effects Accordion */}
        <div className="border border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("effects")}
            className="w-full px-4 py-3 bg-gray-700 flex justify-between items-center text-left text-sm font-medium text-white hover:bg-gray-600 focus:outline-none"
          >
            <span>Effects</span>
            <svg
              className={`w-5 h-5 transform transition-transform ${
                openSection === "effects" ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {openSection === "effects" && (
            <div className="p-4 space-y-6 bg-gray-800">
              {/* Blur */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-gray-300">Blur</label>
                  <span className="text-sm text-gray-400">{blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={blur}
                  onChange={(e) => onChange("blur", parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Grayscale */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-gray-300">Grayscale</label>
                  <span className="text-sm text-gray-400">{grayscale}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={grayscale}
                  onChange={(e) => onChange("grayscale", parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Hue Rotate */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-gray-300">Hue Rotate</label>
                  <span className="text-sm text-gray-400">{hueRotate}deg</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={hueRotate}
                  onChange={(e) => onChange("hueRotate", parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </nav>
  );
};

export default ImageEditingNav;
