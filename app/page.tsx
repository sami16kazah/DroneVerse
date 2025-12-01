"use client";
import React, { useState } from "react";
import ImageEditingNav from "../components/ImageEditingNav";
import ZoomableImage, { Annotation } from "../components/ZoomableImage";
import InspectionSidebar from "../components/InspectionSidebar";
import { captureImageWithAnnotations } from "../utils/imageCapture";
import Modal from "../components/Modal";
import { FaBars, FaTimes, FaFilePdf } from "react-icons/fa";

const Page = () => {
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    publicId: string;
    turbine?: string;
    blade?: string;
    side?: string;
    thumbnails?: { url: string; publicId: string; side: string }[];
    clientName?: string;
    isReportView?: boolean;
  }>({
    url: "/turbine-high.png",
    publicId: "",
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; message: string }>({
    title: "",
    message: "",
  });

  const showModal = (title: string, message: string) => {
    setModalContent({ title, message });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const defaultFilters = {
    brightness: 100,
    contrast: 100,
    saturate: 100,
    blur: 0,
    grayscale: 0,
    hueRotate: 0,
  };

  const [filters, setFilters] = useState<Record<string, typeof defaultFilters>>(
    {}
  );

  const currentFilters =
    selectedImage.publicId && filters[selectedImage.publicId]
      ? filters[selectedImage.publicId]
      : defaultFilters;

  const handleFilterChange = (
    key: keyof typeof defaultFilters,
    value: number
  ) => {
    if (!selectedImage.publicId) return;
    setFilters((prev) => ({
      ...prev,
      [selectedImage.publicId]: {
        ...(prev[selectedImage.publicId] || defaultFilters),
        [key]: value,
      },
    }));
  };

  const filterString = `brightness(${currentFilters.brightness}%) contrast(${currentFilters.contrast}%) saturate(${currentFilters.saturate}%) blur(${currentFilters.blur}px) grayscale(${currentFilters.grayscale}%) hue-rotate(${currentFilters.hueRotate}deg)`;

  const handleImageSelect = (data: {
    url: string;
    publicId: string;
    turbine: string;
    blade: string;
    side: string;
    thumbnails: { url: string; publicId: string; side: string }[];
    clientName?: string;
    isReportView?: boolean;
  }) => {
    setSelectedImage(data);
    setIsSidebarOpen(false); // Close sidebar on mobile when image selected
  };

  // Refactored State for Damages
  const [damages, setDamages] = useState<
    Record<
      string,
      {
        turbine: string;
        blade: string;
        side: string;
        imageUrl: string;
        imagePublicId: string;
        annotations: Annotation[];
      }
    >
  >({});

  const handleSaveAnnotationWithMeta = (annotation: Annotation) => {
    if (!selectedImage.publicId) return;
    
    setDamages((prev) => {
      const existing = prev[selectedImage.publicId];
      const newAnnotations = existing
        ? [...existing.annotations, annotation]
        : [annotation];

      return {
        ...prev,
        [selectedImage.publicId]: {
          turbine: selectedImage.turbine || "Unknown",
          blade: selectedImage.blade || "Unknown",
          side: selectedImage.side || "Unknown",
          imageUrl: selectedImage.url,
          imagePublicId: selectedImage.publicId,
          annotations: newAnnotations,
        },
      };
    });
  };

  const generateReport = async () => {
    const damageList = Object.values(damages);
    if (damageList.length === 0) {
      showModal("No Damages", "No damages annotated. Please annotate images before generating a report.");
      return;
    }

    setIsGeneratingReport(true);
    try {
      // Process each damage: Capture image -> Upload -> Update URL
      const processedDamages = await Promise.all(
        damageList.map(async (damage) => {
          const filtersForImage = filters[damage.imagePublicId] || defaultFilters;
          const filterString = `brightness(${filtersForImage.brightness}%) contrast(${filtersForImage.contrast}%) saturate(${filtersForImage.saturate}%) blur(${filtersForImage.blur}px) grayscale(${filtersForImage.grayscale}%) hue-rotate(${filtersForImage.hueRotate}deg)`;

          try {
            const blob = await captureImageWithAnnotations(
              damage.imageUrl,
              damage.annotations,
              filterString
            );

            if (!blob) throw new Error("Failed to capture image");

            // Upload to Cloudinary
            const formData = new FormData();
            formData.append("file", blob);
            const folderPath = `Reports/${damage.turbine}/${damage.blade}`;
            formData.append("folderPath", folderPath);

            const uploadRes = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            });

            const uploadData = await uploadRes.json();

            if (!uploadData.secure_url) {
              throw new Error("Upload failed");
            }

            return {
              ...damage,
              imageUrl: uploadData.secure_url,
              imagePublicId: uploadData.public_id,
              // We keep annotations in metadata but the image itself now has them burned in
              // The report viewer might want to know this.
              // For now, we just update the URL.
            };
          } catch (err) {
            console.error("Error processing image for report:", err);
            return damage; // Fallback to original if processing fails
          }
        })
      );

      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: selectedImage.clientName || "Client Report",
          damages: processedDamages,
        }),
      });
      
      if (res.ok) {
        showModal("Success", "Report generated successfully!");
        setDamages({}); // Clear after save
      } else {
        showModal("Error", "Failed to generate report.");
      }
    } catch (e) {
      console.error(e);
      showModal("Error", "An error occurred while generating the report.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] bg-gray-900 text-white overflow-hidden relative">
      {/* Mobile Sidebar Toggle */}
      <button
        className="lg:hidden absolute top-4 left-4 z-50 bg-gray-800 p-2 rounded-md text-white shadow-lg"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Left Sidebar - Inspection Navigation */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0 mt-16 lg:mt-0" : "-translate-x-full"
        }`}
      >
        <InspectionSidebar onSelectImage={handleImageSelect} />
      </div>

      {/* Main Content - Image Viewer */}
      <div className="flex-1 flex flex-col relative bg-black order-1 lg:order-1 h-1/2 lg:h-full">


        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <ZoomableImage
            lowResSrc={selectedImage.url}
            highResSrc={selectedImage.url}
            publicId={selectedImage.publicId}
            alt="Turbine Inspection"
            filters={filterString}
            annotations={damages[selectedImage.publicId]?.annotations || []}
            onSaveAnnotation={handleSaveAnnotationWithMeta}
            readOnly={selectedImage.isReportView}
          />
        </div>

        {/* Info Overlay */}
        <div className="absolute top-4 left-16 lg:left-4 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full z-10 pointer-events-none">
          <span className="text-sm font-medium">
            {selectedImage.turbine
              ? `${selectedImage.turbine} - ${selectedImage.blade} - ${selectedImage.side}`
              : "Inspection View"}
          </span>
        </div>

        {/* Thumbnails Filmstrip */}
        {selectedImage.thumbnails && selectedImage.thumbnails.length > 0 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 p-2 overflow-x-auto z-20 bg-gradient-to-t from-black/80 to-transparent">
            {selectedImage.thumbnails.map((thumb, idx) => (
              <button
                key={idx}
                onClick={() =>
                  setSelectedImage((prev) => ({
                    ...prev,
                    url: thumb.url,
                    publicId: thumb.publicId,
                    side: thumb.side,
                  }))
                }
                className={`flex-shrink-0 relative w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                  selectedImage.publicId === thumb.publicId
                    ? "border-blue-500 scale-110"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <img
                  src={thumb.url} // Could use Cloudinary transform for thumbnail size here
                  alt={thumb.side}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] text-center truncate px-1">
                  {thumb.side}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Sidebar - Controls */}
      <div className="w-full lg:w-80 flex-shrink-0 bg-gray-800 border-t lg:border-t-0 lg:border-l border-gray-700 order-2 lg:order-2 h-1/2 lg:h-full overflow-y-auto">
        <ImageEditingNav
          brightness={currentFilters.brightness}
          contrast={currentFilters.contrast}
          saturate={currentFilters.saturate}
          blur={currentFilters.blur}
          grayscale={currentFilters.grayscale}
          hueRotate={currentFilters.hueRotate}
          onChange={handleFilterChange}
          onGenerateReport={generateReport}
          isGeneratingReport={isGeneratingReport}
          damageCount={Object.keys(damages).length}
          isReportView={selectedImage.isReportView}
        />
      </div>

      {/* Global Modal */}
      {modalOpen && (
        <Modal
          onClose={closeModal}
          title={modalContent.title}
          actionBar={
            <button
              onClick={closeModal}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
            >
              OK
            </button>
          }
        >
          <p>{modalContent.message}</p>
        </Modal>
      )}
    </div>
  );
};

export default Page;
