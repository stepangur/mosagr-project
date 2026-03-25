import { useEffect, useRef, useState } from "react";
import { X, Loader2, AlertCircle, Maximize2, Minimize2 } from "lucide-react";

interface IfcViewerProps {
  fileUrl: string;
  title: string;
  onClose: () => void;
}

export default function IfcViewer({ fileUrl, title, onClose }: IfcViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const cleanupRef = useRef<() => void>(() => {});

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!containerRef.current) return;
      const container = containerRef.current;

      try {
        const THREE = await import("three");
        const { OrbitControls } = await import(
          "three/examples/jsm/controls/OrbitControls.js" as string
        );
        const WebIFC = await import("web-ifc");

        if (cancelled) return;

        const w = container.clientWidth || 800;
        const h = container.clientHeight || 600;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf1f5f9);

        const camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 100000);
        camera.position.set(20, 20, 20);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        const ambient = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambient);
        const dir = new THREE.DirectionalLight(0xffffff, 1.2);
        dir.position.set(50, 100, 50);
        scene.add(dir);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        if (cancelled) return;

        // Fetch IFC binary
        const resp = await fetch(fileUrl);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const buffer = await resp.arrayBuffer();

        if (cancelled) return;

        // Init web-ifc
        const ifcApi = new WebIFC.IfcAPI();
        const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
        ifcApi.SetWasmPath(`${base}/wasm/`, true);
        await ifcApi.Init();

        const data = new Uint8Array(buffer);
        const modelID = ifcApi.OpenModel(data);

        const meshes: THREE.Mesh[] = [];

        ifcApi.StreamAllMeshes(modelID, (mesh: any) => {
          const placedGeoms = mesh.geometries;
          for (let i = 0; i < placedGeoms.size(); i++) {
            const placedGeom = placedGeoms.get(i);
            const geometry = ifcApi.GetGeometry(modelID, placedGeom.geometryExpressID);
            const verts = ifcApi.GetVertexArray(
              geometry.GetVertexData(),
              geometry.GetVertexDataSize()
            );
            const indices = ifcApi.GetIndexArray(
              geometry.GetIndexData(),
              geometry.GetIndexDataSize()
            );

            const bufGeom = new THREE.BufferGeometry();
            const positions = new Float32Array(verts.length / 2);
            const normals = new Float32Array(verts.length / 2);
            for (let j = 0; j < verts.length; j += 6) {
              const half = j / 2;
              positions[half] = verts[j];
              positions[half + 1] = verts[j + 1];
              positions[half + 2] = verts[j + 2];
              normals[half] = verts[j + 3];
              normals[half + 1] = verts[j + 4];
              normals[half + 2] = verts[j + 5];
            }
            bufGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
            bufGeom.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
            bufGeom.setIndex(new THREE.BufferAttribute(indices, 1));

            const color = placedGeom.color;
            const mat = new THREE.MeshLambertMaterial({
              color: new THREE.Color(color.x, color.y, color.z),
              transparent: color.w < 1,
              opacity: color.w,
              side: THREE.DoubleSide,
            });

            const m44 = placedGeom.flatTransformation as number[];
            const matrix = new THREE.Matrix4().fromArray(m44);

            const mesh3 = new THREE.Mesh(bufGeom, mat);
            mesh3.matrix.copy(matrix);
            mesh3.matrixAutoUpdate = false;

            scene.add(mesh3);
            meshes.push(mesh3);

            geometry.delete();
          }
        });

        ifcApi.CloseModel(modelID);

        if (cancelled) return;

        // Fit camera to model
        if (meshes.length > 0) {
          const box = new THREE.Box3();
          meshes.forEach(m => box.expandByObject(m));
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          camera.position.set(
            center.x + maxDim * 1.5,
            center.y + maxDim * 1.5,
            center.z + maxDim * 1.5
          );
          camera.lookAt(center);
          controls.target.copy(center);
          camera.near = maxDim / 1000;
          camera.far = maxDim * 100;
          camera.updateProjectionMatrix();
          controls.update();
        }

        setLoading(false);

        let animFrame: number;
        const animate = () => {
          animFrame = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
          const nw = container.clientWidth;
          const nh = container.clientHeight;
          if (nw === 0 || nh === 0) return;
          camera.aspect = nw / nh;
          camera.updateProjectionMatrix();
          renderer.setSize(nw, nh);
        };

        // ResizeObserver catches container size changes (fullscreen toggle, etc.)
        const ro = new ResizeObserver(handleResize);
        ro.observe(container);
        window.addEventListener("resize", handleResize);

        cleanupRef.current = () => {
          cancelAnimationFrame(animFrame);
          ro.disconnect();
          window.removeEventListener("resize", handleResize);
          controls.dispose();
          renderer.dispose();
          if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
          }
        };
      } catch (e: any) {
        if (!cancelled) {
          console.error("IFC load error:", e);
          setError("Не удалось загрузить IFC-модель. " + (e?.message ?? "Проверьте формат файла."));
          setLoading(false);
        }
      }
    }

    init();
    return () => {
      cleanupRef.current();
    };
  }, [fileUrl]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className={`relative bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          fullscreen ? "w-full h-full rounded-none" : "w-full max-w-5xl h-[80vh]"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-slate-900 text-sm">{title}</div>
              <div className="text-xs text-slate-400">Онлайн-просмотр 3D-модели IFC</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFullscreen(f => !f)}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title={fullscreen ? "Свернуть" : "На весь экран"}
            >
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewer area */}
        <div className="relative flex-1 bg-slate-50 overflow-hidden">
          <div ref={containerRef} className="w-full h-full" />

          {loading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 pointer-events-none">
              <Loader2 className="w-10 h-10 text-violet-500 animate-spin mb-3" />
              <p className="text-sm text-slate-500 font-medium">Загрузка 3D-модели...</p>
              <p className="text-xs text-slate-400 mt-1">Это может занять несколько секунд</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 px-6">
              <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
              <p className="text-sm text-slate-600 font-medium text-center">{error}</p>
              <p className="text-xs text-slate-400 mt-2 text-center">
                Убедитесь, что файл в формате IFC (Industry Foundation Classes)
              </p>
            </div>
          )}
        </div>

        {/* Footer hints */}
        {!loading && !error && (
          <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center gap-5 text-xs text-slate-400 shrink-0">
            <span>🖱 ЛКМ — вращение</span>
            <span>🖱 СКМ — масштаб</span>
            <span>🖱 ПКМ — перемещение</span>
          </div>
        )}
      </div>
    </div>
  );
}
