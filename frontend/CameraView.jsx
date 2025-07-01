// frontend/src/components/CameraView.jsx
import React from 'react';

const CameraView = () => {
    return (
        // This div acts as a styled container for the MediaPipeController's video feed.
        // The MediaPipeController will render its video element inside the space provided by its parent.
        // We ensure it takes up the full space of its parent (the bg-gray-800 div in RobotControlApp).
        <div className="w-full h-full flex items-center justify-center overflow-hidden">
            {/* The MediaPipeController component will render its <video> element here implicitly.
                This component itself doesn't render a video tag. */}
            <p className="text-gray-400 text-sm">
                Camera feed loading...
            </p>
        </div>
    );
};

export default CameraView;