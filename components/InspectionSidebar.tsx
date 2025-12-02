"use client";
import React, { useEffect, useState } from "react";
import { FaChevronDown, FaChevronRight, FaFolder, FaImage, FaFileAlt, FaClipboardList, FaTrash, FaDownload } from "react-icons/fa";
import Modal from "./Modal";
import Skeleton from "./ui/Skeleton";
import { generatePDF, IReport } from "../utils/pdfGenerator";
import { getOptimizedImageUrl } from "../utils/cloudinary";

interface IInspection {
  _id: string;
  clientName: string;
  createdAt: string;
  turbine: {
    name: string;
    blades: {
      name: string;
      sides: {
        name: string;
        images: { url: string; publicId: string }[];
      }[];
    }[];
  }[];
}

interface InspectionSidebarProps {
  onSelectImage: (data: {
    url: string;
    publicId: string;
    turbine: string;
    blade: string;
    side: string;
    thumbnails: { url: string; publicId: string; side: string }[];
    annotations?: any[];
    clientName?: string;
    filters?: any;
    isReportView?: boolean;
    report?: IReport;
  }) => void;
}

const InspectionSidebar: React.FC<InspectionSidebarProps> = ({
  onSelectImage,
}) => {
  const [activeTab, setActiveTab] = useState<"inspections" | "reports">("inspections");
  const [isLoading, setIsLoading] = useState(true);

  // Inspection State
  const [inspections, setInspections] = useState<IInspection[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Report State
  const [reports, setReports] = useState<IReport[]>([]);
  const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({});

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; message: string; onConfirm?: () => void }>({
    title: "",
    message: "",
  });

  const showModal = (title: string, message: string, onConfirm?: () => void) => {
    setModalContent({ title, message, onConfirm });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  useEffect(() => {
    setIsLoading(true);
    if (activeTab === "inspections") {
      fetch("/api/inspection")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setInspections(data.data);
        })
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    } else {
      fetch("/api/report")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setReports(data.data);
        })
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    }
  }, [activeTab]);

  const toggleExpand = (id: string, setExpandState: React.Dispatch<React.SetStateAction<Record<string, boolean>>>) => {
    setExpandState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDeleteInspection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showModal(
      "Delete Inspection",
      "Are you sure you want to delete this inspection? This will delete all associated images.",
      async () => {
        try {
          const res = await fetch(`/api/inspection?id=${id}`, { method: "DELETE" });
          const data = await res.json();
          if (data.success) {
            setInspections((prev) => prev.filter((i) => i._id !== id));
            closeModal();
          } else {
            // Show error in modal (re-use modal or simple alert fallback if nested modal is tricky, but let's just update content)
             // For simplicity, let's close and show error
             closeModal();
             setTimeout(() => showModal("Error", "Failed to delete inspection: " + data.error), 100);
          }
        } catch (err) {
          console.error("Frontend Delete Error:", err);
          closeModal();
          setTimeout(() => showModal("Error", "An error occurred while deleting."), 100);
        }
      }
    );
  };

  const handleDeleteReport = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showModal(
      "Delete Report",
      "Are you sure you want to delete this report? This will delete all associated images.",
      async () => {
        try {
          const res = await fetch(`/api/report?id=${id}`, { method: "DELETE" });
          const data = await res.json();
          if (data.success) {
            setReports((prev) => prev.filter((r) => r._id !== id));
            closeModal();
          } else {
            closeModal();
            setTimeout(() => showModal("Error", "Failed to delete report: " + data.error), 100);
          }
        } catch (err) {
          console.error("Frontend Delete Error:", err);
          closeModal();
          setTimeout(() => showModal("Error", "An error occurred while deleting."), 100);
        }
      }
    );
  };

  // Auto-expand logic for Inspections (existing)
  const toggleBlade = (
    inspectionId: string,
    turbineName: string,
    blade: IInspection["turbine"][0]["blades"][0],
    clientName: string
  ) => {
    const bladeId = `${inspectionId}-${turbineName}-${blade.name}`;
    toggleExpand(bladeId, setExpanded);
  };

  return (
    <div className="h-full flex flex-col bg-gray-800 text-white border-r border-gray-700">
      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === "inspections"
              ? "bg-gray-700 text-blue-400 border-b-2 border-blue-400"
              : "text-gray-400 hover:text-white hover:bg-gray-700/50"
          }`}
          onClick={() => setActiveTab("inspections")}
        >
          <div className="flex items-center justify-center gap-2">
            <FaClipboardList /> Inspections
          </div>
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === "reports"
              ? "bg-gray-700 text-blue-400 border-b-2 border-blue-400"
              : "text-gray-400 hover:text-white hover:bg-gray-700/50"
          }`}
          onClick={() => setActiveTab("reports")}
        >
          <div className="flex items-center justify-center gap-2">
            <FaFileAlt /> Reports
          </div>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="border border-gray-700 rounded-lg overflow-hidden">
                <div className="p-3 bg-gray-700/20 flex items-center gap-2">
                  <Skeleton className="w-3 h-3 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-16 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === "inspections" ? (
          /* Inspections List */
          <div className="space-y-2">
            {inspections.map((inspection) => (
              <div key={inspection._id} className="border border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleExpand(inspection._id, setExpanded)}
                  className="w-full flex items-center gap-2 p-3 bg-gray-700/50 hover:bg-gray-700 transition-colors text-left"
                >
                  {expanded[inspection._id] ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                  <span className="font-semibold text-sm">{inspection.clientName}</span>
                  <span className="text-xs text-gray-400 ml-auto mr-2">
                    {new Date(inspection.createdAt).toLocaleDateString()}
                  </span>
                  <div
                    onClick={(e) => handleDeleteInspection(inspection._id, e)}
                    className="p-1.5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded transition-colors"
                    title="Delete Inspection"
                  >
                    <FaTrash size={12} />
                  </div>
                </button>

                {expanded[inspection._id] && (
                  <div className="bg-gray-800/50">
                    {inspection.turbine.map((turb, tIdx) => (
                      <div key={tIdx} className="pl-2">
                        <div className="p-2 text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                          <FaFolder size={10} /> {turb.name}
                        </div>
                        {turb.blades.map((blade, bIdx) => {
                          const bladeId = `${inspection._id}-${turb.name}-${blade.name}`;
                          return (
                            <div key={bIdx} className="pl-2 border-l border-gray-700 ml-2">
                              <button
                                onClick={() => toggleBlade(inspection._id, turb.name, blade, inspection.clientName)}
                                className="w-full flex items-center gap-2 p-2 hover:bg-gray-700/50 rounded text-sm text-gray-300"
                              >
                                {expanded[bladeId] ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                                {blade.name}
                              </button>

                              {expanded[bladeId] && (
                                <div className="pl-4 py-1 space-y-1">
                                  {blade.sides.map((side, sIdx) => {
                                    const sideId = `${bladeId}-${side.name}`;
                                    const firstImage = side.images[0];
                                    if (!firstImage) return null;
                                    
                                    return (
                                      <div key={sIdx}>
                                        <button
                                          onClick={() => toggleExpand(sideId, setExpanded)}
                                          className="w-full flex items-center gap-3 p-2 hover:bg-gray-700 rounded transition-colors group"
                                        >
                                          <div className="relative w-8 h-8 rounded overflow-hidden bg-gray-700 flex items-center justify-center flex-shrink-0 border border-gray-600 group-hover:border-blue-400 transition-colors">
                                            <FaFolder size={16} className="text-yellow-500" />
                                          </div>
                                          <div className="flex flex-col items-start">
                                            <span className="text-sm font-medium text-gray-300 group-hover:text-white">{side.name}</span>
                                            <span className="text-[10px] text-gray-500">{side.images.length} images</span>
                                          </div>
                                          <div className="ml-auto text-gray-500">
                                            {expanded[sideId] ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                                          </div>
                                        </button>

                                        {expanded[sideId] && (
                                          <div className="pl-4 py-1 grid grid-cols-3 gap-1">
                                            {side.images.map((img, iIdx) => (
                                              <button
                                                key={iIdx}
                                                onClick={() => {
                                                  const sideThumbnails = side.images.map((i) => ({
                                                    url: i.url,
                                                    publicId: i.publicId,
                                                    side: side.name,
                                                  }));

                                                  onSelectImage({
                                                    url: img.url,
                                                    publicId: img.publicId,
                                                    turbine: turb.name,
                                                    blade: blade.name,
                                                    side: side.name,
                                                    thumbnails: sideThumbnails,
                                                    annotations: [],
                                                    clientName: inspection.clientName,
                                                    isReportView: false,
                                                  });
                                                }}
                                                className="relative aspect-square rounded overflow-hidden border border-gray-700 hover:border-blue-400 transition-colors"
                                              >
                                                <img
                                                  src={getOptimizedImageUrl(img.url, img.publicId, 100, 100)}
                                                  alt={`${side.name} ${iIdx + 1}`}
                                                  className="w-full h-full object-cover"
                                                  loading="lazy"
                                                />
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Reports List */
          <div className="space-y-2">
            {reports.map((report) => (
              <div key={report._id} className="border border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleExpand(report._id, setExpandedReports)}
                  className="w-full flex items-center gap-2 p-3 bg-gray-700/50 hover:bg-gray-700 transition-colors text-left"
                >
                  {expandedReports[report._id] ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                  <span className="font-semibold text-sm">{report.clientName} Report</span>
                  <span className="text-xs text-gray-400 ml-auto mr-2">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        generatePDF(report);
                      }}
                      className="p-1.5 hover:bg-green-500/20 text-gray-400 hover:text-green-400 rounded transition-colors"
                      title="Download PDF"
                    >
                      <FaDownload size={12} />
                    </div>
                    <div
                      onClick={(e) => handleDeleteReport(report._id, e)}
                      className="p-1.5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded transition-colors"
                      title="Delete Report"
                    >
                      <FaTrash size={12} />
                    </div>
                  </div>
                </button>

                {expandedReports[report._id] && (
                  <div className="bg-gray-800/50 p-2">
                    {/* Group damages by Turbine -> Blade -> Side */}
                    {Object.entries(
                      report.damages.reduce((acc, dmg) => {
                        const turb = dmg.turbine;
                        const blade = dmg.blade;
                        const side = dmg.side;
                        if (!acc[turb]) acc[turb] = {};
                        if (!acc[turb][blade]) acc[turb][blade] = {};
                        if (!acc[turb][blade][side]) acc[turb][blade][side] = [];
                        acc[turb][blade][side].push(dmg);
                        return acc;
                      }, {} as Record<string, Record<string, Record<string, any[]>>>)
                    ).map(([turbineName, blades]) => (
                      <div key={turbineName} className="pl-2">
                        <div className="p-2 text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                          <FaFolder size={10} /> {turbineName}
                        </div>
                        {Object.entries(blades).map(([bladeName, sides]) => (
                          <div key={bladeName} className="pl-4 border-l border-gray-700 ml-2">
                            <div className="p-2 text-sm text-gray-300 flex items-center gap-2">
                              <FaChevronRight size={10} /> {bladeName}
                            </div>
                            <div className="pl-4 py-1 space-y-1">
                              {Object.entries(sides).map(([sideName, damages]) => {
                                const sideId = `${report._id}-${turbineName}-${bladeName}-${sideName}`;
                                const firstDamage = damages[0];
                                if (!firstDamage) return null;

                                return (
                                  <div key={sideName}>
                                    <button
                                      onClick={() => toggleExpand(sideId, setExpandedReports)}
                                      className="w-full flex items-center gap-3 p-2 hover:bg-gray-700 rounded transition-colors group"
                                    >
                                      <div className="relative w-8 h-8 rounded overflow-hidden bg-gray-700 flex items-center justify-center flex-shrink-0 border border-gray-600 group-hover:border-blue-400 transition-colors">
                                        <FaFolder size={16} className="text-yellow-500" />
                                      </div>
                                      <div className="flex flex-col items-start">
                                        <span className="text-sm font-medium text-gray-300 group-hover:text-white">{sideName}</span>
                                        <span className="text-[10px] text-gray-500">{damages.length} issues</span>
                                      </div>
                                      <div className="ml-auto text-gray-500">
                                        {expandedReports[sideId] ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                                      </div>
                                    </button>

                                    {expandedReports[sideId] && (
                                      <div className="pl-4 py-1 grid grid-cols-3 gap-1">
                                        {damages.map((damage, idx) => (
                                          <button
                                            key={idx}
                                            onClick={() => {
                                              const sideThumbnails = damages.map(d => ({
                                                url: d.imageUrl,
                                                publicId: d.imagePublicId,
                                                side: d.side,
                                              }));
                                              
                                              onSelectImage({
                                                url: damage.imageUrl,
                                                publicId: damage.imagePublicId,
                                                turbine: damage.turbine,
                                                blade: damage.blade,
                                                side: damage.side,
                                                thumbnails: sideThumbnails,
                                                annotations: damage.annotations,
                                                isReportView: true,
                                                report: report,
                                              });
                                            }}
                                            className="relative aspect-square rounded overflow-hidden border border-gray-700 hover:border-blue-400 transition-colors"
                                          >
                                            <img 
                                              src={getOptimizedImageUrl(damage.imageUrl, damage.imagePublicId, 100, 100)} 
                                              alt={`${sideName} ${idx + 1}`} 
                                              className="w-full h-full object-cover" 
                                              loading="lazy"
                                            />
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {reports.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-4">No reports generated yet.</div>
            )}
          </div>
        )}
      </div>
      {/* Modal */}
      {modalOpen && (
        <Modal
          onClose={closeModal}
          title={modalContent.title}
          actionBar={
            <div className="flex gap-2">
              {modalContent.onConfirm ? (
                <>
                  <button
                    onClick={modalContent.onConfirm}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
                >
                  OK
                </button>
              )}
            </div>
          }
        >
          <p>{modalContent.message}</p>
        </Modal>
      )}
    </div>
  );
};

export default InspectionSidebar;
