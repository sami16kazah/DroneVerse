"use client";
import React, { useState } from "react";

interface ImageEditorProps {
  imageSrc: string;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ imageSrc }) => {
  const [brightness, setBrightness] = useState(100);
  const [blur, setBlur] = useState(0);
  const [grayscale, setGrayscale] = useState(0);
  const [hueRotate, setHueRotate] = useState(0);

  return (
    <div className="flex flex-col items-center">
      <img
        src={imageSrc}
        alt="Editable Image"
        className={`w-64 h-64 object-cover mb-4 ${`brightness-[${brightness}%] blur-[${blur}px] grayscale-[${grayscale}%] hue-rotate-[${hueRotate}deg]`}`}
      />
      <div className="flex justify-center">
        <label>Brightness:</label>
        <input
          type="range"
          min="0"
          max="200"
          value={brightness}
          onChange={(e) => setBrightness(parseInt(e.target.value))}
          className="ml-2"
        />
      </div>
      <div className="flex justify-center mt-2">
        <label>Blur:</label>
        <input
          type="range"
          min="0"
          max="10"
          value={blur}
          onChange={(e) => setBlur(parseInt(e.target.value))}
          className="ml-2"
        />
      </div>
      <div className="flex justify-center mt-2">
        <label>Grayscale:</label>
        <input
          type="range"
          min="0"
          max="100"
          value={grayscale}
          onChange={(e) => setGrayscale(parseInt(e.target.value))}
          className="ml-2"
        />
      </div>
      <div className="flex justify-center mt-2">
        <label>Hue Rotate:</label>
        <input
          type="range"
          min="0"
          max="360"
          value={hueRotate}
          onChange={(e) => setHueRotate(parseInt(e.target.value))}
          className="ml-2"
        />
      </div>
    </div>
  );
};

export default ImageEditor;
