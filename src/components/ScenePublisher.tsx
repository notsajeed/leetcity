"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useSharedScene } from "@/context/SceneContext";

/**
 * Drop this anywhere inside your <Canvas>.
 * It grabs the R3F-managed scene via useThree() and publishes
 * it into SceneContext so FlyMode can read it from outside Canvas.
 * Renders nothing.
 */
export default function ScenePublisher() {
  const { scene } = useThree();
  const { sceneRef } = useSharedScene();

  useEffect(() => {
    sceneRef.current = scene;
    return () => {
      sceneRef.current = null;
    };
  }, [scene, sceneRef]);

  return null;
}