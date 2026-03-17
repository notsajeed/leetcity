"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { useSharedScene } from "@/components/SceneContext";

interface FlyModeProps {
  onClose: () => void;
}

export default function FlyMode({ onClose }: FlyModeProps) {
  const mountRef  = useRef<HTMLDivElement>(null);
  const { sceneRef } = useSharedScene();
  const [hud, setHud]     = useState({ speed: 0, alt: 0, heading: 0, throttle: 62, pitch: 0 });
  const [locked, setLocked] = useState(false);
  const [ready, setReady]   = useState(false);

  const ff = "'JetBrains Mono','Fira Code',monospace";

  // Wait for scene to be available (R3F populates it after first render)
  useEffect(() => {
    if (sceneRef.current) { setReady(true); return; }
    const interval = setInterval(() => {
      if (sceneRef.current) { setReady(true); clearInterval(interval); }
    }, 50);
    return () => clearInterval(interval);
  }, [sceneRef]);

  useEffect(() => {
    if (!ready) return;
    const mount = mountRef.current;
    const scene = sceneRef.current;
    if (!mount || !scene) return;

    // ── Renderer ──────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = false; // off for perf in fly mode
    mount.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(65, mount.clientWidth / mount.clientHeight, 0.5, 3000);

    // ── Plane model ───────────────────────────────────────────────────────
    const planeGroup = new THREE.Group();
    const pivot = new THREE.Group();
    pivot.rotation.y = -Math.PI / 2; // nose +X → forward +Z
    planeGroup.add(pivot);

    const M = {
      metal:  new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.25, metalness: 0.8 }),
      dark:   new THREE.MeshStandardMaterial({ color: 0xb8b0a0, roughness: 0.35, metalness: 0.6 }),
      glass:  new THREE.MeshStandardMaterial({ color: 0x99bbee, roughness: 0.0,  metalness: 1.0, transparent: true, opacity: 0.65 }),
      red:    new THREE.MeshStandardMaterial({ color: 0xff1133 }),
      glow:   new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.9 }),
      stripe: new THREE.MeshBasicMaterial({ color: 0xff1133, transparent: true, opacity: 0.55 }),
    };

    // Fuselage
    const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.45, 8, 12), M.metal);
    fuselage.rotation.z = Math.PI / 2;
    pivot.add(fuselage);

    // Nose
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.6, 3.2, 12), M.metal);
    nose.rotation.z = -Math.PI / 2;
    nose.position.set(5.6, 0, 0);
    pivot.add(nose);

    // Cockpit
    const cock = new THREE.Mesh(
      new THREE.SphereGeometry(0.65, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.52),
      M.glass
    );
    cock.rotation.z = Math.PI / 2;
    cock.position.set(2.5, 0.3, 0);
    pivot.add(cock);

    // Main wings (tapered using BufferGeometry for nicer shape)
    const wingShape = () => {
      const g = new THREE.BufferGeometry();
      const v = new Float32Array([
        // root front, root back, tip front, tip back
         0.5,  0,  1.3,   // 0 root leading
        -0.8,  0,  1.3,   // 1 root trailing
         0.2,  0,  6.0,   // 2 tip leading
        -0.5,  0,  6.0,   // 3 tip trailing
         0.5,  0, -1.3,   // 4 root leading (other side mirror)
        -0.8,  0, -1.3,   // 5 root trailing
         0.2,  0, -6.0,   // 6 tip leading
        -0.5,  0, -6.0,   // 7 tip trailing
      ]);
      const idx = new Uint16Array([
        0,1,2, 1,3,2,  // right wing
        4,6,5, 5,6,7,  // left wing
      ]);
      g.setAttribute("position", new THREE.BufferAttribute(v, 3));
      g.setIndex(new THREE.BufferAttribute(idx, 1));
      g.computeVertexNormals();
      return g;
    };
    const wings = new THREE.Mesh(wingShape(), M.dark);
    wings.position.set(0.3, 0, 0);
    pivot.add(wings);

    // Wing tip lights
    [-1, 1].forEach((s) => {
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.25, 1.2), s > 0 ? M.red : new THREE.MeshStandardMaterial({ color: 0x00aaff }));
      tip.position.set(0.2, 0.1, s * 6.1);
      pivot.add(tip);
    });

    // Livery stripe
    const stripeM = new THREE.Mesh(new THREE.CylinderGeometry(0.61, 0.46, 5.5, 12), M.stripe);
    stripeM.rotation.z = Math.PI / 2;
    stripeM.position.set(1.0, 0, 0);
    pivot.add(stripeM);

    // V-tail (more realistic)
    [[1], [-1]].forEach(([s]) => {
      const vt = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.8, 1.3), M.dark);
      vt.position.set(-3.6, s > 0 ? 1.1 : -0.2, s * 0.6);
      vt.rotation.z = s > 0 ? -0.25 : 0.1;
      pivot.add(vt);
    });

    // H-stabiliser
    const hStab = new THREE.Mesh(new THREE.BoxGeometry(0.15, 5, 1.0), M.dark);
    hStab.position.set(-3.6, 0, 0);
    pivot.add(hStab);

    // Engine nacelle
    const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.55, 2.5, 12), M.metal);
    nacelle.rotation.z = Math.PI / 2;
    nacelle.position.set(-3.5, 0, 0);
    pivot.add(nacelle);

    // Intake ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.09, 10, 16), M.metal);
    ring.rotation.y = Math.PI / 2;
    ring.position.set(-4.7, 0, 0);
    pivot.add(ring);

    // Engine glow
    const eGlow = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 10), M.glow);
    eGlow.position.set(-4.85, 0, 0);
    pivot.add(eGlow);

    // Engine point light
    const eLight = new THREE.PointLight(0xff6600, 1.5, 12);
    eLight.position.set(-4.85, 0, 0);
    pivot.add(eLight);

    planeGroup.position.set(0, 40, 0);
    scene.add(planeGroup);

    // ── Exhaust particles ──────────────────────────────────────────────────
    const PCOUNT = 80;
    type EP = { mesh: THREE.Mesh; life: number; maxLife: number; vel: THREE.Vector3 };
    const exhaustP: EP[] = [];
    for (let i = 0; i < PCOUNT; i++) {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 4, 4),
        new THREE.MeshBasicMaterial({ color: 0xff7700, transparent: true, opacity: 0 })
      );
      m.visible = false;
      scene.add(m);
      exhaustP.push({ mesh: m, life: 0, maxLife: 1, vel: new THREE.Vector3() });
    }
    let pIdx = 0;

    // ── Flight state ───────────────────────────────────────────────────────
    // yaw/pitch are cumulative angles; roll is a visual-only lean
    const S = {
      pos:      new THREE.Vector3(0, 40, -30),
      vel:      new THREE.Vector3(0, 0, 0),
      yaw:      0,    // radians, world Y
      pitch:    0,    // radians, nose up = negative
      roll:     0,    // visual lean
      yawRate:  0,
      pitchRate:0,
      throttle: 0.62,
      speed:    0,
    };

    // ── Input ──────────────────────────────────────────────────────────────
    const keys   = new Set<string>();
    const mouse  = { dx: 0, dy: 0 };
    let   mouseActive = false;

    const onKD = (e: KeyboardEvent) => {
      keys.add(e.key);
      if (e.key === "Escape") onClose();
    };
    const onKU  = (e: KeyboardEvent) => keys.delete(e.key);
    const onMM  = (e: MouseEvent) => {
      if (document.pointerLockElement === mount) {
        mouse.dx += e.movementX;
        mouse.dy += e.movementY;
        mouseActive = true;
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      S.throttle = THREE.MathUtils.clamp(S.throttle - e.deltaY * 0.0003, 0.08, 1.0);
    };
    const onPLC = () => {
      const lk = document.pointerLockElement === mount;
      setLocked(lk);
      if (!lk) mouseActive = false;
    };
    const onClickMount = () => mount.requestPointerLock();

    window.addEventListener("keydown",  onKD);
    window.addEventListener("keyup",    onKU);
    mount.addEventListener("mousemove", onMM);
    mount.addEventListener("click",     onClickMount);
    mount.addEventListener("wheel",     onWheel, { passive: false });
    document.addEventListener("pointerlockchange", onPLC);

    // ── Camera spring ──────────────────────────────────────────────────────
    const camOffset  = new THREE.Vector3();
    const camLook    = new THREE.Vector3();
    const camPosSmooth = new THREE.Vector3(0, 50, 20);
    const camLookSmooth = new THREE.Vector3();

    // ── Animation ─────────────────────────────────────────────────────────
    let frameN = 0;
    let rafId  = 0;
    const TURN_ACCEL  = 0.0018;  // how fast yaw rate builds from keys
    const TURN_DAMP   = 0.82;    // friction on yaw rate
    const PITCH_ACCEL = 0.0014;
    const PITCH_DAMP  = 0.80;
    const MOUSE_YAW   = 0.0025;
    const MOUSE_PITCH = 0.0020;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      frameN++;

      const dt = 1; // normalized per-frame

      // ── Throttle ──
      if (keys.has("q") || keys.has("Q") || keys.has("Shift"))
        S.throttle = Math.max(0.08, S.throttle - 0.012);
      if (keys.has("e") || keys.has("E") || keys.has(" "))
        S.throttle = Math.min(1.0,  S.throttle + 0.012);

      // ── Yaw (keyboard builds rate, mouse is direct) ──
      if (keys.has("ArrowLeft")  || keys.has("a") || keys.has("A")) S.yawRate -= TURN_ACCEL;
      if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) S.yawRate += TURN_ACCEL;
      S.yawRate *= TURN_DAMP;
      // clamp yaw rate so it doesn't spin wildly
      S.yawRate = THREE.MathUtils.clamp(S.yawRate, -0.04, 0.04);
      S.yaw += S.yawRate;

      // ── Pitch (keyboard) ──
      if (keys.has("ArrowUp")   || keys.has("w") || keys.has("W")) S.pitchRate -= PITCH_ACCEL;
      if (keys.has("ArrowDown") || keys.has("s") || keys.has("S")) S.pitchRate += PITCH_ACCEL;
      S.pitchRate *= PITCH_DAMP;
      S.pitchRate = THREE.MathUtils.clamp(S.pitchRate, -0.035, 0.035);
      S.pitch += S.pitchRate;

      // ── Mouse look (direct, no accumulation issues) ──
      if (mouseActive) {
        S.yaw   += mouse.dx * MOUSE_YAW;
        S.pitch += mouse.dy * MOUSE_PITCH;
        mouse.dx = 0;
        mouse.dy = 0;
      }

      S.pitch = THREE.MathUtils.clamp(S.pitch, -0.72, 0.72);

      // ── Physics ──
      // Forward vector from yaw + pitch
      const fwd = new THREE.Vector3(
        Math.sin(S.yaw)  * Math.cos(S.pitch),
        -Math.sin(S.pitch),
        Math.cos(S.yaw)  * Math.cos(S.pitch)
      );

      const targetSpd = S.throttle * 1.4 + 0.1;
      S.speed = THREE.MathUtils.lerp(S.speed, targetSpd, 0.04);

      const targetVel = fwd.clone().multiplyScalar(S.speed);
      S.vel.lerp(targetVel, 0.07);

      // Gravity (reduced by throttle-based lift)
      const lift = S.throttle * 0.006;
      S.vel.y -= Math.max(0, 0.004 - lift);

      S.pos.addScaledVector(S.vel, dt);

      // Ground + ceiling clamp
      if (S.pos.y < 4)   { S.pos.y = 4;   S.vel.y =  Math.abs(S.vel.y) * 0.25; }
      if (S.pos.y > 420) { S.pos.y = 420;  S.vel.y = -Math.abs(S.vel.y) * 0.25; }

      // ── Plane visual transform ──
      planeGroup.position.copy(S.pos);

      // Base orientation: yaw around world Y, then pitch
      const qYaw   = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -S.yaw);
      const right  = new THREE.Vector3(Math.cos(S.yaw), 0, -Math.sin(S.yaw));
      const qPitch = new THREE.Quaternion().setFromAxisAngle(right, S.pitch);
      planeGroup.quaternion.multiplyQuaternions(qYaw, qPitch);

      // Roll: leans into turns (yaw rate) + slight pitch coupling
      const targetRoll = -S.yawRate * 18 + S.pitchRate * 3;
      S.roll = THREE.MathUtils.lerp(S.roll, targetRoll, 0.12);
      const fwdLocal = new THREE.Vector3(0, 0, 1).applyQuaternion(planeGroup.quaternion);
      const qRoll = new THREE.Quaternion().setFromAxisAngle(fwdLocal, S.roll);
      planeGroup.quaternion.premultiply(qRoll);

      // Wing flex (very subtle)
      wings.rotation.x = Math.sin(frameN * 0.03) * 0.012 + Math.abs(S.yawRate) * 2;

      // ── Engine glow ──
      const gPulse = 0.4 + S.throttle * 0.6 + Math.sin(frameN * 0.18) * 0.1;
      (eGlow.material as THREE.MeshBasicMaterial).opacity = gPulse;
      eGlow.scale.setScalar(0.6 + S.throttle * 0.85);
      eLight.intensity = 0.8 + S.throttle * 1.8 + Math.sin(frameN * 0.18) * 0.3;

      // ── Exhaust ──
      if (frameN % 2 === 0 && S.throttle > 0.1) {
        const ep   = exhaustP[pIdx % PCOUNT];
        pIdx++;
        // world-space position of engine exit
        const engineLocal = new THREE.Vector3(-4.85, 0, 0);
        // after pivot rotation, local +X is world -Z for yaw=0
        const engineWorld = engineLocal.clone()
          .applyQuaternion(pivot.quaternion)
          .add(planeGroup.position);

        ep.mesh.position.copy(engineWorld);
        ep.life    = 1.0;
        ep.maxLife = 0.7 + Math.random() * 0.5;

        // velocity = opposite of forward + spread
        const spread = 0.12;
        ep.vel.set(
          -fwd.x * S.speed * 0.6 + (Math.random() - 0.5) * spread,
          -fwd.y * S.speed * 0.6 + (Math.random() - 0.5) * spread * 0.5,
          -fwd.z * S.speed * 0.6 + (Math.random() - 0.5) * spread
        );
        ep.mesh.visible = true;
      }
      exhaustP.forEach((ep) => {
        if (ep.life > 0) {
          ep.life -= 0.03 / ep.maxLife;
          ep.mesh.position.addScaledVector(ep.vel, dt);
          ep.vel.multiplyScalar(0.91);
          const mat = ep.mesh.material as THREE.MeshBasicMaterial;
          mat.opacity = ep.life * 0.55 * S.throttle;
          ep.mesh.scale.setScalar(0.8 + (1 - ep.life) * 3.5);
          if (ep.life <= 0) ep.mesh.visible = false;
        }
      });

      // ── Camera — spring third-person ──
      const speedFactor = S.speed / 1.5;
      const camDist   = 16 + speedFactor * 6;
      const camUp     = 5  + S.pitch * -4;  // look higher when nose up

      // Ideal camera: behind and above plane
      const behindDir = new THREE.Vector3(-Math.sin(S.yaw), 0, -Math.cos(S.yaw));
      camOffset.copy(S.pos)
        .addScaledVector(behindDir, camDist)
        .add(new THREE.Vector3(0, camUp, 0));

      // Look ahead of the plane
      camLook.copy(S.pos).addScaledVector(
        new THREE.Vector3(Math.sin(S.yaw), -S.pitch * 0.5, Math.cos(S.yaw)),
        12
      );

      camPosSmooth.lerp(camOffset, 0.08);
      camLookSmooth.lerp(camLook, 0.10);

      camera.position.copy(camPosSmooth);
      camera.lookAt(camLookSmooth);

      // Dynamic FOV for speed feel
      const targetFOV = 60 + speedFactor * 12;
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFOV, 0.06);
      camera.updateProjectionMatrix();

      // ── HUD ──
      if (frameN % 4 === 0) {
        setHud({
          speed:    Math.round(S.speed * 95),
          alt:      Math.round(S.pos.y),
          heading:  Math.round((((-S.yaw * 180) / Math.PI) % 360 + 360) % 360),
          throttle: Math.round(S.throttle * 100),
          pitch:    Math.round(-S.pitch * 57), // degrees
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown",  onKD);
      window.removeEventListener("keyup",    onKU);
      window.removeEventListener("resize",   onResize);
      mount.removeEventListener("mousemove", onMM);
      mount.removeEventListener("click",     onClickMount);
      mount.removeEventListener("wheel",     onWheel);
      document.removeEventListener("pointerlockchange", onPLC);
      if (document.pointerLockElement === mount) document.exitPointerLock();
      // Clean up from shared scene
      scene.remove(planeGroup);
      exhaustP.forEach((ep) => scene.remove(ep.mesh));
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [ready, onClose, sceneRef]);

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 40, overflow: "hidden", fontFamily: ff }}>

      {/* Canvas mount — fills everything */}
      <div
        ref={mountRef}
        style={{ width: "100%", height: "100%", cursor: locked ? "none" : "crosshair" }}
      />

      {/* ── TOP HUD ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 41,
        background: "linear-gradient(180deg,rgba(2,7,18,0.95) 0%,transparent 100%)",
        padding: "14px 22px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        pointerEvents: "auto",
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ff1133",
            boxShadow: "0 0 8px #ff1133", animation: "blink 1.2s ease-in-out infinite" }} />
          <span style={{ color: "#ff1133", fontWeight: 800, fontSize: "10px", letterSpacing: "0.22em" }}>
            FLY MODE
          </span>
        </div>

        {/* Gauges */}
        <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
          <Gauge label="SPD" value={`${hud.speed}`} unit="KTS" warn={hud.speed > 120} />
          <Gauge label="ALT" value={`${hud.alt}`}   unit="M"   warn={hud.alt < 10} />
          <Gauge label="HDG" value={`${hud.heading}`} unit="°" />
          <Gauge label="PCH" value={`${hud.pitch > 0 ? "+" : ""}${hud.pitch}`} unit="°" warn={Math.abs(hud.pitch) > 35} />
          <Gauge label="THR" value={`${hud.throttle}`} unit="%" accent={
            hud.throttle > 85 ? "#ff4400" : hud.throttle < 20 ? "#ffaa00" : undefined
          } />
        </div>

        {/* Exit */}
        <button onClick={onClose} style={{
          background: "rgba(255,17,51,0.08)", border: "1px solid rgba(255,17,51,0.32)",
          borderRadius: "4px", color: "#ff1133", fontSize: "9px", fontWeight: 800,
          letterSpacing: "0.18em", padding: "7px 16px", cursor: "pointer", fontFamily: ff,
          transition: "background 0.15s",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,17,51,0.18)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,17,51,0.08)")}
        >
          EXIT
        </button>
      </div>

      {/* ── LEFT — Throttle bar ── */}
      <div style={{
        position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)",
        zIndex: 41, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
        pointerEvents: "none",
      }}>
        <span style={{ color: "#440011", fontSize: "8px", letterSpacing: "0.2em" }}>THR</span>
        <div style={{
          width: "10px", height: "120px",
          background: "rgba(255,17,51,0.07)", border: "1px solid rgba(255,17,51,0.18)",
          borderRadius: "3px", overflow: "hidden", display: "flex",
          flexDirection: "column", justifyContent: "flex-end",
        }}>
          <div style={{
            width: "100%", height: `${hud.throttle}%`,
            background: hud.throttle > 85 ? "#ff4400" : "#ff1133",
            transition: "height 0.08s ease, background 0.2s",
          }} />
        </div>
        <span style={{ color: "#ff3344", fontSize: "9px", fontWeight: 700 }}>{hud.throttle}%</span>
      </div>

      {/* ── RIGHT — Altitude bar ── */}
      <div style={{
        position: "absolute", right: "20px", top: "50%", transform: "translateY(-50%)",
        zIndex: 41, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
        pointerEvents: "none",
      }}>
        <span style={{ color: "#440011", fontSize: "8px", letterSpacing: "0.2em" }}>ALT</span>
        <div style={{
          width: "10px", height: "120px",
          background: "rgba(255,17,51,0.07)", border: "1px solid rgba(255,17,51,0.18)",
          borderRadius: "3px", overflow: "hidden", display: "flex",
          flexDirection: "column", justifyContent: "flex-end",
        }}>
          <div style={{
            width: "100%", height: `${Math.min(100, (hud.alt / 250) * 100)}%`,
            background: hud.alt < 10 ? "#ffaa00" : "#ff1133",
            transition: "height 0.08s ease, background 0.2s",
          }} />
        </div>
        <span style={{ color: "#ff3344", fontSize: "9px", fontWeight: 700 }}>{hud.alt}m</span>
      </div>

      {/* ── BOTTOM — Controls ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 41,
        background: "linear-gradient(0deg,rgba(2,7,18,0.92) 0%,transparent 100%)",
        padding: "14px 22px",
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        pointerEvents: "none",
      }}>
        <ControlsLegend />

        {/* Artificial horizon */}
        <ArtificialHorizon pitch={hud.pitch} roll={-hud.pitch * 0.3} />
      </div>

      {/* ── Pointer lock prompt ── */}
      {!locked && ready && (
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          zIndex: 42, textAlign: "center", pointerEvents: "none",
        }}>
          <div style={{
            border: "1px solid rgba(255,17,51,0.25)", borderRadius: "8px",
            padding: "20px 32px", background: "rgba(2,7,18,0.75)",
          }}>
            <div style={{ color: "#660011", fontSize: "10px", letterSpacing: "0.22em", marginBottom: "6px" }}>
              CLICK TO LOCK MOUSE
            </div>
            <div style={{ color: "#330008", fontSize: "8px", letterSpacing: "0.15em" }}>
              USE KEYS TO FLY WITHOUT LOCK
            </div>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {!ready && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", background: "#020712", zIndex: 42,
        }}>
          <span style={{ color: "#330010", fontSize: "10px", letterSpacing: "0.22em" }}>
            LOADING CITY...
          </span>
        </div>
      )}

      {/* ── Crosshair ── */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)", pointerEvents: "none", zIndex: 41,
      }}>
        <svg width="32" height="32" viewBox="0 0 32 32" opacity="0.3">
          <circle cx="16" cy="16" r="5" stroke="#ff1133" strokeWidth="0.8" fill="none"/>
          <line x1="16" y1="0"  x2="16" y2="9"  stroke="#ff1133" strokeWidth="0.8"/>
          <line x1="16" y1="23" x2="16" y2="32" stroke="#ff1133" strokeWidth="0.8"/>
          <line x1="0"  y1="16" x2="9"  y2="16" stroke="#ff1133" strokeWidth="0.8"/>
          <line x1="23" y1="16" x2="32" y2="16" stroke="#ff1133" strokeWidth="0.8"/>
        </svg>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
      `}</style>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Gauge({ label, value, unit, warn, accent }: {
  label: string; value: string; unit: string; warn?: boolean; accent?: string;
}) {
  const ff = "'JetBrains Mono','Fira Code',monospace";
  const col = accent ?? (warn ? "#ffaa00" : "#ff3344");
  return (
    <div style={{ textAlign: "center", minWidth: "48px" }}>
      <div style={{ color: "#440011", fontSize: "7px", letterSpacing: "0.22em", fontFamily: ff, marginBottom: "2px" }}>{label}</div>
      <div style={{ color: col, fontSize: "13px", fontWeight: 700, letterSpacing: "0.06em", fontFamily: ff, lineHeight: 1 }}>{value}</div>
      <div style={{ color: "#330010", fontSize: "7px", letterSpacing: "0.1em", fontFamily: ff }}>{unit}</div>
    </div>
  );
}

function ControlsLegend() {
  const ff = "'JetBrains Mono','Fira Code',monospace";
  const rows: [string, string][] = [
    ["W / ↑",    "CLIMB"],
    ["S / ↓",    "DIVE"],
    ["A / ←",    "TURN LEFT"],
    ["D / →",    "TURN RIGHT"],
    ["E / SPACE","THROTTLE +"],
    ["Q / SHIFT","THROTTLE −"],
    ["SCROLL",   "THROTTLE"],
    ["MOUSE",    "LOOK"],
    ["ESC",      "EXIT"],
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto auto", gap: "1px 12px", fontFamily: ff }}>
      {rows.map(([k, v], i) => (
        <>
          <span key={`k${i}`} style={{ color: "#2a0008", fontSize: "8px", letterSpacing: "0.1em" }}>{k}</span>
          <span key={`v${i}`} style={{ color: "#1a0005", fontSize: "8px", letterSpacing: "0.1em" }}>{v}</span>
        </>
      ))}
    </div>
  );
}

function ArtificialHorizon({ pitch, roll }: { pitch: number; roll: number }) {
  const size = 72;
  const cx = size / 2;
  const cy = size / 2;
  const pitchPx = pitch * 0.9; // pixels per degree
  return (
    <div style={{ flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ opacity: 0.75 }}>
        <defs>
          <clipPath id="hClip">
            <circle cx={cx} cy={cy} r={cx - 3} />
          </clipPath>
        </defs>
        {/* Sky */}
        <circle cx={cx} cy={cy} r={cx - 3} fill="#041020" />
        {/* Horizon band — shifts with pitch */}
        <g clipPath="url(#hClip)" transform={`rotate(${roll},${cx},${cy})`}>
          <rect x={0} y={cy + pitchPx} width={size} height={size} fill="#200808" opacity="0.9"/>
          {/* Horizon line */}
          <line x1={0} y1={cy + pitchPx} x2={size} y2={cy + pitchPx} stroke="#ff1133" strokeWidth="0.8" opacity="0.9"/>
          {/* Pitch marks */}
          {[-20, -10, 10, 20].map((d) => (
            <line key={d}
              x1={cx - 8} y1={cy + pitchPx - d * 0.9}
              x2={cx + 8} y2={cy + pitchPx - d * 0.9}
              stroke="#660011" strokeWidth="0.6" opacity="0.7"
            />
          ))}
        </g>
        {/* Outer ring */}
        <circle cx={cx} cy={cy} r={cx - 3} fill="none" stroke="#330010" strokeWidth="1.2" />
        {/* Fixed aircraft symbol */}
        <line x1={cx - 12} y1={cy} x2={cx - 4} y2={cy} stroke="#ff3344" strokeWidth="1.5" />
        <line x1={cx + 4}  y1={cy} x2={cx + 12} y2={cy} stroke="#ff3344" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r="1.5" fill="#ff3344" />
      </svg>
    </div>
  );
}