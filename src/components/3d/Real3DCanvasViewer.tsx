'use client';

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCw, ZoomIn, Sun, Sparkles, Camera, RefreshCw } from 'lucide-react';

export interface Real3DCanvasViewerHandle {
  captureSnapshot: () => string | null;
  resetCamera: () => void;
  toggleAutoRotate: () => void;
}

interface Real3DCanvasViewerProps {
  modelUrl: string;
  modelType?: 'garment' | 'mannequin' | 'shoe' | 'accessory';
  tintColorHex?: string;
  autoRotateDefault?: boolean;
  showControlsBar?: boolean;
  className?: string;
  onLoaded?: () => void;
}

type LightingPreset = 'atelier' | 'runway' | 'studio';

export const Real3DCanvasViewer = forwardRef<Real3DCanvasViewerHandle, Real3DCanvasViewerProps>(
  function Real3DCanvasViewer(
    {
      modelUrl,
      modelType = 'garment',
      tintColorHex,
      autoRotateDefault = true,
      showControlsBar = true,
      className = '',
      onLoaded,
    },
    ref
  ) {
    const mountRef = useRef<HTMLDivElement>(null);
    const [loadingProgress, setLoadingProgress] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isAutoRotating, setIsAutoRotating] = useState<boolean>(autoRotateDefault);
    const [lightingPreset, setLightingPreset] = useState<LightingPreset>('atelier');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Three.js internal references
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const currentModelGroupRef = useRef<THREE.Group | null>(null);
    const lightsRef = useRef<{
      ambient: THREE.AmbientLight;
      key: THREE.DirectionalLight;
      fill: THREE.DirectionalLight;
      rim: THREE.DirectionalLight;
    } | null>(null);

    const initialCameraPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.2, 3.2));
    const initialControlsTarget = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.9, 0));

    // Expose imperative handle for parent components
    useImperativeHandle(ref, () => ({
      captureSnapshot: () => {
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return null;
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        return rendererRef.current.domElement.toDataURL('image/png');
      },
      resetCamera: () => {
        if (!cameraRef.current || !controlsRef.current) return;
        cameraRef.current.position.copy(initialCameraPos.current);
        controlsRef.current.target.copy(initialControlsTarget.current);
        controlsRef.current.update();
      },
      toggleAutoRotate: () => {
        setIsAutoRotating((prev) => !prev);
      },
    }));

    // Update auto-rotate on controls
    useEffect(() => {
      if (controlsRef.current) {
        controlsRef.current.autoRotate = isAutoRotating;
      }
    }, [isAutoRotating]);

    // Update lighting presets
    useEffect(() => {
      if (!lightsRef.current) return;
      const { ambient, key, fill, rim } = lightsRef.current;

      if (lightingPreset === 'atelier') {
        // Luxury warm atelier: golden key, soft rim
        ambient.color.setHex(0x282622);
        ambient.intensity = 1.0;
        key.color.setHex(0xfff6e8);
        key.intensity = 2.4;
        fill.color.setHex(0xcad4e0);
        fill.intensity = 1.0;
        rim.color.setHex(0xc4972e); // Ìrísí signature gold rim
        rim.intensity = 2.0;
      } else if (lightingPreset === 'runway') {
        // Dramatic high-contrast spotlight
        ambient.color.setHex(0x111111);
        ambient.intensity = 0.6;
        key.color.setHex(0xffffff);
        key.intensity = 3.6;
        fill.color.setHex(0x667788);
        fill.intensity = 0.6;
        rim.color.setHex(0xe6c367);
        rim.intensity = 2.8;
      } else {
        // Studio Neutral: clean daylight photoshoot
        ambient.color.setHex(0x333333);
        ambient.intensity = 1.2;
        key.color.setHex(0xffffff);
        key.intensity = 2.2;
        fill.color.setHex(0xffffff);
        fill.intensity = 1.4;
        rim.color.setHex(0xffffff);
        rim.intensity = 1.2;
      }
    }, [lightingPreset]);

    // Apply material color tint if provided
    useEffect(() => {
      if (!currentModelGroupRef.current || !tintColorHex) return;
      const parsedColor = new THREE.Color(tintColorHex);

      currentModelGroupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => {
              if (m && 'color' in m && !(m.name && m.name.toLowerCase().includes('skin'))) {
                (m as any).color.copy(parsedColor);
              }
            });
          }
        }
      });
    }, [tintColorHex]);

    // Initialize Three.js Scene
    useEffect(() => {
      const container = mountRef.current;
      if (!container) return;

      let animationFrameId: number;
      const width = container.clientWidth || 400;
      const height = container.clientHeight || 500;

      // 1. Scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // 2. Camera (Telephoto 36° fashion focal length)
      const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
      camera.position.copy(initialCameraPos.current);
      cameraRef.current = camera;

      // 3. Renderer
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      rendererRef.current = renderer;

      // Append DOM canvas
      container.appendChild(renderer.domElement);

      // 4. OrbitControls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enablePan = false;
      controls.minDistance = 0.8;
      controls.maxDistance = 6.0;
      controls.minPolarAngle = Math.PI / 6; // Limit top angle
      controls.maxPolarAngle = Math.PI / 2.05; // Do not go below floor
      controls.target.copy(initialControlsTarget.current);
      controls.autoRotate = isAutoRotating;
      controls.autoRotateSpeed = 1.4;
      controlsRef.current = controls;

      // Pause auto-rotation temporarily when patron touches the model
      controls.addEventListener('start', () => {
        controls.autoRotate = false;
      });
      controls.addEventListener('end', () => {
        controls.autoRotate = isAutoRotating;
      });

      // 5. Lights
      const ambientLight = new THREE.AmbientLight(0x282622, 1.0);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xfff6e8, 2.4);
      keyLight.position.set(3, 4, 3.5);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 15;
      keyLight.shadow.bias = -0.0005;
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0xcad4e0, 1.0);
      fillLight.position.set(-3.5, 2.5, 2);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0xc4972e, 2.0);
      rimLight.position.set(0, 3, -3.5);
      scene.add(rimLight);

      lightsRef.current = { ambient: ambientLight, key: keyLight, fill: fillLight, rim: rimLight };

      // 6. Atelier Dais Pedestal & Soft Floor Shadow
      const daisRadius = modelType === 'shoe' || modelType === 'accessory' ? 0.7 : 1.1;
      const daisGeometry = new THREE.CylinderGeometry(daisRadius, daisRadius + 0.05, 0.05, 48);
      const daisMaterial = new THREE.MeshStandardMaterial({
        color: 0x18181b,
        metalness: 0.3,
        roughness: 0.7,
      });
      const daisMesh = new THREE.Mesh(daisGeometry, daisMaterial);
      daisMesh.position.y = -0.025;
      daisMesh.receiveShadow = true;
      scene.add(daisMesh);

      // Gold Brass Edge Ring for luxury aesthetic
      const ringGeometry = new THREE.TorusGeometry(daisRadius, 0.012, 16, 64);
      const ringMaterial = new THREE.MeshStandardMaterial({
        color: 0xc4972e,
        metalness: 0.85,
        roughness: 0.25,
      });
      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = 0.001;
      scene.add(ringMesh);

      // Soft Shadow Catcher Plane
      const shadowPlaneGeo = new THREE.PlaneGeometry(6, 6);
      const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.35 });
      const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.y = -0.051;
      shadowPlane.receiveShadow = true;
      scene.add(shadowPlane);

      // 7. Render Loop
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      // 8. Responsive Resize Observer
      const resizeObserver = new ResizeObserver((entries) => {
        if (!entries || entries.length === 0) return;
        const entry = entries[0];
        const newWidth = entry.contentRect.width;
        const newHeight = entry.contentRect.height;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      });
      resizeObserver.observe(container);

      // Cleanup
      return () => {
        cancelAnimationFrame(animationFrameId);
        resizeObserver.disconnect();
        controls.dispose();
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
    }, [modelType]);

    // Load Model on URL change
    useEffect(() => {
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      if (!scene || !camera || !controls || !modelUrl) return;

      setIsLoading(true);
      setLoadingProgress(0);
      setErrorMessage(null);

      // Remove existing model if present
      if (currentModelGroupRef.current) {
        scene.remove(currentModelGroupRef.current);
        currentModelGroupRef.current.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.geometry?.dispose();
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => m.dispose());
            } else if (mesh.material) {
              mesh.material.dispose();
            }
          }
        });
        currentModelGroupRef.current = null;
      }

      const loader = new GLTFLoader();

      loader.load(
        modelUrl,
        (gltf) => {
          const model = gltf.scene;

          // Enable shadows on all child meshes
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          // Calculate bounding box to normalize scale and center precisely
          const box = new THREE.Box3().setFromObject(model);
          const size = new THREE.Vector3();
          box.getSize(size);
          const center = new THREE.Vector3();
          box.getCenter(center);

          // Target heights depending on garment vs mannequin vs shoe
          const targetHeight =
            modelType === 'shoe'
              ? 0.4
              : modelType === 'accessory'
              ? 0.35
              : modelType === 'garment'
              ? 1.3
              : 1.8;

          const maxDim = Math.max(size.x, size.y, size.z);
          const scaleFactor = targetHeight / (maxDim || 1);
          model.scale.setScalar(scaleFactor);

          // Recompute after scaling to place on dais base (y = 0)
          box.setFromObject(model);
          box.getCenter(center);
          box.getSize(size);

          model.position.x = -center.x;
          model.position.z = -center.z;
          model.position.y = -box.min.y; // Sit directly on top of dais

          // Configure camera framing
          const modelHeight = size.y;
          const targetY = modelHeight * 0.55;
          const camDistance = modelType === 'shoe' || modelType === 'accessory' ? 1.4 : modelHeight * 1.85;

          initialControlsTarget.current.set(0, targetY, 0);
          initialCameraPos.current.set(0, targetY + 0.15, camDistance);

          controls.target.copy(initialControlsTarget.current);
          camera.position.copy(initialCameraPos.current);
          controls.update();

          scene.add(model);
          currentModelGroupRef.current = model;

          setIsLoading(false);
          setLoadingProgress(100);
          if (onLoaded) onLoaded();
        },
        (xhr) => {
          if (xhr.total > 0) {
            setLoadingProgress(Math.min(99, Math.round((xhr.loaded / xhr.total) * 100)));
          } else {
            setLoadingProgress((prev) => Math.min(90, prev + 10));
          }
        },
        (err) => {
          console.error('Error loading 3D GLTF asset:', err);
          setIsLoading(false);
          setErrorMessage('Could not load 3D mesh file.');
        }
      );
    }, [modelUrl, modelType, onLoaded]);

    return (
      <div className={`relative w-full h-full overflow-hidden select-none bg-gradient-to-b from-black/20 via-transparent to-black/60 ${className}`}>
        {/* WebGL Canvas Container */}
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing touch-none" />

        {/* Loading Progress HUD */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-md z-30 transition-opacity">
            <div className="relative flex flex-col items-center gap-3">
              <div className="relative h-14 w-14">
                <div className="absolute inset-0 rounded-full border-2 border-[var(--gold-accent)]/20 animate-ping" />
                <div className="h-14 w-14 rounded-full border-2 border-t-[var(--gold-accent)] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-[var(--gold-accent)] animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="font-mono-luxury text-xs font-bold uppercase tracking-widest text-white">
                  Loading 3D Model
                </p>
                <p className="font-mono-luxury text-[10px] text-[var(--gold-accent)] font-semibold">
                  {loadingProgress}% Hardware Accelerated
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Fallback */}
        {errorMessage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-4 z-30 text-center">
            <p className="text-xs font-mono-luxury text-rose-400 font-bold mb-2">{errorMessage}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-1.5 rounded-full bg-white/10 text-white text-xs font-mono-luxury hover:bg-white/20"
            >
              Retry
            </button>
          </div>
        )}

        {/* Floating 3D Interaction Toolbar */}
        {showControlsBar && !isLoading && (
          <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
            {/* Auto-Rotate Turntable Toggle */}
            <button
              type="button"
              onClick={() => setIsAutoRotating(!isAutoRotating)}
              className={`p-2.5 rounded-full backdrop-blur-xl border transition-all shadow-lg cursor-pointer ${
                isAutoRotating
                  ? 'bg-[var(--gold-accent)] text-black border-[var(--gold-accent)]'
                  : 'bg-black/60 text-white/80 border-white/15 hover:text-white'
              }`}
              title={isAutoRotating ? 'Pause 360° Turntable' : 'Auto 360° Turntable'}
              aria-label="Toggle Turntable"
            >
              <RotateCw className={`h-4 w-4 ${isAutoRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            </button>

            {/* Reset Camera Framing */}
            <button
              type="button"
              onClick={() => {
                if (cameraRef.current && controlsRef.current) {
                  cameraRef.current.position.copy(initialCameraPos.current);
                  controlsRef.current.target.copy(initialControlsTarget.current);
                  controlsRef.current.update();
                }
              }}
              className="p-2.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-white/80 hover:text-white shadow-lg cursor-pointer active:scale-90 transition-transform"
              title="Reset View"
              aria-label="Reset Camera"
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            {/* Studio Lighting Preset Cycler */}
            <button
              type="button"
              onClick={() => {
                setLightingPreset((prev) =>
                  prev === 'atelier' ? 'runway' : prev === 'runway' ? 'studio' : 'atelier'
                );
              }}
              className="p-2.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-white/80 hover:text-white shadow-lg cursor-pointer active:scale-90 transition-transform"
              title={`Lighting: ${lightingPreset}`}
              aria-label="Cycle Lighting"
            >
              <Sun className="h-4 w-4 text-[var(--gold-accent)]" />
            </button>
          </div>
        )}

        {/* Bottom Floating Hint */}
        <div className="absolute bottom-2 inset-x-0 z-10 flex items-center justify-center pointer-events-none">
          <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-mono-luxury font-medium text-white/70 uppercase tracking-wider">
            Drag 360° · Pinch to Zoom
          </span>
        </div>
      </div>
    );
  }
);

export default Real3DCanvasViewer;
