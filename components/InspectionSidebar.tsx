"use client";
import React, { useEffect, useState } from "react";
import { FaChevronDown, FaChevronRight, FaFolder, FaImage, FaFileAlt, FaClipboardList, FaTrash } from "react-icons/fa";

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

interface IReport {
  _id: string;
  clientName: string;
  createdAt: string;
  damages: {
    turbine: string;
    blade: string;
    side: string;
    imageUrl: string;
    imagePublicId: string;
    annotations: any[];
    filters?: any;
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
  }) => void;
}

const InspectionSidebar: React.FC<InspectionSidebarProps> = ({
  onSelectImage,
}) => {
  const [activeTab, setActiveTab] = useState<"inspections" | "reports">("inspections");

  // Inspection State
  const [inspections, setInspections] = useState<IInspection[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Report State
  const [reports, setReports] = useState<IReport[]>([]);
  const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (activeTab === "inspections") {
      fetch("/api/inspection")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setInspections(data.data);
        })
        .catch((err) => console.error(err));
    } else {
      fetch("/api/report")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setReports(data.data);
        })
        .catch((err) => console.error(err));
    }
  }, [activeTab]);

  const toggleExpand = (id: string, setExpandState: React.Dispatch<React.SetStateAction<Record<string, boolean>>>) => {
    setExpandState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDeleteInspection = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("handleDeleteInspection called for ID:", id);
    if (!confirm("Are you sure you want to delete this inspection? This will delete all associated images.")) return;

    try {
      console.log("Sending DELETE request to /api/inspection");
      const res = await fetch(`/api/inspection?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      console.log("Delete response:", data);
      if (data.success) {
        setInspections((prev) => prev.filter((i) => i._id !== id));
        console.log("Inspection removed from state");
      } else {
        alert("Failed to delete inspection: " + data.error);
      }
    } catch (err) {
      console.error("Frontend Delete Error:", err);
      alert("An error occurred while deleting.");
    }
  };

  const handleDeleteReport = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("handleDeleteReport called for ID:", id);
    if (!confirm("Are you sure you want to delete this report? This will delete all associated images.")) return;

    try {
      console.log("Sending DELETE request to /api/report");
      const res = await fetch(`/api/report?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      console.log("Delete response:", data);
      if (data.success) {
        setReports((prev) => prev.filter((r) => r._id !== id));
        console.log("Report removed from state");
      } else {
        alert("Failed to delete report: " + data.error);
      }
    } catch (err) {
      console.error("Frontend Delete Error:", err);
      alert("An error occurred while deleting.");
    }
  };

  // Auto-expand logic for Inspections (existing)
  const toggleBlade = (
    inspectionId: string,
    turbineName: string,
    blade: IInspection["turbine"][0]["blades"][0],
    clientName: string
  ) => {
    const bladeId = `${inspectionId}-${turbineName}-${blade.name}`;
    const isExpanding = !expanded[bladeId];

    toggleExpand(bladeId, setExpanded);

    if (isExpanding) {
      // Find first side with images
      const firstSideWithImages = blade.sides.find(
        (s) => s.images && s.images.length > 0
      );

      if (firstSideWithImages) {
        const firstImage = firstSideWithImages.images[0];
        // Collect all thumbnails from this blade (all sides)
        const allThumbnails = blade.sides.flatMap((s) =>
          s.images.map((img) => ({
            url: img.url,
            publicId: img.publicId,
            side: s.name,
          }))
        );

        onSelectImage({
          url: firstImage.url,
          publicId: firstImage.publicId,
          turbine: turbineName,
          blade: blade.name,
          side: firstSideWithImages.name,
          thumbnails: allThumbnails,
          annotations: [], // Inspections don't have annotations directly on images
          clientName: clientName,
        });
      }
    }
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
        {activeTab === "inspections" ? (
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
                                  {blade.sides.map((side, sIdx) => (
                                    <div key={sIdx}>
                                      {side.images.map((img, iIdx) => (
                                        <button
                                          key={iIdx}
                                          onClick={() => {
                                            const allThumbnails = blade.sides.flatMap((s) =>
                                              s.images.map((i) => ({
                                                url: i.url,
                                                publicId: i.publicId,
                                                side: s.name,
                                              }))
                                            );
                                            onSelectImage({
                                              url: img.url,
                                              publicId: img.publicId,
                                              turbine: turb.name,
                                              blade: blade.name,
                                              side: side.name,
                                              thumbnails: allThumbnails,
                                              annotations: [], // Inspections don't have annotations directly on images
                                              clientName: inspection.clientName,
                                            });
                                          }}
                                          className="w-full flex items-center gap-2 p-1.5 hover:bg-blue-900/30 hover:text-blue-400 rounded text-xs text-gray-400 transition-colors"
                                        >
                                          <FaImage size={10} />
                                          {side.name}
                                        </button>
                                      ))}
                                    </div>
                                  ))}
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
                  <div
                    onClick={(e) => handleDeleteReport(report._id, e)}
                    className="p-1.5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded transition-colors"
                    title="Delete Report"
                  >
                    <FaTrash size={12} />
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
                              {Object.entries(sides).map(([sideName, damages]) => (
                                <div key={sideName} className="pl-4 border-l border-gray-600 ml-2">
                                  <div className="p-2 text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                    <FaImage size={10} /> {sideName}
                                  </div>
                                  {damages.map((damage, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => onSelectImage({
                                        url: damage.imageUrl,
                                        publicId: damage.imagePublicId,
                                        turbine: damage.turbine,
                                        blade: damage.blade,
                                        side: damage.side,
                                        thumbnails: [],
                                        annotations: damage.annotations,
                                      })}
                                      className="w-full flex items-start gap-3 p-2 hover:bg-gray-700 rounded transition-colors"
                                    >
                                      <div className="w-12 h-12 rounded overflow-hidden bg-black flex-shrink-0 border border-gray-600">
                                        <img src={damage.imageUrl} alt="Damage" className="w-full h-full object-cover" />
                                      </div>
                                      <div className="text-left">
                                        <div className="text-xs font-bold text-gray-300">{damage.turbine} - {damage.blade}</div>
                                        <div className="text-xs text-gray-500">Side: {damage.side}</div>
                                        <div className="text-[10px] text-blue-400 mt-1">{damage.annotations?.length || 0} Annotations</div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              ))}
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
    </div>
  );
};

export default InspectionSidebar;
