import { useEffect, useRef, useCallback, useState, memo } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { normalizeGeometry } from '../lib/model-utils'
import type { LoadedModel, ModelObject } from '../lib/types'

function getViewerTheme() {
  const style = getComputedStyle(document.documentElement)
  const get = (prop: string) => style.getPropertyValue(prop).trim()
  return {
    bg: get('--viewer-bg'),
    gridMajor: get('--viewer-grid-major'),
    gridMinor: get('--viewer-grid-minor'),
    modelColor: get('--viewer-model-color'),
    ambientColor: get('--viewer-ambient-color'),
    ambientIntensity: parseFloat(get('--viewer-ambient-intensity')) || 0.8,
    mainLightColor: get('--viewer-main-light-color'),
    mainLightIntensity: parseFloat(get('--viewer-main-light-intensity')) || 1.1,
    fillColor: get('--viewer-fill-color'),
    fillIntensity: parseFloat(get('--viewer-fill-intensity')) || 0.3,
    rimColor: get('--viewer-rim-color'),
    rimIntensity: parseFloat(get('--viewer-rim-intensity')) || 0.2,
  }
}

function AxisIndicator() {
  return (
    <div
      className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-3 rounded-xl border px-3 py-2 md:bottom-5 md:right-5"
      style={{
        borderColor: 'var(--border-dim)',
        background: 'var(--bg-glass-strong)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="axis-pill">
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: '#f47067' }}
        />
        X
      </div>
      <div className="axis-pill">
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: '#3fb950' }}
        />
        Y
      </div>
      <div className="axis-pill">
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: '#58a6ff' }}
        />
        Z
      </div>
    </div>
  )
}

const HintText = memo(function HintText() {
  return (
    <div
      className="pointer-events-none absolute right-4 top-14 rounded-2xl border px-3 py-2 text-xs font-medium md:right-5 md:top-16"
      style={{
        borderColor: 'var(--border-dim)',
        background: 'var(--bg-glass-strong)',
        backdropFilter: 'blur(12px)',
        color: 'var(--text-tertiary)',
      }}
    >
      Drag to orbit, scroll to zoom
    </div>
  )
})

interface Viewer3DProps {
  model: LoadedModel | null
  objectVisibility: boolean[]
}

