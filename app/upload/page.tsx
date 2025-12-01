"use client";
import React, { useState, useRef } from 'react';
import Navbar from '../../components/Navbar';

const UploadPage = () => {
  const [uploading, setUploading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    clientName: '',
    employeeName: 'Test Employee', // Default as requested
    city: '',
    address: '',
    postcode: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, msg]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      addLog('Fetching location...');
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        addLog(`Got coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=en`, {
                headers: {
                    'User-Agent': 'DroneVerseApp/1.0'
                }
            });
            
            if (!response.ok) throw new Error('Geocoding failed');
            
            const data = await response.json();
            const addr = data.address;
            
            setFormData(prev => ({
                ...prev,
                city: addr.city || addr.town || addr.village || '',
                postcode: addr.postcode || '',
                address: data.display_name || ''
            }));
            
            addLog('✅ Address found and filled!');
        } catch (error) {
            addLog('❌ Failed to get address details.');
            console.error(error);
        }
      }, (error) => {
        addLog(`Error getting location: ${error.message}`);
      });
    } else {
      addLog('Geolocation is not supported by this browser.');
    }
  };

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!formData.clientName || !formData.city) {
        alert("Please fill in Client Name and City.");
        return;
    }

    // Strict Validation: 3 Blades, 4 Sides each
    const validSides = ['LE', 'PS', 'SS', 'TE'];
    const requiredBlades = ['Blade 1', 'Blade 2', 'Blade 3'];
    const errors: string[] = [];

    // Structure for Validation & Upload: Turbine -> Blade -> Side -> Files
    const structure: Record<string, Record<string, Record<string, File[]>>> = {};

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const pathParts = file.webkitRelativePath.split('/');
      
      const bladeIndex = pathParts.findIndex(part => part.toLowerCase().startsWith('blade'));
      if (bladeIndex === -1) continue;

      const turbineName = pathParts.slice(0, bladeIndex).join('/');
      const bladeName = pathParts[bladeIndex];
      
      if (bladeIndex + 1 >= pathParts.length - 1) continue;
      const sideName = pathParts[bladeIndex + 1].toUpperCase();

      if (!structure[turbineName]) structure[turbineName] = {};
      if (!structure[turbineName][bladeName]) structure[turbineName][bladeName] = {};
      if (!structure[turbineName][bladeName][sideName]) structure[turbineName][bladeName][sideName] = [];
      
      structure[turbineName][bladeName][sideName].push(file);
    }

    // Validate Completeness
    if (Object.keys(structure).length === 0) {
      errors.push("No valid turbine structure found.");
    }

    for (const [turbine, blades] of Object.entries(structure)) {
      for (const reqBlade of requiredBlades) {
        const foundBlade = Object.keys(blades).find(b => b.toLowerCase() === reqBlade.toLowerCase());
        if (!foundBlade) {
          errors.push(`${turbine}: Missing '${reqBlade}' folder.`);
          continue;
        }
        const sides = blades[foundBlade];
        for (const side of validSides) {
          if (!sides[side]) {
            errors.push(`${turbine} / ${foundBlade}: Missing '${side}' folder.`);
          }
        }
      }
    }

    if (errors.length > 0) {
      setLogs(['❌ Validation Failed:', ...errors]);
      return;
    }

    setUploading(true);
    setLogs([]);
    addLog(`Found ${files.length} files in valid structure. Starting upload...`);

    // Prepare data for MongoDB
    const turbineData: any[] = [];

    for (const [turbineName, blades] of Object.entries(structure)) {
        const bladesData: any[] = [];
        for (const [bladeName, sides] of Object.entries(blades)) {
            const sidesData: any[] = [];
            for (const [sideName, sideFiles] of Object.entries(sides)) {
                const imagesData: any[] = [];
                
                // Upload files for this side
                for (const file of sideFiles) {
                    const relativePath = file.webkitRelativePath;
                    const folderPath = relativePath.substring(0, relativePath.lastIndexOf('/'));
                    
                    addLog(`Uploading ${file.name}...`);
                    const formDataUpload = new FormData();
                    formDataUpload.append('file', file);
                    formDataUpload.append('folderPath', folderPath);

                    try {
                        const res = await fetch('/api/upload', { method: 'POST', body: formDataUpload });
                        const data = await res.json();
                        if (res.ok) {
                            imagesData.push({ url: data.secure_url, publicId: data.public_id });
                            addLog(`✅ Uploaded ${file.name}`);
                        } else {
                            addLog(`❌ Failed to upload ${file.name}`);
                        }
                    } catch (err) {
                        addLog(`❌ Error uploading ${file.name}`);
                    }
                }
                sidesData.push({ name: sideName, images: imagesData });
            }
            bladesData.push({ name: bladeName, sides: sidesData });
        }
        turbineData.push({ name: turbineName, blades: bladesData });
    }

    // Save to MongoDB
    addLog('Saving inspection data to database...');
    try {
        const inspectionPayload = {
            clientName: formData.clientName,
            employeeName: formData.employeeName,
            location: {
                city: formData.city,
                address: formData.address,
                postcode: formData.postcode,
            },
            turbine: turbineData
        };

        const dbRes = await fetch('/api/inspection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(inspectionPayload)
        });

        if (dbRes.ok) {
            addLog('✅ Inspection data saved successfully!');
        } else {
            const err = await dbRes.json();
            addLog(`❌ Failed to save data: ${err.error}`);
        }
    } catch (err) {
        addLog('❌ Error saving to database.');
    }

    setUploading(false);
  };

  const isFormValid =
    formData.clientName.trim() !== "" &&
    formData.city.trim() !== "" &&
    formData.address.trim() !== "" &&
    formData.postcode.trim() !== "";

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
        <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-center md:text-left">New Inspection</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Form Section */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-4 h-fit">
                    <h2 className="text-xl font-semibold mb-4">Inspection Details</h2>
                    
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Client Name <span className="text-red-500">*</span></label>
                        <input name="clientName" value={formData.clientName} onChange={handleInputChange} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" placeholder="e.g. WindCorp" />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Employee Name</label>
                        <input name="employeeName" value={formData.employeeName} onChange={handleInputChange} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" disabled />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">City <span className="text-red-500">*</span></label>
                            <input name="city" value={formData.city} onChange={handleInputChange} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Postcode <span className="text-red-500">*</span></label>
                            <input name="postcode" value={formData.postcode} onChange={handleInputChange} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Address <span className="text-red-500">*</span></label>
                        <input name="address" value={formData.address} onChange={handleInputChange} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" />
                    </div>

                    <button onClick={getLocation} className="text-blue-400 text-sm hover:underline">
                        📍 Get Current Location
                    </button>
                </div>

                {/* Upload Section */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-fit">
                    <h2 className="text-xl font-semibold mb-4">Upload Data</h2>
                    <p className="mb-4 text-gray-300 text-sm">
                        Select a folder containing the turbine structure (Turbine -&gt; Blades -&gt; Sides).
                    </p>
                    
                    <div className="mb-6">
                        <label 
                            htmlFor="folder-upload" 
                            className={`
                                flex items-center justify-center w-full p-8 border-2 border-dashed rounded-lg transition-all
                                ${
                                  !isFormValid || uploading
                                    ? "border-gray-600 bg-gray-700/30 opacity-50 cursor-not-allowed"
                                    : "border-gray-600 cursor-pointer hover:border-blue-500 hover:bg-gray-700/50"
                                }
                            `}
                        >
                            <div className="text-center">
                                <span className="text-lg font-medium block mb-1">
                                    {uploading
                                      ? "Uploading..."
                                      : !isFormValid
                                      ? "Fill all fields to upload"
                                      : "Select Folder"}
                                </span>
                                <span className="text-xs text-gray-500">Supports recursive upload</span>
                            </div>
                        </label>
                        <input
                            id="folder-upload"
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            // @ts-ignore
                            webkitdirectory=""
                            directory=""
                            onChange={handleFolderSelect}
                            disabled={!isFormValid || uploading}
                        />
                    </div>

                    {logs.length > 0 && (
                        <div className="bg-black/50 p-4 rounded-lg h-64 overflow-y-auto font-mono text-xs border border-gray-700">
                            {logs.map((log, i) => (
                                <div key={i} className="mb-1">{log}</div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default UploadPage;
