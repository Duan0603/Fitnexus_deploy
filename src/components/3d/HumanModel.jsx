import React, { useEffect, useState, useRef } from "react";
import { useGLTF, Center } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export function HumanModel({ onBodyPartClick }) {
  const modelRef = useRef();
  const { scene } = useGLTF("/human_model.glb");
  const { camera } = useThree();
  const [hoveredPart, setHoveredPart] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);
  const [lastClickTime, setLastClickTime] = useState(0);
  const initialCameraPosition = useRef(null);
  const [isZoomedIn, setIsZoomedIn] = useState(false);

  // Save initial camera position
  useEffect(() => {
    if (!initialCameraPosition.current) {
      initialCameraPosition.current = camera.position.clone();
    }
  }, [camera]);

  // Materials for different states
  const materials = {
    default: new THREE.MeshStandardMaterial({
      color: 0xf5c8a8, // Warm peachy skin tone
      metalness: 0.1,
      roughness: 0.7,
      side: THREE.DoubleSide
    }),
    hover: new THREE.MeshStandardMaterial({
      color: 0xff7744, // Light peach
      metalness: 0.1,
      roughness: 0.7,
      emissive: new THREE.Color(0xff9966),
      emissiveIntensity: 0.1,
    }),
    selected: new THREE.MeshStandardMaterial({
      color: 0xffccaa, // Orange-red
      metalness: 0.15,
      roughness: 0.65,
      emissive: new THREE.Color(0xff5522),
      emissiveIntensity: 0.2,
    })
  };

  // Initialize model with default material
  useEffect(() => {
    scene.traverse((node) => {
      if (node.isMesh) {
        // Save original material
        node.userData.originalMaterial = node.material;
        
        // Apply default material
        node.material = materials.default.clone();
        
        // Enable shadows for better depth
        node.castShadow = true;
        node.receiveShadow = true;
        
        // Mark as interactive
        node.userData.isInteractive = true;
      }
    });

    // Cleanup function
    return () => {
      scene.traverse((node) => {
        if (node.isMesh) {
          if (node.material) node.material.dispose();
          if (node.userData.originalMaterial) {
            node.material = node.userData.originalMaterial;
          }
        }
      });
    };
  }, [scene]);

  // Handle pointer interactions
  const handlePointerMove = (event) => {
    if (!modelRef.current) return;

    event.stopPropagation();
    const mesh = event.object;

    if (mesh.userData?.isInteractive) {
      setHoveredPart(mesh);
      document.body.style.cursor = "pointer";
    } else {
      setHoveredPart(null);
      document.body.style.cursor = "default";
    }
  };

  const handlePointerOut = () => {
    setHoveredPart(null);
    document.body.style.cursor = "default";
  };

  const animateCamera = (startPos, targetPos, center, duration = 1000) => {
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth easing
      const eased = progress < 0.5 
        ? 2 * progress * progress 
        : -1 + (4 - 2 * progress) * progress;

      camera.position.lerpVectors(startPos, targetPos, eased);
      camera.lookAt(center);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  };

  const handleClick = (event) => {
    event.stopPropagation();
    if (!hoveredPart || !hoveredPart.userData?.isInteractive) return;

    const currentTime = Date.now();
    if (currentTime - lastClickTime < 300) return; // Prevent double clicks
    setLastClickTime(currentTime);

    // Toggle selection of the part
    if (selectedPart === hoveredPart) {
      setSelectedPart(null);
    } else {
      setSelectedPart(hoveredPart);
    }

    // Map mesh names to body parts
    const bodyPartMap = {
      "Body": "chest",
      "Torso": "chest",
      "Chest": "chest",
      "Head": "head",
      "Neck": "neck",
      "LeftArm": "upper arms",
      "RightArm": "upper arms",
      "LeftForearm": "forearms",
      "RightForearm": "forearms",
      "LeftLeg": "upper legs",
      "RightLeg": "upper legs",
      "LeftCalf": "lower legs",
      "RightCalf": "lower legs",
      "Abdomen": "abdominals",
      "Back": "back",
      "Shoulders": "shoulders"
    };

    // Get body part name from mesh name or use default
    const bodyPart = bodyPartMap[hoveredPart.name] || hoveredPart.name || "default";

    // Trigger callback with body part info
    if (onBodyPartClick) {
      onBodyPartClick(bodyPart);
    }
  };

  // Update materials based on hover and selection state
  useEffect(() => {
    if (!modelRef.current) return;

    scene.traverse((node) => {
      if (node.userData?.isInteractive) {
        if (node === selectedPart) {
          node.material = materials.selected.clone();
        } else if (node === hoveredPart) {
          node.material = materials.hover.clone();
        } else {
          node.material = materials.default.clone();
        }
      }
    });
  }, [hoveredPart, selectedPart]);

  return (
    <Center>
      <primitive
        ref={modelRef}
        object={scene}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      />
    </Center>
  );
}