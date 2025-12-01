"use client";
import React, { useState, useEffect, useRef } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import {
  FaSearchPlus,
  FaSearchMinus,
  FaRedo,
  FaSquare,
  FaDrawPolygon,
  FaCheck,
  FaTimes,
} from "react-icons/fa";

export interface Annotation {
  type: "square" | "polygon";
  points: number[][]; // [[x, y], ...] in percentages
  color: string;
  crackLevel?: number;
}

interface ZoomableImageProps {
  lowResSrc: string;
  highResSrc: string;
  publicId?: string;
  alt: string;
  filters: string;
  annotations?: Annotation[];
  onSaveAnnotation?: (annotation: Annotation) => void;
  readOnly?: boolean;
}

const ZoomableImage: React.FC<ZoomableImageProps> = ({
  lowResSrc,
  highResSrc,
  publicId,
  alt,
  filters,
  annotations = [],
  onSaveAnnotation,
  readOnly = false,
}) => {
  const [currentSrc, setCurrentSrc] = useState(lowResSrc);
  const [isHighResLoaded, setIsHighResLoaded] = useState(false);
  const [imageStyle, setImageStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Drawing State
  const [drawingMode, setDrawingMode] = useState<"square" | "polygon" | null>(
    null
  );
  const [currentPoints, setCurrentPoints] = useState<number[][]>([]);
  const [tempSquareStart, setTempSquareStart] = useState<number[] | null>(null);

  // Crack Level State
  const [showCrackLevelInput, setShowCrackLevelInput] = useState(false);
  const [crackLevel, setCrackLevel] = useState<number>(1);

  // Helper to generate Cloudinary URL
  const getCloudinaryUrl = (pid: string, transformations: string) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) return "";
    return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${pid}`;
  };

  // Determine effective URLs
  const effectiveLowRes = publicId
    ? getCloudinaryUrl(publicId, "f_auto,q_auto:low,w_800")
    : lowResSrc;
  const effectiveHighRes = publicId
    ? getCloudinaryUrl(publicId, "f_auto,q_auto:best")
    : highResSrc;

  useEffect(() => {
    setCurrentSrc(effectiveLowRes);
    setIsHighResLoaded(false);
    // Reset drawing state when image changes
    setDrawingMode(null);
    setCurrentPoints([]);
    setTempSquareStart(null);
  }, [effectiveLowRes]);

  const handleZoomStart = () => {
    if (!isHighResLoaded) {
      const img = new Image();
      img.src = effectiveHighRes;
      img.onload = () => {
        setCurrentSrc(effectiveHighRes);
        setIsHighResLoaded(true);
      };
    }
  };

  const calculateImageStyle = () => {
    const container = containerRef.current;
    const img = imageRef.current;
    if (!container || !img) return;

    const containerAspect = container.clientWidth / container.clientHeight;
    const imageAspect = img.naturalWidth / img.naturalHeight;

    if (imageAspect > containerAspect) {
      setImageStyle({ height: "100%", width: "auto", maxWidth: "none" });
    } else {
      setImageStyle({ width: "100%", height: "auto", maxWidth: "none" });
    }
  };

  useEffect(() => {
    window.addEventListener("resize", calculateImageStyle);
    return () => window.removeEventListener("resize", calculateImageStyle);
  }, []);

  // Drawing Logic
  const getRelativeCoords = (e: React.MouseEvent) => {
    if (!imageRef.current) return null;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return [x, y];
  };

  const handleSvgClick = (e: React.MouseEvent) => {
    if (!drawingMode) return;
    const coords = getRelativeCoords(e);
    if (!coords) return;

    if (drawingMode === "polygon") {
      setCurrentPoints((prev) => [...prev, coords]);
    } else if (drawingMode === "square") {
      if (!tempSquareStart) {
        setTempSquareStart(coords);
      } else {
        // Finish square
        const [startX, startY] = tempSquareStart;
        const [endX, endY] = coords;
        // Store as 4 points for consistency or just 2 diagonal
        // Let's store 2 diagonal points for square: [start, end]
        setCurrentPoints([tempSquareStart, coords]);
        setTempSquareStart(null);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (drawingMode === "square" && tempSquareStart) {
      const coords = getRelativeCoords(e);
      if (coords) {
        // Update temporary end point for visualization
      setCurrentPoints([tempSquareStart, coords]);
      }
    }
  };

  const confirmShape = () => {
    if (currentPoints.length < 2) return;
    setShowCrackLevelInput(true);
  };

  const finalizeShape = () => {
    if (onSaveAnnotation && drawingMode) {
      onSaveAnnotation({
        type: drawingMode,
        points: currentPoints,
        color: "rgba(255, 0, 0, 0.0)",
        crackLevel: crackLevel,
      });
    }
    setDrawingMode(null);
    setCurrentPoints([]);
    setTempSquareStart(null);
    setShowCrackLevelInput(false);
    setCrackLevel(1);
  };

  const discardShape = () => {
    setDrawingMode(null);
    setCurrentPoints([]);
    setTempSquareStart(null);
  };

  // Render Helpers
  const renderShape = (
    points: number[][],
    type: "square" | "polygon",
    color: string,
    crackLevel?: number,
    key?: string | number
  ) => {
    let shape = null;
    let crackIndicator = null;

    if (type === "square") {
      if (points.length < 2) return null;
      const [p1, p2] = points;
      const x = Math.min(p1[0], p2[0]);
      const y = Math.min(p1[1], p2[1]);
      const width = Math.abs(p1[0] - p2[0]);
      const height = Math.abs(p1[1] - p2[1]);
      shape = (
        <rect
          x={`${x}%`}
          y={`${y}%`}
          width={`${width}%`}
          height={`${height}%`}
          fill={color}
          stroke="orange"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      );
    } else {
      // Polygon
      const pointsStr = points.map((p) => `${p[0]},${p[1]}`).join(" ");
      shape = (
        <polygon
          points={pointsStr}
          fill={color}
          stroke="orange"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      );
    }

    if (crackLevel) {
      const minX = Math.min(...points.map((p) => p[0]));
      const minY = Math.min(...points.map((p) => p[1]));
      const size = 3; // Fixed size for better visibility
      // Position outside top-left
      const indicatorX = minX - size - 0.5;
      const indicatorY = minY;

      crackIndicator = (
        <g>
          <rect
            x={`${indicatorX}%`}
            y={`${indicatorY}%`}
            width={`${size}%`}
            height={`${size}%`}
            fill="red"
            rx="0.5"
            stroke="white"
            strokeWidth="0.2"
          />
          <text
            x={`${indicatorX + size / 2}%`}
            y={`${indicatorY + size / 2}%`}
            fill="white"
            fontSize={`${size * 0.6}px`} // Using px for font size in SVG often works better or needs % relative to viewBox
            // In 0-100 viewBox, 1.8px is 1.8% of view.
            style={{ fontSize: "0.2rem", userSelect: "none" }} // Fallback or alternative sizing
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {crackLevel}
          </text>
        </g>
      );
    }

    return (
      <g key={key}>
        {shape}
        {crackIndicator}
      </g>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden group bg-black"
    >
      <TransformWrapper
        onZoomStart={handleZoomStart}
        onPanningStart={handleZoomStart}
        wheel={{ step: 0.1 }}
        centerOnInit={true}
        disabled={!!drawingMode} // Disable zoom/pan while drawing
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Controls */}
            <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
              <div className="flex gap-2 bg-gray-800/80 p-2 rounded-full backdrop-blur-sm">
                    <button
                  onClick={() => zoomIn()}
                  className="text-white p-2 hover:text-blue-400 transition-colors"
                  title="Zoom In"
                >
                  <FaSearchPlus size={18} />
                    </button>
                <button
                  onClick={() => zoomOut()}
                  className="text-white p-2 hover:text-blue-400 transition-colors"
                  title="Zoom Out"
                >
                  <FaSearchMinus size={18} />
                </button>
                <button
                  onClick={() => resetTransform()}
                  className="text-white p-2 hover:text-blue-400 transition-colors"
                  title="Reset"
                >
                  <FaRedo size={18} />
                </button>
              </div>

              {/* Drawing Tools */}
              {!readOnly && (
              <div className="flex gap-2 bg-gray-800/80 p-2 rounded-full backdrop-blur-sm mt-2 justify-center">
                {!drawingMode ? (
                  <>
                    <button
                      onClick={() => setDrawingMode("square")}
                      className="text-white p-2 hover:text-green-400 transition-colors"
                      title="Draw Square"
                    >
                      <FaSquare size={18} />
                    </button>
                    <button
                      onClick={() => setDrawingMode("polygon")}
                      className="text-white p-2 hover:text-green-400 transition-colors"
                      title="Draw Polygon"
                    >
                      <FaDrawPolygon size={18} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={confirmShape}
                      className="text-green-400 p-2 hover:text-green-300 transition-colors"
                      title="Confirm Shape"
                    >
                      <FaCheck size={18} />
                    </button>
                    <button
                      onClick={discardShape}
                      className="text-red-400 p-2 hover:text-red-300 transition-colors"
                      title="Discard Shape"
                    >
                      <FaTimes size={18} />
                    </button>
                  </>
                )}
              </div>
              )}
            </div>

            <TransformComponent
              wrapperStyle={{
                width: "100%",
                height: "100%",
              }}
            >
              <div className="relative" style={imageStyle}>
                <img
                  ref={imageRef}
                  src={currentSrc}
                  alt={alt}
                  onLoad={calculateImageStyle}
                  className="w-full h-full object-contain shadow-2xl"
                  style={{ filter: filters }}
                />
                {/* SVG Overlay */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-auto"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  onClick={!readOnly ? handleSvgClick : undefined}
                  onMouseMove={!readOnly ? handleMouseMove : undefined}
                  style={{ cursor: drawingMode ? "crosshair" : "default", pointerEvents: readOnly ? "none" : "auto" }}
                >
                  {/* Existing Annotations */}
                  {annotations.map((ann, i) =>
                    renderShape(ann.points, ann.type, ann.color, ann.crackLevel, i)
                  )}

                  {/* Current Drawing */}
                  {drawingMode &&
                    currentPoints.length > 0 &&
                    renderShape(
                      currentPoints,
                      drawingMode,
                      "rgba(128, 128, 128, 0.5)",
                      crackLevel,
                      "current"
                    )}
                </svg>
        </div>
            </TransformComponent>
          </>
      )}
      </TransformWrapper>

      {/* Crack Level Input Modal */}
      {showCrackLevelInput && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700 w-64">
            <h3 className="text-lg font-semibold text-white mb-4">Crack Level</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Severity (1-5)</label>
                <div className="flex justify-between gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => setCrackLevel(level)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                        crackLevel === level
                          ? "bg-red-500 text-white scale-110"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={finalizeShape}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowCrackLevelInput(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 py-2 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZoomableImage;
