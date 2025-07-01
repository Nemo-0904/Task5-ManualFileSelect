// frontend/src/components/MediaPipeController.jsx
import React, { useEffect, useRef } from "react";
import { Holistic } from "@mediapipe/holistic";
import { Camera } from "@mediapipe/camera_utils";

const MediaPipeController = ({ onPoseData }) => {
    const videoRef = useRef(null);
    const holisticRef = useRef(null);
    const cameraRef = useRef(null);
    const prevPoseRef = useRef(null); // To store the previous pose landmarks

    useEffect(() => {
        const initializeMediaPipe = async () => {
            // Initialize Holistic model only once
            if (!holisticRef.current) {
                console.log("MediaPipeController: Initializing Holistic model...");
                holisticRef.current = new Holistic({
                    locateFile: (file) =>
                        `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
                });

                holisticRef.current.setOptions({
                    modelComplexity: 1, // Higher complexity for better accuracy, lower for better performance
                    smoothLandmarks: true,
                    enableSegmentation: false,
                    refineFaceLandmarks: false,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                });

                holisticRef.current.onResults((results) => {
                    if (results.poseLandmarks) {
                        // Movement detection logic
                        if (prevPoseRef.current) {
                            const movementDetected = checkForMovement(prevPoseRef.current, results.poseLandmarks, 0.01); // Threshold 0.01
                            if (movementDetected) {
                                console.log("Movement Detected!");
                            }
                        }
                        prevPoseRef.current = results.poseLandmarks; // Store current pose for next comparison
                        onPoseData(results.poseLandmarks); // Send pose data up to parent
                    }
                });
                await holisticRef.current.initialize(); // Explicitly initialize the model
                console.log("MediaPipeController: Holistic model initialized.");
            }

            // Setup Camera stream
            // Ensure videoRef.current is available and camera not already initialized
            if (videoRef.current && !cameraRef.current) {
                console.log("MediaPipeController: Attempting to initialize Camera with video element:", videoRef.current);
                cameraRef.current = new Camera(videoRef.current, {
                    onFrame: async () => {
                        if (holisticRef.current && videoRef.current) {
                            await holisticRef.current.send({ image: videoRef.current });
                        }
                    },
                    width: 640, // Adjust resolution as needed
                    height: 480,
                });
                try {
                    await cameraRef.current.start();
                    console.log("MediaPipeController: Camera started successfully.");
                } catch (error) {
                    console.error("MediaPipeController: Failed to start camera:", error);
                    // You might want to display an error message to the user here, e.g., via a state update.
                }
            } else if (!videoRef.current) {
                console.warn("MediaPipeController: Video element not ready for camera setup on initial run.");
                // This 'else if' block can often be removed if videoRef.current is reliably available.
                // If it's a persistent issue, consider a small setTimeout here or re-evaluate component structure.
            }
        };

        // Helper function to check for movement based on key landmarks
        const checkForMovement = (prevLandmarks, currentLandmarks, threshold) => {
            if (!prevLandmarks || !currentLandmarks) return false;

            // Define key upper body landmark indices to monitor for movement
            const keyUpperBodyLandmarkIndices = [
                0,  // Nose
                11, // Left Shoulder
                12, // Right Shoulder
                13, // Left Elbow
                14, // Right Elbow
                15, // Left Wrist
                16  // Right Wrist
            ];

            for (const index of keyUpperBodyLandmarkIndices) {
                const prev = prevLandmarks[index];
                const curr = currentLandmarks[index];

                if (!prev || !curr) continue; // Skip if landmark is not detected in either frame

                // Calculate Euclidean distance in 3D space
                const dx = curr.x - prev.x;
                const dy = curr.y - prev.y;
                const dz = curr.z - prev.z; // Z-coordinate provides depth change

                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (distance > threshold) {
                    return true; // Movement detected
                }
            }
            return false; // No significant movement detected
        };

        initializeMediaPipe(); // Call initialization directly

        return () => {
            // Cleanup on unmount
            console.log("MediaPipeController: Cleaning up camera and holistic.");
            cameraRef.current?.stop(); // Stop the camera stream
            // MediaPipe Holistic models don't expose a public .close() or .dispose() method
            // Setting ref to null might aid garbage collection.
            holisticRef.current = null;
        };
    }, [onPoseData]); // Dependency array: re-run effect if onPoseData changes

    return (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center overflow-hidden">
            {/* This video element displays the webcam feed */}
            <video
                ref={videoRef}
                className="rounded-lg border border-gray-600 w-full h-full object-cover transform scaleX(-1)" // scaleX(-1) to mirror the video
                autoPlay
                muted
                playsInline
                aria-label="Webcam feed for pose estimation"
            />
        </div>
    );
};

export default MediaPipeController;