export function Viewer3D({ model, objectVisibility }: Viewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const meshesRef = useRef<THREE.Mesh[]>([])
  const animationIdRef = useRef<number | null>(null)
  const lightsRef = useRef<{
    ambient: THREE.AmbientLight
    main: THREE.DirectionalLight
    fill: THREE.DirectionalLight
    rim: THREE.DirectionalLight
    grid: THREE.GridHelper
  } | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Apply theme to the THREE.js scene
  const applyTheme = useCallback(() => {
    const scene = sceneRef.current
    const lights = lightsRef.current
    if (!scene || !lights) return

    const t = getViewerTheme()

    scene.background = new THREE.Color(t.bg)

    lights.ambient.color.set(t.ambientColor)
    lights.ambient.intensity = t.ambientIntensity
    lights.main.color.set(t.mainLightColor)
    lights.main.intensity = t.mainLightIntensity
    lights.fill.color.set(t.fillColor)
    lights.fill.intensity = t.fillIntensity
    lights.rim.color.set(t.rimColor)
    lights.rim.intensity = t.rimIntensity

    // Recreate grid with new colors
    scene.remove(lights.grid)
    const newGrid = new THREE.GridHelper(
      300,
      30,
      new THREE.Color(t.gridMajor),
      new THREE.Color(t.gridMinor),
    )
    newGrid.position.y = -0.1
    scene.add(newGrid)
    lights.grid = newGrid

    // Update model material color
    meshesRef.current.forEach((mesh) => {
      if (mesh.material instanceof THREE.MeshStandardMaterial) {
        mesh.material.color.set(t.modelColor)
        mesh.material.needsUpdate = true
      }
    })
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth || 800
    const height = container.clientHeight || 600

    const t = getViewerTheme()

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(t.bg)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 10000)
    camera.position.set(150, 150, 150)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enableRotate = true
    controls.enableZoom = true
    controls.enablePan = true
    controls.minDistance = 20
    controls.maxDistance = 2000
    controlsRef.current = controls

    const ambientLight = new THREE.AmbientLight(
      t.ambientColor,
      t.ambientIntensity,
    )
    scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight(
      t.mainLightColor,
      t.mainLightIntensity,
    )
    mainLight.position.set(120, 160, 100)
    scene.add(mainLight)

    const fillLight = new THREE.DirectionalLight(t.fillColor, t.fillIntensity)
    fillLight.position.set(-100, 70, -100)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(t.rimColor, t.rimIntensity)
    rimLight.position.set(0, -40, 100)
    scene.add(rimLight)

    const gridHelper = new THREE.GridHelper(
      300,
      30,
      new THREE.Color(t.gridMajor),
      new THREE.Color(t.gridMinor),
    )
    gridHelper.position.y = -0.1
    scene.add(gridHelper)

    const axesHelper = new THREE.AxesHelper(30)
    scene.add(axesHelper)

    lightsRef.current = {
      ambient: ambientLight,
      main: mainLight,
      fill: fillLight,
      rim: rimLight,
      grid: gridHelper,
    }

    setIsInitialized(true)

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      if (w > 0 && h > 0) {
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
      }
    }

    window.addEventListener('resize', handleResize, { passive: true })
    setTimeout(handleResize, 100)

    // Listen for system theme changes
    const darkMq = window.matchMedia('(prefers-color-scheme: dark)')
    const handleThemeChange = () => {
      // Small delay to let CSS variables update
      setTimeout(applyTheme, 50)
    }
    darkMq.addEventListener('change', handleThemeChange)

    return () => {
      window.removeEventListener('resize', handleResize)
      darkMq.removeEventListener('change', handleThemeChange)
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      controls.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [applyTheme])

  useEffect(() => {
    if (!sceneRef.current || !model || !isInitialized) return

    meshesRef.current.forEach((mesh) => {
      sceneRef.current?.remove(mesh)
      mesh.geometry.dispose()
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose()
      }
    })
    meshesRef.current = []

    const t = getViewerTheme()

    model.objects.forEach((obj: ModelObject, index: number) => {
      const geometry = obj.geometry.clone()
      normalizeGeometry(geometry, 100)

      const material = new THREE.MeshStandardMaterial({
        color: t.modelColor,
        metalness: 0.2,
        roughness: 0.45,
        side: THREE.DoubleSide,
        envMapIntensity: 0.5,
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.userData.objectIndex = index

      sceneRef.current?.add(mesh)
      meshesRef.current.push(mesh)
    })

    setTimeout(() => {
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.set(150, 150, 150)
        cameraRef.current.lookAt(0, 0, 0)
        controlsRef.current.target.set(0, 0, 0)
        controlsRef.current.update()
      }
    }, 50)
  }, [model, isInitialized])

  useEffect(() => {
    if (!isInitialized) return

    meshesRef.current.forEach((mesh, index) => {
      const isVisible = objectVisibility[index] ?? true
      mesh.visible = isVisible
    })
  }, [objectVisibility, isInitialized])

  const resetCamera = useCallback(() => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(150, 150, 150)
      cameraRef.current.lookAt(0, 0, 0)
      controlsRef.current.target.set(0, 0, 0)
      controlsRef.current.update()
    }
  }, [])

  const zoomToFit = useCallback(() => {
    if (
      !cameraRef.current ||
      !controlsRef.current ||
      meshesRef.current.length === 0
    )
      return

    const box = new THREE.Box3()
    meshesRef.current.forEach((mesh) => {
      if (mesh.visible) {
        box.expandByObject(mesh)
      }
    })

    if (box.isEmpty()) {
      resetCamera()
      return
    }

    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const distance = maxDim * 2

    cameraRef.current.position.set(
      center.x + distance * 0.7,
      center.y + distance * 0.7,
      center.z + distance * 0.7,
    )
    cameraRef.current.lookAt(center)
    controlsRef.current.target.copy(center)
    controlsRef.current.update()
  }, [resetCamera])

  return (
    <div className="relative h-full w-full min-h-0">
      <div ref={containerRef} className="h-full w-full" />

      <div className="pointer-events-none absolute inset-0">
        <div className="pointer-events-auto absolute bottom-4 left-4 flex gap-2 md:bottom-5 md:left-5">
          <button onClick={resetCamera} className="viewer-control-btn">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Reset
          </button>

          <button onClick={zoomToFit} className="viewer-control-btn">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
            Fit View
          </button>
        </div>

        <HintText />
        <AxisIndicator />
      </div>
    </div>
  )
}
