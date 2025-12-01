"use client";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
  actionBar?: React.ReactNode;
  title?: string;
}

const Modal: React.FC<ModalProps> = ({ onClose, children, actionBar, title }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Prevent scrolling when modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  if (!mounted) {
    return null;
  }

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[100]">
      {/* Overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm transition-opacity"
      ></div>

      {/* Modal Content */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-md pointer-events-auto transform transition-all scale-100 opacity-100">
          {/* Header */}
          {(title ) && (
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              {title && <h3 className="text-xl font-semibold text-white">{title}</h3>}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Body */}
          <div className="p-6 text-gray-300">{children}</div>

          {/* Footer / Action Bar */}
          {actionBar && (
            <div className="flex justify-end gap-3 p-4 border-t border-gray-700 bg-gray-800/50 rounded-b-xl">
              {actionBar}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
