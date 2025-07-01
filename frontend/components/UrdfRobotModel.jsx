// frontend/src/components/UrdfRobotModel.jsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader';

// Helper function to convert RPY (Roll Pitch Yaw) to Euler angles (XYZ order for Three.js)
// URDF RPY is extrinsic, ZYX order, corresponding to Three.js Euler's XYZ.
const rpyToEuler = (r, p, y) => {
    return new THREE.Euler(r, p, y, 'XYZ'); // Roll (X), Pitch (Y), Yaw (Z)
};

// Helper function to parse XYZ string to THREE.Vector3
const parseXYZ = (xyzString) => {
    if (!xyzString) return new THREE.Vector3(0, 0, 0);
    const parts = xyzString.split(' ').map(parseFloat);
    return new THREE.Vector3(parts[0] || 0, parts[1] || 0, parts[2] || 0);
};

// Helper function to parse RPY string to THREE.Euler
const parseRPY = (rpyString) => {
    if (!rpyString) return new THREE.Euler(0, 0, 0, 'XYZ');
    const parts = rpyString.split(' ').map(parseFloat);
    return rpyToEuler(parts[0] || 0, parts[1] || 0, parts[2] || 0);
};

const UrdfRobotModel = ({ urdfContent, loadedMeshFiles, shouldLoadModel, onModelLoadStatus, onRobotLoaded }) => {
    const mountRef = useRef(null);
    const sceneRef = useRef(new THREE.Scene());
    const cameraRef = useRef(new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 100));
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);
    const robotRef = useRef(null); // Stores the root Three.js Group for the robot

    // Initial camera position (will be adjusted dynamically after model load)
    // These values are defaults and will be overwritten for an optimal view once the robot loads.
    cameraRef.current.position.set(0, 1.4, 2);
    cameraRef.current.lookAt(0, 0, 0);

    // Three.js scene setup (runs once on mount)
    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        // Initialize renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(mount.clientWidth, mount.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0x1e1e1e); // Dark background (charcoal gray)

        renderer.shadowMap.enabled = true; // Enable shadows

        // Clear existing canvas elements to prevent duplicates on re-renders
        while (mount.firstChild) {
            mount.removeChild(mount.firstChild);
        }
        mount.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const camera = cameraRef.current;
        camera.aspect = mount.clientWidth / mount.clientHeight;
        camera.updateProjectionMatrix();

        // Initialize OrbitControls for camera manipulation
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; // For smoother camera movement
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false; // Prevents camera from panning in screen space
        controlsRef.current = controls;

        // Add lights to the scene
        sceneRef.current.add(new THREE.AmbientLight(0xffffff, 0.8)); // Soft overall light
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.5); // Main directional light
        mainLight.position.set(5, 10, 5);
        mainLight.castShadow = true;
        sceneRef.current.add(mainLight);
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.4); // Fill light from another angle
        fillLight.position.set(-3, 5, -2);
        sceneRef.current.add(fillLight);

        // Add a ground plane
        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(50, 50),
            new THREE.MeshStandardMaterial({ color: 0xf5f5f5, side: THREE.DoubleSide })
        );
        plane.rotation.x = -Math.PI / 2; // Rotate to be horizontal

        plane.receiveShadow = true; // Plane can receive shadows
        sceneRef.current.add(plane);

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            controls.update(); // Required for damping to work
            renderer.render(sceneRef.current, camera);
        };
        animate();

        // Handle window resize
        const handleResize = () => {
            const width = mount.clientWidth;
            const height = mount.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };
        window.addEventListener('resize', handleResize);

        // This cleanup now explicitly runs only when the component unmounts
        return () => {
            console.log("UrdfRobotModel: Component UNMOUNTING/Cleanup core Three.js elements.");
            window.removeEventListener('resize', handleResize);
            if (mount && renderer.domElement) mount.removeChild(renderer.domElement);
            renderer.dispose();
            controls.dispose();
            // Remove lights and plane as they are added directly to the sceneRef.current
            sceneRef.current.remove(mainLight);
            sceneRef.current.remove(fillLight);
            sceneRef.current.remove(plane);
        };
    }, []); // Empty dependency array ensures this runs only once on mount

    // Custom URDF parsing and model building (runs when shouldLoadModel is true or related props change)
    useEffect(() => {
        if (!shouldLoadModel || !urdfContent) {
            onModelLoadStatus("Waiting for URDF to be ready for parsing.");
            return;
        }

        onModelLoadStatus("Starting custom URDF parsing...");

        // Remove previous robot model if any exists from the scene before loading a new one
        if (robotRef.current && sceneRef.current.children.includes(robotRef.current)) {
            console.log("Removing previous robot model from scene.");
            sceneRef.current.remove(robotRef.current);
            robotRef.current.traverse((object) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
            // Clear out old robotRef content more thoroughly to prevent memory leaks
            robotRef.current = null;
        }


        const parseUrdf = async () => {
            try {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(urdfContent, "text/xml");

                const parseError = xmlDoc.getElementsByTagName("parsererror");
                if (parseError.length > 0) {
                    const errorMsg = parseError[0].textContent;
                    console.error("XML parsing error in URDF:", errorMsg);
                    // FIX: Use template literal correctly
                    onModelLoadStatus(`URDF XML Error: ${errorMsg}`);
                    onRobotLoaded(null);
                    return;
                }

                const robotElement = xmlDoc.querySelector('robot');
                if (!robotElement) {
                    console.error("Invalid URDF: 'robot' tag not found.");
                    onModelLoadStatus("Invalid URDF: 'robot' tag missing.");
                    onRobotLoaded(null);
                    return;
                }

                const robotName = robotElement.getAttribute('name') || 'unnamed_robot';
                // FIX: Use template literal correctly
                onModelLoadStatus(`Parsing robot: ${robotName}`);
                console.log(`Parsing robot: ${robotName}`);

                const linksMap = new Map();
                const jointsDataMap = new Map();

                const robotRootGroup = new THREE.Group();
                robotRootGroup.name = robotName;

                // --- 1. Create all links (visuals) ---
                for (const linkElement of xmlDoc.querySelectorAll('link')) {
                    const linkName = linkElement.getAttribute('name');
                    if (!linkName) {
                        console.warn("Link found without 'name' attribute. Skipping.");
                        continue;
                    }

                    const linkGroup = new THREE.Group();
                    linkGroup.name = linkName;
                    linksMap.set(linkName, linkGroup);

                    for (const visualElement of linkElement.querySelectorAll('visual')) {
                        const geometryElement = visualElement.querySelector('geometry');
                        if (!geometryElement) {
                            // FIX: Use template literal correctly
                            console.warn(`Link '${linkName}' visual has no geometry. Skipping visual.`);
                            continue;
                        }

                        let visualMesh = null;
                        let geometry = null;
                        let material = new THREE.MeshStandardMaterial({ color: 0x888888, side: THREE.DoubleSide });

                        const materialElement = visualElement.querySelector('material');
                        if (materialElement) {
                            const rgba = materialElement.querySelector('color')?.getAttribute('rgba');
                            if (rgba) {
                                const [r, g, b, a] = rgba.split(' ').map(parseFloat);
                                material = new THREE.MeshStandardMaterial({ color: new THREE.Color(r, g, b), opacity: a, transparent: a < 1, side: THREE.DoubleSide });
                            }
                        }

                        const meshElement = geometryElement.querySelector('mesh');
                        const boxElement = geometryElement.querySelector('box');
                        const cylinderElement = geometryElement.querySelector('cylinder');
                        const sphereElement = geometryElement.querySelector('sphere');

                        if (meshElement) {
                            const filename = meshElement.getAttribute('filename');
                            if (filename) {
                                // Extract just the filename, normalize case (URDF paths can be inconsistent)
                                const meshFileName = filename.split('/').pop().toLowerCase();
                                const meshData = loadedMeshFiles.get(meshFileName);

                                if (meshData) {
                                    const ext = meshFileName.split('.').pop();

                                    if (ext === 'stl') {
                                        try {
                                            geometry = new STLLoader().parse(meshData);
                                            console.log(`Custom parsed STL mesh: ${meshFileName}`);
                                        } catch (err) {
                                            // FIX: Use template literal correctly for console.error
                                            console.error(`Error parsing STL mesh ${meshFileName}:`, err);
                                        }
                                    } else if (ext === 'dae') {
                                        // FIX: Use template literal correctly for console.log
                                        console.log(`DAE meshData for ${meshFileName}: Type: ${typeof meshData}, Starts with: "${String(meshData).substring(0, 50)}"`);
                                        try {
                                            const colladaLoader = new ColladaLoader();
                                            const collada = colladaLoader.parse(meshData);
                                            visualMesh = collada.scene;
                                            visualMesh.traverse((node) => {
                                                if (node.isMesh) {
                                                    node.castShadow = true;
                                                    node.receiveShadow = true;
                                                    // Only apply default material if the DAE mesh doesn't have a suitable material already
                                                    if (!(node.material instanceof THREE.MeshStandardMaterial || node.material instanceof THREE.MeshPhongMaterial)) {
                                                        node.material = material;
                                                    }
                                                }
                                            });
                                            console.log(`Custom parsed DAE mesh: ${meshFileName}`);
                                        } catch (err) {
                                            // FIX: Use template literal correctly for console.error
                                            console.error(`Error parsing DAE mesh ${meshFileName}:`, err);
                                        }
                                    } else if (ext === 'obj') {
                                        console.warn(`OBJLoader not implemented yet for ${meshFileName}.`);
                                    } else if (ext === 'gltf' || ext === 'glb') {
                                        console.warn(`GLTFLoader not implemented yet for ${meshFileName}.`);
                                    } else {
                                        // FIX: Use template literal correctly for console.warn
                                        console.warn(`Custom parser: Unsupported mesh format for '${meshFileName}': ${ext}. Skipping.`);
                                    }
                                } else {
                                    // FIX: Use template literal correctly for console.warn
                                    console.warn(`Mesh data for '${meshFileName}' not found in loadedMeshFiles. Skipping.`);
                                }
                            }
                        } else if (boxElement) {
                            const size = boxElement.getAttribute('size').split(' ').map(parseFloat);
                            geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
                            console.log(`Custom parsed Box geometry: ${size}`);
                        } else if (cylinderElement) {
                            const radius = parseFloat(cylinderElement.getAttribute('radius'));
                            const length = parseFloat(cylinderElement.getAttribute('length'));
                            geometry = new THREE.CylinderGeometry(radius, radius, length, 32);
                            console.log(`Custom parsed Cylinder geometry: R:${radius}, L:${length}`);
                        } else if (sphereElement) {
                            const radius = parseFloat(sphereElement.getAttribute('radius'));
                            geometry = new THREE.SphereGeometry(radius, 32, 32);
                            console.log(`Custom parsed Sphere geometry: R:${radius}`);
                        }

                        if (geometry) {
                            visualMesh = new THREE.Mesh(geometry, material);
                            visualMesh.castShadow = true;
                            visualMesh.receiveShadow = true;
                        }

                        if (visualMesh) {
                            const visualOriginElement = visualElement.querySelector('origin');
                            if (visualOriginElement) {
                                const xyz = parseXYZ(visualOriginElement.getAttribute('xyz'));
                                const rpy = parseRPY(visualOriginElement.getAttribute('rpy'));
                                visualMesh.position.copy(xyz);
                                visualMesh.rotation.copy(rpy);
                            }
                            linkGroup.add(visualMesh);
                        }
                    }
                }

                // --- 2. Attach links via joints to build the robot hierarchy ---
                for (const jointElement of xmlDoc.querySelectorAll('joint')) {
                    const jointName = jointElement.getAttribute('name');
                    const jointType = jointElement.getAttribute('type');
                    const parentLinkName = jointElement.querySelector('parent')?.getAttribute('link');
                    const childLinkName = jointElement.querySelector('child')?.getAttribute('link');

                    const parentLink = linksMap.get(parentLinkName);
                    const childLink = linksMap.get(childLinkName);

                    if (parentLink && childLink) {
                        const jointOriginElement = jointElement.querySelector('origin');
                        const jointPosition = jointOriginElement ? parseXYZ(jointOriginElement.getAttribute('xyz')) : new THREE.Vector3(0, 0, 0);
                        const jointRotation = jointOriginElement ? parseRPY(jointOriginElement.getAttribute('rpy')) : new THREE.Euler(0, 0, 0, 'XYZ');

                        const jointObject = new THREE.Object3D();
                        jointObject.position.copy(jointPosition);
                        jointObject.rotation.copy(jointRotation);
                        jointObject.name = jointName || 'unnamed_joint';

                        jointObject.add(childLink);
                        parentLink.add(jointObject);
                        console.log(`Attached ${childLinkName} to ${parentLinkName} via ${jointObject.name}`);

                        if (jointType === 'revolute' || jointType === 'prismatic') {
                            const axisElement = jointElement.querySelector('axis');
                            const axis = axisElement ? parseXYZ(axisElement.getAttribute('xyz')) : new THREE.Vector3(1, 0, 0);

                            const limitElement = jointElement.querySelector('limit');
                            const lower = limitElement ? parseFloat(limitElement.getAttribute('lower')) : -Math.PI;
                            const upper = limitElement ? parseFloat(limitElement.getAttribute('upper')) : Math.PI;

                            jointsDataMap.set(jointName, {
                                type: jointType,
                                axis: axis,
                                lower: lower,
                                upper: upper,
                                currentAngle: 0,
                                threeObject: jointObject,
                                // Store the initial position for prismatic joints for proper translation calculation
                                initialPosition: jointObject.position.clone()
                            });
                            console.log(`Registered movable joint: ${jointName} (Type: ${jointType})`);
                        }
                    } else {
                        // FIX: Use template literal correctly for console.warn
                        console.warn(`Skipping joint '${jointElement.getAttribute('name')}': Parent '${parentLinkName}' or child '${childLinkName}' link not found.`);
                    }
                }

                // --- 3. Identify and add the root link to the scene ---
                const baseLinkElement = robotElement.querySelector('link[name="BODY"]'); // Assuming 'BODY' is the root for JAXON_JVRC
                const baseLinkName = baseLinkElement ? baseLinkElement.getAttribute('name') : null;

                let rootLinkGroup = null;
                if (baseLinkName && linksMap.has(baseLinkName)) {
                    rootLinkGroup = linksMap.get(baseLinkName);
                    robotRootGroup.add(rootLinkGroup);
                } else {
                    console.warn("Could not find 'BODY' as base_link, or it's not the root. Attempting to find first link without a parent joint.");
                    const allChildLinks = new Set();
                    for(const jointElement of xmlDoc.querySelectorAll('joint')) {
                        const childLinkName = jointElement.querySelector('child')?.getAttribute('link');
                        if (childLinkName) {
                            allChildLinks.add(childLinkName);
                        }
                    }

                    for(const [linkName, linkGroup] of linksMap.entries()){
                        if(!allChildLinks.has(linkName)){
                            console.log(`Identified root link (no parent joint): ${linkName}`);
                            robotRootGroup.add(linkGroup);
                            rootLinkGroup = linkGroup;
                            break;
                        }
                    }

                    if (!rootLinkGroup) {
                        console.error("Could not determine root link of the robot. Attaching all top-level unattached links directly.");
                        // This fallback ensures something is added, even if the hierarchy is flat
                        for(const link of linksMap.values()){
                            if(!link.parent){ // Check if link hasn't been added as a child of a joint yet
                                robotRootGroup.add(link);
                            }
                        }
                    }
                }

                // --- Implement setJointValue method on the robot object for external control ---
                robotRootGroup.setJointValue = (jointName, value) => {
                    const jointData = jointsDataMap.get(jointName);
                    if (!jointData) {
                        // FIX: Use template literal correctly
                        console.warn(`Joint '${jointName}' not found or not a movable type.`);
                        return;
                    }

                    const clampedValue = Math.max(jointData.lower, Math.min(jointData.upper, value));

                    if (jointData.type === 'revolute') {
                        // Apply rotation based on the joint's local axis
                        // The rotation needs to happen relative to the jointObject's initial orientation
                        // A simpler approach for revolute joints is to directly set the rotation property
                        // corresponding to the axis, if the axis is aligned with local X, Y, or Z.
                        // If the axis is arbitrary, you'd use a quaternion.
                        // For simplicity and common URDF patterns, assuming axis is [1,0,0], [0,1,0], or [0,0,1]
                        // Note: This needs to consider the jointObject's *initial* rotation as well.
                        // For a simple direct control, assuming the axis is defined in the joint's local frame.
                        // The current implementation directly sets x,y,z rotation which is fine if axis is aligned.
                        // For arbitrary axes, the quaternion approach is more robust.
                        if (jointData.axis.x !== 0 && jointData.axis.y === 0 && jointData.axis.z === 0) {
                            jointData.threeObject.rotation.x = clampedValue;
                        } else if (jointData.axis.y !== 0 && jointData.axis.x === 0 && jointData.axis.z === 0) {
                            jointData.threeObject.rotation.y = clampedValue;
                        } else if (jointData.axis.z !== 0 && jointData.axis.x === 0 && jointData.axis.y === 0) {
                            jointData.threeObject.rotation.z = clampedValue;
                        } else {
                            // For arbitrary axis, use quaternion:
                            // IMPORTANT: For arbitrary axis, you might need to apply the rotation
                            // relative to the jointObject's *original* rotation, not just setting it.
                            // A common pattern is:
                            // jointData.threeObject.setRotationFromQuaternion(jointData.initialQuaternion.clone().multiply(quaternion));
                            // where initialQuaternion is stored at parsing time.
                            // For now, this directly sets the rotation from the axis and angle, which might overwrite prior rotations.
                            const quaternion = new THREE.Quaternion();
                            quaternion.setFromAxisAngle(jointData.axis, clampedValue);
                            jointData.threeObject.quaternion.copy(quaternion);
                        }
                    } else if (jointData.type === 'prismatic') {
                        // Apply translation for prismatic joints relative to their initial position
                        // Ensure initialPosition is properly cloned before adding scaled axis
                        jointData.threeObject.position.copy(jointData.initialPosition.clone().add(jointData.axis.clone().multiplyScalar(clampedValue)));
                    }
                    jointData.currentAngle = clampedValue;
                };

                // Store simplified joint data on the robot object itself, accessible by name
                robotRootGroup.joints = {};
                jointsDataMap.forEach((data, name) => {
                    robotRootGroup.joints[name] = {
                        type: data.type,
                        lower: data.lower,
                        upper: data.upper,
                        axis: data.axis.clone(), // Clone to prevent accidental modification
                        currentAngle: data.currentAngle,
                        // Do NOT expose 'threeObject' directly here to external components,
                        // as it's a Three.js internal object. Keep internal references managed.
                        // The `setJointValue` method handles direct manipulation.
                    };
                });
                console.log("Registered joints for control:", Object.keys(robotRootGroup.joints));

                // --- GLOBAL ROBOT TRANSFORMATION AND CENTERING ---
                // Apply common URDF (Z-up, X-forward) to Three.js (Y-up, Z-forward) global transformations
                // This will make the robot face "forward" (along Three.js Z-axis)
                // and be upright (along Three.js Y-axis).
                robotRootGroup.rotation.x = -Math.PI / 2; // Rotate X to make Z (URDF) map to Y (Three.js)
                robotRootGroup.rotation.z = -Math.PI / 2; // Rotate Z to make X (URDF) map to -Z (Three.js), then adjust for desired view
                // After these rotations, the URDF Z-axis is Three.js Y-axis, and URDF X-axis is Three.js -Z-axis.

                const box = new THREE.Box3().setFromObject(robotRootGroup);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());

                // Calculate the vertical offset to bring the lowest point of the bounding box to Y=0.01 (just above the plane)
                const lowestY = center.y - (size.y / 2);
                const offsetToGround = -lowestY + 0.01;

                // Apply centering and lifting offsets
                // Need to consider rotation when calculating initial centering, or apply post-rotation.
                // The current centering works on the *rotated* bounding box.
                robotRootGroup.position.x = -center.x;
                robotRootGroup.position.y += offsetToGround;
                robotRootGroup.position.z = -center.z; // Center on Z as well


                // Add an AxesHelper to the root of the robot for visual debugging
                // This helper will show the final orientation of the robot's root group.
                const axesHelper = new THREE.AxesHelper(Math.max(size.x, size.y, size.z) * 0.75); // Scale based on robot size
                robotRootGroup.add(axesHelper);

                sceneRef.current.add(robotRootGroup);
                robotRef.current = robotRootGroup;

                // Dynamically adjust camera after model load for optimal view
                const maxDimForCamera = Math.max(size.x, size.y, size.z);
                const cameraDistance = maxDimForCamera * 1.5; // Zoomed out more

                const cameraTargetY = center.y + offsetToGround; // Target the center of the robot vertically

                // Position camera along the negative Z-axis to view the robot from the front
                cameraRef.current.position.set(0, cameraTargetY, cameraDistance); // Increased Z-distance
                cameraRef.current.lookAt(0, cameraTargetY, 0); // Look at the centered robot

                controlsRef.current.target.set(0, cameraTargetY, 0);
                controlsRef.current.update();

                console.log("Custom parsed robot bounding box size:", size);
                console.log("Robot positioned at:", robotRootGroup.position);
                console.log("Camera positioned at:", cameraRef.current.position);
                console.log("Camera looking at:", controlsRef.current.target);
                console.log("Robot added to scene, robotRef.current:", robotRef.current);

                onModelLoadStatus("Robot model loaded (custom parser).");
                onRobotLoaded(robotRootGroup);

            } catch (e) {
                console.error("Error during custom URDF parsing:", e);
                // FIX: Use template literal correctly
                onModelLoadStatus(`Error during parsing: ${e.message || e}`);
                onRobotLoaded(null);
            }
        };

        parseUrdf();

    }, [shouldLoadModel, urdfContent, loadedMeshFiles, onModelLoadStatus, onRobotLoaded]);

    return <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }} />;
};

export default UrdfRobotModel;