// frontend/src/components/UrdfUploader.jsx
import React, { useCallback, useRef } from 'react';

// Adjusted props: urdfFile, meshFiles, meshFileNamesList are now passed for controlled inputs/display.
// onLoadModel and onClearAll are handlers from parent.
const UrdfUploader = ({
    onUrdfFileLoaded,
    onMeshFilesLoaded,
    urdfFile, // Now passed from parent state
    meshFiles, // Now passed from parent state
    meshFileNamesList, // Now passed from parent state
    onLoadModel, // Handler for Load Model button
    onClearAll, // Handler for Clear All button
    isLoading // Loading state from parent
}) => {
    // Refs for file inputs to allow programmatic clearing
    const urdfInputRef = useRef(null);
    const meshInputRef = useRef(null);

    const handleUrdfFileChange = useCallback(async (event) => {
        const file = event.target.files[0];
        if (file) {
            // Basic validation for file type
            if (!file.name.toLowerCase().endsWith('.urdf') && !file.name.toLowerCase().endsWith('.xml')) {
                alert('Please upload a .urdf or .xml file for the URDF content.'); // Using alert() as per current project logic
                event.target.value = null; // Clear the input
                onUrdfFileLoaded(null, ''); // Signal no URDF loaded
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                onUrdfFileLoaded(file, e.target.result); // Pass both file object and content
            };
            reader.readAsText(file);
        } else {
            onUrdfFileLoaded(null, ''); // Signal no URDF loaded
        }
    }, [onUrdfFileLoaded]);

    const handleMeshFilesChange = useCallback(async (event) => {
        const files = Array.from(event.target.files);
        if (files.length > 0) {
            const loadedFilesMap = new Map();
            const names = [];
            let loadedCount = 0; // Track loaded files

            const totalFiles = files.length;

            for (const file of files) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const fileExtension = file.name.toLowerCase().split('.').pop();
                    let fileContent = e.target.result;

                    // Determine how to store content based on file type for parsing in UrdfRobotModel
                    if (fileExtension === 'stl') {
                        // STLLoader expects ArrayBuffer, which FileReader.readAsArrayBuffer provides
                        // fileContent is already ArrayBuffer from readAsArrayBuffer
                    } else if (fileExtension === 'dae' || fileExtension === 'obj') {
                        // ColladaLoader and OBJLoader expect text content (string)
                        // Need to decode ArrayBuffer to string for these formats
                        fileContent = new TextDecoder().decode(e.target.result);
                    } else {
                        // FIX: Correct template literal usage
                        console.warn(`Unsupported mesh type for internal processing: ${file.name}. Reading as ArrayBuffer.`);
                    }

                    loadedFilesMap.set(file.name.toLowerCase(), fileContent); // Store lowercase filename as key
                    names.push(file.name);
                    loadedCount++;

                    if (loadedCount === totalFiles) {
                        onMeshFilesLoaded(loadedFilesMap, names); // Signal all meshes loaded
                    }
                };
                reader.onerror = () => {
                    // FIX: Correct template literal usage
                    console.error(`Error reading mesh file: ${file.name}`);
                    loadedCount++; // Still increment count to ensure checkDone eventually fires
                    if (loadedCount === totalFiles) {
                        onMeshFilesLoaded(loadedFilesMap, names); // Signal all meshes attempted
                    }
                };

                // Read all mesh files as ArrayBuffer for binary safety.
                // Later, UrdfRobotModel will decide how to parse based on extension.
                reader.readAsArrayBuffer(file);
            }
        } else {
            onMeshFilesLoaded(new Map(), []); // Clear meshes if no files selected
        }
    }, [onMeshFilesLoaded]);

    const handleClearClick = () => {
        // Reset file inputs visually
        if (urdfInputRef.current) urdfInputRef.current.value = null;
        if (meshInputRef.current) meshInputRef.current.value = null;
        onClearAll(); // Trigger parent's clear logic
    };

    return (
        <div className="p-4 border border-gray-600 rounded-md bg-gray-700 text-gray-100">
            {/* URDF Upload */}
            <div className="mb-3">
                <label className="block text-sm font-medium mb-1">
                    URDF File (.urdf, .xml):
                </label>
                <input
                    type="file"
                    accept=".urdf,.xml"
                    onChange={handleUrdfFileChange}
                    className="block w-full text-sm file:mr-4 file:py-2 file:px-4
                                 file:rounded-md file:border-0 file:text-sm file:font-semibold
                                 file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                    ref={urdfInputRef}
                    disabled={isLoading}
                />
                {urdfFile && <p className="text-xs text-gray-300 mt-1">Selected: {urdfFile.name}</p>}
            </div>

            {/* Mesh Upload */}
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                    Mesh Files (.stl, .dae, .obj):
                </label>
                <input
                    type="file"
                    multiple
                    accept=".stl,.dae,.obj"
                    onChange={handleMeshFilesChange}
                    className="block w-full text-sm file:mr-4 file:py-2 file:px-4
                                 file:rounded-md file:border-0 file:text-sm file:font-semibold
                                 file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                    ref={meshInputRef}
                    disabled={isLoading}
                />
                <p className="text-xs text-gray-300 mt-1">
                    {/* FIX: Correct template literal usage here */}
                    {meshFileNamesList.length > 0 ? `(${meshFileNamesList.length} files selected) ${meshFileNamesList.join(', ')}` : 'Hold Ctrl/Cmd to select multiple files.'}
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 mt-4">
                <button
                    onClick={onLoadModel} // Call parent's onLoadModel handler
                    disabled={isLoading || !urdfFile || meshFiles.size === 0}
                    className={`flex-1 py-2 px-4 rounded-md font-semibold transition duration-200 ease-in-out
                                 ${isLoading || !urdfFile || meshFiles.size === 0
                                     ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                     : 'bg-green-600 hover:bg-green-700 text-white shadow-md'}`}
                >
                    {isLoading ? 'Loading...' : 'Load Model'}
                </button>
                <button
                    onClick={handleClearClick}
                    disabled={isLoading}
                    className={`py-2 px-4 rounded-md font-semibold transition duration-200 ease-in-out
                                 ${isLoading
                                     ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                     : 'bg-red-600 hover:bg-red-700 text-white shadow-md'}`}
                >
                    Clear All
                </button>
            </div>
        </div>
    );
};

export default UrdfUploader;