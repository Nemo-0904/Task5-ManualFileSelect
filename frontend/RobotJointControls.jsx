import React, { useState, useEffect, useCallback } from 'react';

function RobotJointControls({ robot, disabled }) {
    const [jointValues, setJointValues] = useState({});

    useEffect(() => {
        if (robot && robot.joints) {
            const initialValues = {};
            Object.entries(robot.joints).forEach(([jointName, jointData]) => {
                initialValues[jointName] = jointData.currentAngle || 0;
            });
            setJointValues(initialValues);
        } else {
            setJointValues({});
        }
    }, [robot]);

    const handleSliderChange = useCallback((jointName, event) => {
        const newValue = parseFloat(event.target.value);
        setJointValues(prevValues => ({
            ...prevValues,
            [jointName]: newValue
        }));

        if (robot && robot.setJointValue) {
            try {
                robot.setJointValue(jointName, newValue);
            } catch (error) {
                // FIX IS HERE: Include 'error' inside the template literal
                console.error(`Error setting joint value for ${jointName}:`, error);
            }
        }
    }, [robot]);

    if (disabled) {
        return (
            <div className="p-4 bg-gray-700 text-gray-400 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-300 mb-2">Adjust Joints</h2>
                <p>Upload and load a URDF model to access joint controls.</p>
            </div>
        );
    }

    // Ensure robot and robot.joints exist before attempting to map
    if (!robot || !robot.joints) {
        // This case should ideally be covered by the disabled prop,
        // but as a fallback, we can return null or a loading state.
        return null; // Or <p>Loading robot data...</p>
    }

    return (
        <div className="p-4 bg-gray-700 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-200 mb-2">Adjust Joints</h2>
            <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-500px)] pr-2">
                {Object.entries(robot.joints).map(([jointName, jointData]) => (
                    <div key={jointName} className="flex flex-col">
                        <label htmlFor={jointName} className="text-sm font-medium text-gray-300 mb-1">
                            {jointName} ({jointValues[jointName]?.toFixed(2)} {jointData.type === 'revolute' ? 'rad' : 'm'})
                        </label>
                        <input
                            type="range"
                            id={jointName}
                            min={jointData.lower}
                            max={jointData.upper}
                            step={jointData.type === 'revolute' ? 0.01 : 0.001}
                            value={jointValues[jointName] || 0}
                            onChange={(e) => handleSliderChange(jointName, e)}
                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg dark:bg-gray-700"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default RobotJointControls;