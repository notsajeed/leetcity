"use client";

import { createContext, useContext, useRef, type MutableRefObject } from "react";
import * as THREE from "three";

interface SceneContextValue {
  sceneRef: MutableRefObject<THREE.Scene | null>;
}

const SceneContext = createContext<SceneContextValue>({
  sceneRef: { current: null },
});

export function SceneProvider({ children }: { children: React.ReactNode }) {
  const sceneRef = useRef<THREE.Scene | null>(null);
  return (
    <SceneContext.Provider value={{ sceneRef }}>
      {children}
    </SceneContext.Provider>
  );
}

export function useSharedScene() {
  return useContext(SceneContext);
}