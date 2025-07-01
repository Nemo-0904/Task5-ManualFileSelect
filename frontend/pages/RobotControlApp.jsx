// frontend/src/RobotControlApp.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';

import UrdfRobotModel from '../components/UrdfRobotModel';
import URDFUploader from '../components/URDFUploader';
import RobotJointControls from '../components/RobotJointControls';
import CameraView from '../components/CameraView'; // Assuming CameraView is mostly a container for styling
import MediaPipeController from '../components/MediaPipeController'; // Import MediaPipeController

function RobotControlApp() {
    const [urdfFile, setUrdfFile] = useState(null);
    const [urdfContent, setUrdfContent] = useState('');
    const [meshFiles, setMeshFiles] = useState(new Map());
    const [meshFileNamesList, setMeshFileNamesList] = useState([]);
    const [shouldLoadModel, setShouldLoadModel] = useState(false);
    const [modelLoadStatus, setModelLoadStatus] = useState("Waiting for URDF to be ready for parsing.");
    const [robotModel, setRobotModel] = useState(null); // This holds the THREE.Group instance of the robot

    // Ref to hold the robotModel instance for direct manipulation in callbacks
    // without it being a direct dependency of useCallback (which can trigger re-creation of callbacks)
    const robotModelRef = useRef(null);

    // --- Handlers from URDFUploader ---
    const handleUrdfFileLoaded = useCallback((file, content) => {
        setUrdfFile(file);
        setUrdfContent(content);
        setShouldLoadModel(false);
        setRobotModel(null); // Clear previous robot model
        robotModelRef.current = null; // Also clear the ref
        setModelLoadStatus(`URDF file selected: ${file.name}. Upload mesh files and click 'Load Model'.`);
    }, []);

    const handleMeshFilesLoaded = useCallback((fileMap, namesList) => {
        setMeshFiles(fileMap);
        setMeshFileNamesList(namesList);
        setShouldLoadModel(false);
        setRobotModel(null); // Clear previous robot model
        robotModelRef.current = null; // Also clear the ref
        setModelLoadStatus(`Selected ${namesList.length} mesh files. Click 'Load Model' to continue.`);
    }, []);

    const handleLoadModel = useCallback(() => {
        if (urdfFile && urdfContent && meshFiles.size > 0) {
            setModelLoadStatus("Uploader Status: Loading model...");
            setShouldLoadModel(true);
        } else {
            setModelLoadStatus("Please upload both URDF and mesh files first.");
            setShouldLoadModel(false);
        }
    }, [urdfFile, urdfContent, meshFiles]);

    const handleClearAll = useCallback(() => {
        setUrdfFile(null);
        setUrdfContent('');
        setMeshFiles(new Map());
        setMeshFileNamesList([]);
        setShouldLoadModel(false);
        setModelLoadStatus("All files cleared. Upload new URDF and mesh files.");
        setRobotModel(null);
        robotModelRef.current = null; // Clear the ref
    }, []);

    const handleRobotLoaded = useCallback((robotInstance) => {
        setRobotModel(robotInstance); // Set the state
        robotModelRef.current = robotInstance; // Also set the ref
        setModelLoadStatus(robotInstance
            ? "Robot model loaded and visible."
            : "Failed to load robot model. Check console for errors.");
        setShouldLoadModel(false);
    }, []);

    // --- MediaPipe Pose Data Handler for Upper Body Mapping ---
    const handlePoseData = useCallback((poseLandmarks) => {
        // This callback receives the full poseLandmarks array from MediaPipe.
        // Uncomment the line below to see raw data in console
        // console.log("Received pose data:", poseLandmarks);

        if (robotModelRef.current && poseLandmarks && poseLandmarks.length > 0) {
            // --- Implement your upper body mapping logic here ---
            // This is where you will translate human pose landmarks into robot joint angles.
            // You will likely need to:
            // 1. Extract relevant upper-body landmarks (e.g., shoulders, elbows, wrists).
            // 2. Calculate angles or positions based on these landmarks.
            // 3. Map these calculated values to your robot's specific joint names and their ranges.

            // Define key landmark indices for the upper body.
            // Refer to MediaPipe Pose Landmarks for indices: https://google.github.io/mediapipe/solutions/pose.html
            const LEFT_SHOULDER = poseLandmarks[11];
            const RIGHT_SHOULDER = poseLandmarks[12];
            const LEFT_ELBOW = poseLandmarks[13];
            const RIGHT_ELBOW = poseLandmarks[14];
            const LEFT_WRIST = poseLandmarks[15];
            const RIGHT_WRIST = poseLandmarks[16];
            const NOSE = poseLandmarks[0];
            const LEFT_EAR = poseLandmarks[7];
            const RIGHT_EAR = poseLandmarks[8];
            const LEFT_HIP = poseLandmarks[23]; // Useful for torso orientation
            const RIGHT_HIP = poseLandmarks[24]; // Useful for torso orientation


            // Ensure essential landmarks are detected before attempting calculations
            if (LEFT_SHOULDER && RIGHT_SHOULDER && LEFT_ELBOW && RIGHT_ELBOW &&
                LEFT_WRIST && RIGHT_WRIST && NOSE && LEFT_EAR && RIGHT_EAR &&
                LEFT_HIP && RIGHT_HIP) {

                // --- Conceptual Mapping Logic (Requires Real Kinematics!) ---
                // This is a highly simplified example.
                // In a real application, you would use 3D vector math (dot products, cross products)
                // to calculate angles between segments (e.g., shoulder-elbow vector and elbow-wrist vector
                // to get the elbow bend angle).

                // Example: Control left elbow based on human elbow angle
                // Assuming a direct mapping where robot elbow angle matches human elbow angle (within limits)
                // This will need a helper function that calculates angle from 3 points
                // function calculateAngle(p1, p2, p3) { /* ... 3D vector math ... */ }

                // For now, let's create some dummy values derived from Y-coordinates for demonstration
                // YOU WILL REPLACE THIS WITH ACTUAL KINEMATIC CALCULATIONS
                const dummyLeftElbowAngle = (1 - LEFT_ELBOW.y) * Math.PI / 2; // Roughly 0 to 90 degrees
                const dummyRightElbowAngle = (1 - RIGHT_ELBOW.y) * Math.PI / 2;

                // Simple shoulder pitch based on shoulder Y position relative to hips
                const dummyLeftShoulderPitch = (LEFT_SHOULDER.y - LEFT_HIP.y) * -3; // Adjust multiplier as needed
                const dummyRightShoulderPitch = (RIGHT_SHOULDER.y - RIGHT_HIP.y) * -3;

                // Simple chest/torso rotation based on shoulder horizontal difference
                const dummyChestYaw = (LEFT_SHOULDER.x - RIGHT_SHOULDER.x - (LEFT_HIP.x - RIGHT_HIP.x)) * 2;


                // --- Apply calculated angles to robot joints ---
                // IMPORTANT: Your UrdfRobotModel needs a method like `setJointValue`
                // that internally accesses the THREE.Object3D representing the joint and sets its rotation.
                // The angle passed should typically be in radians.
                if (robotModelRef.current && typeof robotModelRef.current.setJointValue === 'function') {
                    // Replace these with actual joint names from your JAXON_JVRC URDF
                    // and the correctly calculated angles.

                    // Left Arm
                    robotModelRef.current.setJointValue('LARM_JOINT1', dummyLeftShoulderPitch); // Example: shoulder pitch
                    robotModelRef.current.setJointValue('LARM_JOINT2', dummyLeftElbowAngle);   // Example: elbow bend

                    // Right Arm
                    robotModelRef.current.setJointValue('RARM_JOINT1', dummyRightShoulderPitch);
                    robotModelRef.current.setJointValue('RARM_JOINT2', dummyRightElbowAngle);

                    // Chest/Torso (You'll need to figure out which chest joints map to human torso movement)
                    // For JAXON_JVRC, CHEST_JOINT0, CHEST_JOINT1, CHEST_JOINT2 are relevant.
                    robotModelRef.current.setJointValue('CHEST_JOINT0', dummyChestYaw); // Example: torso twist
                    // You would add more complex mapping for CHEST_JOINT1 (pitch) and CHEST_JOINT2 (roll)

                    // Head (Nose, Ears can help calculate head pitch/yaw/roll)
                    // robotModelRef.current.setJointValue('HEAD_JOINT0', calculatedHeadPitch);
                    // robotModelRef.current.setJointValue('HEAD_JOINT1', calculatedHeadYaw);

                    // Force a re-render or update if your Three.js scene isn't automatically
                    // updating after setting joint values.
                    // If using react-three-fiber, changes to meshes are often picked up automatically.
                } else {
                    console.warn("Robot model not loaded or setJointValue method not available.");
                }
            } else {
                // console.log("Not all required upper body landmarks detected.");
            }
        }
    }, []); // Dependencies: empty, because robotModelRef is a ref.

    useEffect(() => {
        // This effect ensures shouldLoadModel is reset after a load attempt
        if (shouldLoadModel && (robotModel || urdfContent === '')) {
            setShouldLoadModel(false);
        }
    }, [shouldLoadModel, robotModel, urdfContent]);

    return (
        <div className="flex h-screen w-screen bg-[#eaf4fb] font-sans">
            {/* Sidebar */}
           <aside className="w-[22rem] bg-gray-900 text-white p-5 shadow-xl flex flex-col h-full sidebar-always-scroll">
                <h1 className="text-2xl font-bold text-blue-700 mb-5 flex-shrink-0">Robot Control Panel</h1>

                {/* Status Box */}
                <div className="bg-gray-700 p-3 rounded-lg shadow-inner text-sm mb-5 flex-shrink-0">
                    <p>{modelLoadStatus}</p>
                </div>

                {/* Upload Panel */}
                <section className="mb-5 flex-shrink-0">
                    <h2 className="text-lg font-semibold mb-2">Upload Robot Model</h2>
                    <div className="bg-gray-800 p-4 rounded-lg space-y-3 border border-gray-700">
                        <URDFUploader
                            onUrdfFileLoaded={handleUrdfFileLoaded}
                            onMeshFilesLoaded={handleMeshFilesLoaded}
                            urdfFile={urdfFile}
                            meshFiles={meshFiles}
                            meshFileNamesList={meshFileNamesList}
                            onLoadModel={handleLoadModel}
                            onClearAll={handleClearAll}
                            isLoading={shouldLoadModel}
                        />
                        <div className="text-sm text-gray-300">
                            Hold Ctrl/Cmd to select multiple mesh files.
                        </div>
                    </div>
                </section>

                {/* Camera View for MediaPipe */}
                <section className="mb-5 flex-shrink-0">
                    <h2 className="text-lg font-semibold mb-2">Camera Feed for MediaPipe</h2>
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex justify-center items-center relative min-h-[300px]">
                        {/* CameraView acts as a container/stylistic wrapper */}
                        <CameraView />
                        {/* MediaPipeController renders the video feed and provides pose data */}
                        <MediaPipeController onPoseData={handlePoseData} />
                    </div>
                </section>

                {/* Joint Controls with Scroll */}
                <section className="flex-grow min-h-0 overflow-y-scroll pr-1 scrollbar-thin scrollbar-thumb-gray-600">
                    <h2 className="text-lg font-semibold mb-2">Adjust Joints</h2>
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <RobotJointControls robot={robotModel} disabled={!robotModel} />
                    </div>
                </section>
            </aside>

            {/* 3D Viewer */}
            <main className="flex-grow p-2 overflow-hidden bg-[#eaf4fb]">
                <div className="w-full h-full rounded-lg shadow-inner border border-gray-300 bg-white">
                    <UrdfRobotModel
                        urdfContent={urdfContent}
                        loadedMeshFiles={meshFiles}
                        shouldLoadModel={shouldLoadModel}
                        onModelLoadStatus={setModelLoadStatus}
                        onRobotLoaded={handleRobotLoaded}
                    />
                </div>
            </main>
        </div>
    );
}

export default RobotControlApp;