import { useEffect } from 'react';
import * as THREE from 'three';
import { POSE_LANDMARKS } from '@mediapipe/pose';

// Helper function to calculate the angle between three points (not currently used for this basic setup but good to keep)
const getAngleBetweenThreePoints = (A, B, C) => {
    if (!A || !B || !C) return 0;
    const vectorA = new THREE.Vector3(A.x, A.y, A.z);
    const vectorB = new THREE.Vector3(B.x, B.y, B.z);
    const vectorC = new THREE.Vector3(C.x, C.y, C.z);

    const BA = new THREE.Vector3().subVectors(vectorA, vectorB);
    const BC = new THREE.Vector3().subVectors(vectorC, vectorB);

    const angle = BA.angleTo(BC);
    return angle;
};

function useRobotPoseControl(robotModel, humanPoseLandmarks) {
    useEffect(() => {
        // Uncomment these logs for debugging if the robot is not moving
        console.log("🧠 useRobotPoseControl triggered"); // Uncommented for debugging

        if (!robotModel || !robotModel.joints) {
            console.log("⛔ No robot model or joints found."); // Uncommented for debugging
            return;
        }

        if (!humanPoseLandmarks || humanPoseLandmarks.length === 0) {
            console.log("⛔ No human pose landmarks available."); // Uncommented for debugging
            return;
        }

        console.log("✅ Pose landmarks received:", humanPoseLandmarks); // Uncommented for debugging
        console.log("🦾 Robot joints available:", Object.keys(robotModel.joints)); // Uncommented for debugging

        // Extract required landmarks for head and torso control
        // Note: POSE_LANDMARKS are 0-indexed constants from MediaPipe.
        // Ensure your humanPoseLandmarks array actually contains elements at these indices.
        const nose = humanPoseLandmarks[POSE_LANDMARKS.NOSE];
        const leftEar = humanPoseLandmarks[POSE_LANDMARKS.LEFT_EAR];
        const rightEar = humanPoseLandmarks[POSE_LANDMARKS.RIGHT_EAR];
        const leftShoulder = humanPoseLandmarks[POSE_LANDMARKS.LEFT_SHOULDER];
        const rightShoulder = humanPoseLandmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
        const leftHip = humanPoseLandmarks[POSE_LANDMARKS.LEFT_HIP];
        const rightHip = humanPoseLandmarks[POSE_LANDMARKS.RIGHT_HIP];

        // --- IMPORTANT: Adjust visibility thresholds as needed ---
        // General threshold for most landmarks (head, shoulders)
        const GENERAL_VISIBILITY_THRESHOLD = 0.5;
        // Lower threshold specifically for hip landmarks, as they are often partially obscured
        const HIP_VISIBILITY_THRESHOLD = 0.005; // Set to a very low value based on your logs

        const areHeadTorsoLandmarksVisible =
            nose && nose.visibility > GENERAL_VISIBILITY_THRESHOLD &&
            leftEar && leftEar.visibility > GENERAL_VISIBILITY_THRESHOLD &&
            rightEar && rightEar.visibility > GENERAL_VISIBILITY_THRESHOLD &&
            leftShoulder && leftShoulder.visibility > GENERAL_VISIBILITY_THRESHOLD &&
            rightShoulder && rightShoulder.visibility > GENERAL_VISIBILITY_THRESHOLD &&
            // Use the lower threshold for hips
            leftHip && leftHip.visibility > HIP_VISIBILITY_THRESHOLD &&
            rightHip && rightHip.visibility > HIP_VISIBILITY_THRESHOLD;

        if (!areHeadTorsoLandmarksVisible) {
            console.log("⚠️ Not all required head/torso landmarks are visible."); // Uncommented for debugging
            // UNCOMMENT THESE LINES FOR DETAILED DEBUGGING IF ROBOT IS NOT MOVING:
            if (!nose || nose.visibility < GENERAL_VISIBILITY_THRESHOLD) console.log(`  - Nose visibility: ${nose?.visibility}`);
            if (!leftEar || leftEar.visibility < GENERAL_VISIBILITY_THRESHOLD) console.log(`  - Left Ear visibility: ${leftEar?.visibility}`);
            if (!rightEar || rightEar.visibility < GENERAL_VISIBILITY_THRESHOLD) console.log(`  - Right Ear visibility: ${rightEar?.visibility}`);
            if (!leftShoulder || leftShoulder.visibility < GENERAL_VISIBILITY_THRESHOLD) console.log(`  - Left Shoulder visibility: ${leftShoulder?.visibility}`);
            if (!rightShoulder || rightShoulder.visibility < GENERAL_VISIBILITY_THRESHOLD) console.log(`  - Right Shoulder visibility: ${rightShoulder?.visibility}`);
            if (!leftHip || leftHip.visibility < HIP_VISIBILITY_THRESHOLD) console.log(`  - Left Hip visibility: ${leftHip?.visibility}`);
            if (!rightHip || rightHip.visibility < HIP_VISIBILITY_THRESHOLD) console.log(`  - Right Hip visibility: ${rightHip?.visibility}`);
            return;
        }

        // Calculate midpoints for better stability
        const shoulderMidpoint = new THREE.Vector3(
            (leftShoulder.x + rightShoulder.x) / 2,
            (leftShoulder.y + rightShoulder.y) / 2,
            (leftShoulder.z + rightShoulder.z) / 2
        );
        const hipMidpoint = new THREE.Vector3(
            (leftHip.x + rightHip.x) / 2,
            (leftHip.y + rightHip.y) / 2,
            (leftHip.z + rightHip.z) / 2
        );

        // --- Robot Head Yaw (left-right) ---
        const robotHeadYawJoint = robotModel.joints['HEAD_JOINT0'];
        if (robotHeadYawJoint) {
            // Raw input: horizontal difference between nose and shoulder midpoint
            // Smaller raw range might be more sensitive, larger range less sensitive.
            const raw = nose.x - shoulderMidpoint.x;
            // Map raw value to the joint's lower and upper limits.
            // Adjust the -0.1 to 0.1 range if the head movement is too much or too little.
            const mapped = THREE.MathUtils.clamp(
                THREE.MathUtils.mapLinear(raw, -0.1, 0.1, robotHeadYawJoint.lower, robotHeadYawJoint.upper),
                robotHeadYawJoint.lower, robotHeadYawJoint.upper
            );
            robotModel.setJointValue(robotHeadYawJoint.name, mapped);
            // UNCOMMENT FOR DETAILED DEBUGGING:
            console.log(`🤖 HEAD_JOINT0: raw=${raw.toFixed(3)} mapped=${mapped.toFixed(3)} limits=(${robotHeadYawJoint.lower.toFixed(3)}, ${robotHeadYawJoint.upper.toFixed(3)})`); // Uncommented
        } else {
            console.warn("⚠️ HEAD_JOINT0 not found in robot model."); // Uncommented
        }

        // --- Robot Head Pitch (up-down) ---
        const robotHeadPitchJoint = robotModel.joints['HEAD_JOINT1'];
        if (robotHeadPitchJoint) {
            // Raw input: vertical difference between nose and shoulder midpoint
            const raw = nose.y - shoulderMidpoint.y;
            // Map raw value to the joint's limits.
            // IMPORTANT: The upper and lower bounds might be swapped depending on how 'up' and 'down' map to your robot's pitch.
            // If the robot moves the wrong way, swap robotHeadPitchJoint.upper and robotHeadPitchJoint.lower in mapLinear.
            // Adjust the -0.05 to 0.05 range for sensitivity.
            const mapped = THREE.MathUtils.clamp(
                THREE.MathUtils.mapLinear(raw, -0.05, 0.05, robotHeadPitchJoint.upper, robotHeadPitchJoint.lower), // Swapped upper/lower for typical "nod" motion
                robotHeadPitchJoint.lower, robotHeadPitchJoint.upper
            );
            robotModel.setJointValue(robotHeadPitchJoint.name, mapped);
            // UNCOMMENT FOR DETAILED DEBUGGING:
            console.log(`🤖 HEAD_JOINT1: raw=${raw.toFixed(3)} mapped=${mapped.toFixed(3)} limits=(${robotHeadPitchJoint.lower.toFixed(3)}, ${robotHeadPitchJoint.upper.toFixed(3)})`); // Uncommented
        } else {
            console.warn("⚠️ HEAD_JOINT1 not found in robot model."); // Uncommented
        }

        // --- Robot Chest Yaw (torso twist) ---
        const robotChestYawJoint = robotModel.joints['CHEST_JOINT0'];
        if (robotChestYawJoint) {
            // Raw input: horizontal difference between shoulder midpoint and hip midpoint
            const raw = shoulderMidpoint.x - hipMidpoint.x;
            // Map raw value to the joint's limits.
            // Adjust the -0.05 to 0.05 range for sensitivity.
            const mapped = THREE.MathUtils.clamp(
                THREE.MathUtils.mapLinear(raw, -0.05, 0.05, robotChestYawJoint.lower, robotChestYawJoint.upper),
                robotChestYawJoint.lower, robotChestYawJoint.upper
            );
            robotModel.setJointValue(robotChestYawJoint.name, mapped);
            // UNCOMMENT FOR DETAILED DEBUGGING:
            console.log(`🤖 CHEST_JOINT0: raw=${raw.toFixed(3)} mapped=${mapped.toFixed(3)} limits=(${robotChestYawJoint.lower.toFixed(3)}, ${robotChestYawJoint.upper.toFixed(3)})`); // Uncommented
        } else {
            console.warn("⚠️ CHEST_JOINT0 not found in robot model."); // Uncommented
        }

    }, [robotModel, humanPoseLandmarks]); // Dependencies: re-run when robotModel or pose changes
}

export default useRobotPoseControl;
