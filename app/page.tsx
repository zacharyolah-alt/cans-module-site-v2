"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function Page() {
  const [viewMode, setViewMode] = useState("directory");
  const svgPlannerRef = useRef<SVGSVGElement | null>(null);
  const [layoutOverrides, setLayoutOverrides] = useState<any>({});
  const [layoutExcluded, setLayoutExcluded] = useState<any>({});
  const [modules, setModules] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [photo, setPhoto] = useState("");
  const [standard, setStandard] = useState("T-Trak");
  const [dimensions, setDimensions] = useState("");
  const [status, setStatus] = useState("Active");
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const [standardFilter, setStandardFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [uploading, setUploading] = useState(false);
const [moduleType, setModuleType] = useState("Straight");
const [cornerSize, setCornerSize] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selectedImage, setSelectedImage] = useState(null);
const [dimensionFilter, setDimensionFilter] = useState("All");
  const [ownerName, setOwnerName] = useState("");
  useEffect(() => {
    loadModules();

    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function loadModules() {
    const { data, error } = await supabase
      .from("modules")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setModules(data || []);
  }

  async function login() {
    const email = window.prompt("Enter your email");
    if (!email) return;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "https://cans-module-site-v2.vercel.app",
      },
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Check your email for the login link.");
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }
  async function uploadPhoto(file: File) {
    if (!user) {
      alert("Please log in first.");
      return;
    }

    setUploading(true);

    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");
    const fileName = `${user.id}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
      .from("module-photos")
      .upload(fileName, file);

    if (error) {
      setUploading(false);
      alert(error.message);
      return;
    }

    const { data } = supabase.storage
      .from("module-photos")
      .getPublicUrl(fileName);

    setPhoto(data.publicUrl);
    setUploading(false);
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setOwnerName("");
    setPhoto("");
    setStandard("T-Trak");
    setDimensions("");
    setStatus("Active");
    setNotes("");
  }

  function startEdit(m: any) {
    setEditingId(m.id);
    setName(m.module_name || "");
    setPhoto(m.photo_url || "");
    setStandard(m.standard || "T-Trak");
    setDimensions(m.dimensions || "");
    setStatus(m.status || "Active");
    setNotes(m.additional_notes || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveModule() {
    if (!user) return alert("Please log in first.");
    if (!name.trim()) return alert("Please enter a module name.");
    if (uploading) return alert("Please wait for photo upload to finish.");

    const payload = {
      module_name: name,
      owner_name: ownerName || user.email,
      user_id: user.id,
      photo_url: photo,
      standard,
      module_type: moduleType,
corner_size: cornerSize,
      dimensions,
      status,
      additional_notes: notes,
    };

    const result = editingId
      ? await supabase.from("modules").update(payload).eq("id", editingId)
      : await supabase.from("modules").insert(payload);

    if (result.error) {
      alert(result.error.message);
      return;
    }

    resetForm();
    loadModules();
  }

  async function deleteModule(id: string) {
    if (!window.confirm("Delete this module?")) return;

    const { error } = await supabase.from("modules").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadModules();
  }
function exportToCSV() {
  const headers = [
    "Module Name",
    "Owner",
    "Standard",
    "Type",
    "Size",
    "Status",
    "Notes",
  ];

  const rows = modules.map((m) => [
    m.module_name || "",
    m.owner_name || "",
    m.standard || "",
    m.module_type || "",
    m.dimensions || "",
    m.status || "",
    m.additional_notes || "",
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "cans-modules.csv";
  link.click();

  URL.revokeObjectURL(url);
}
  const filteredModules = useMemo(() => {
  return modules.filter((m) => {
    const term = search.toLowerCase();

    const matchesSearch = [
      m.module_name,
      m.owner_name,
      m.standard,
      m.dimensions,
      m.status,
      m.additional_notes,
    ]
      .join(" ")
      .toLowerCase()
      .includes(term);

    const matchesStandard =
      standardFilter === "All" || m.standard === standardFilter;

    const matchesStatus =
      statusFilter === "All" || m.status === statusFilter;

    const matchesType =
      typeFilter === "All" || m.module_type === typeFilter;

    const matchesSize =
      dimensionFilter === "All" ||
      m.dimensions?.startsWith(dimensionFilter + " -");

    return matchesSearch && matchesStandard && matchesStatus && matchesType && matchesSize;
  });
}, [modules, search, standardFilter, statusFilter, typeFilter, dimensionFilter]);

  const layoutModules = useMemo(() => {
    return filteredModules.filter((m) => !layoutExcluded[m.id]);
  }, [filteredModules, layoutExcluded]);

  const LAYOUT_SCALE = 10; // 10 SVG pixels = 1 inch
  const FRONT_TRACK_FRONT_EDGE = 15; // 1.5 inches from module front to front edge of front track
  const TRACK_WIDTH = 10; // each track shown as 1 inch wide
  const TRACK_CENTER_SPACING = 13; // 33 mm center-to-center is about 1.3 inches

  function getLayoutKind(m: any) {
    if (m.module_type === "Inside Corner") return "insideCorner";
    if (m.module_type === "Outside Corner") return "outsideCorner";
    if (m.dimensions?.startsWith("Corner")) return "outsideCorner";
    if (m.module_type === "Bridge") return "bridge";
    if (m.dimensions?.startsWith("Single")) return "single";
    if (m.dimensions?.startsWith("Double")) return "double";
    if (m.dimensions?.startsWith("Triple")) return "triple";
    if (m.dimensions?.startsWith("Quad")) return "quad";
    return "custom";
  }

  function getLayoutSize(m: any, slot: any) {
    const kind = slot?.kind || getLayoutKind(m);

    if (kind === "insideCorner" || kind === "outsideCorner") {
      return { width: 144, height: 144 };
    }

    if (kind === "single") return { width: 121, height: 144 };
    if (kind === "double") return { width: 243, height: 144 };
    if (kind === "triple") return { width: 365, height: 144 };
    if (kind === "quad") return { width: 487, height: 144 };
    if (kind === "bridge") return { width: 243, height: 110 };

    return { width: 160, height: 144 };
  }

  function getTemplateSlot(index: number) {
    /*
      Starter loop template:
      - Front edge faces outward.
      - Front edge of the front track is 1.5 inches from the module front.
      - Each track is shown as two rail lines, about 1 inch wide.
      - Track centers are about 33 mm apart.
      - Modules rotate to form the loop; the track does not move on the module.
    */
    const slots = [
      { x: 70, y: 140, kind: "outsideCorner", rotation: 0 },
      { x: 214, y: 140, kind: "single", rotation: 0 },
      { x: 335, y: 140, kind: "single", rotation: 0 },
      { x: 456, y: 140, kind: "double", rotation: 0 },
      { x: 699, y: 140, kind: "outsideCorner", rotation: 90 },

      { x: 839, y: 284, kind: "single", rotation: 90 },
      { x: 839, y: 405, kind: "outsideCorner", rotation: 180 },

      { x: 352, y: 545, kind: "quad", rotation: 180 },
      { x: 230, y: 545, kind: "single", rotation: 180 },
      { x: 70, y: 405, kind: "outsideCorner", rotation: 270 },

      { x: 70, y: 284, kind: "single", rotation: 270 },

      { x: 70, y: 20, kind: "single", rotation: 0 },
      { x: 230, y: 20, kind: "double", rotation: 0 },
    ];

    return slots[index] || {
      x: 70 + (index % 5) * 190,
      y: 680 + Math.floor((index - 13) / 5) * 170,
      kind: "custom",
      rotation: 0,
    };
  }

  function getModuleTransform(slot: any, size: any) {
    if (slot.rotation === 90) {
      return `translate(${slot.x + size.height}, ${slot.y}) rotate(90)`;
    }

    if (slot.rotation === 180) {
      return `translate(${slot.x + size.width}, ${slot.y + size.height}) rotate(180)`;
    }

    if (slot.rotation === 270) {
      return `translate(${slot.x}, ${slot.y + size.width}) rotate(270)`;
    }

    return `translate(${slot.x}, ${slot.y})`;
  }

  function getRotatedBounds(slot: any, size: any) {
    if (slot.rotation === 90 || slot.rotation === 270) {
      return { width: size.height, height: size.width };
    }

    return { width: size.width, height: size.height };
  }

  function isCornerKind(kind: string) {
    return kind === "insideCorner" || kind === "outsideCorner";
  }

  function getTrackRails() {
    const frontRail1 = FRONT_TRACK_FRONT_EDGE;
    const frontRail2 = FRONT_TRACK_FRONT_EDGE + TRACK_WIDTH;
    const rearTrackFrontEdge =
      FRONT_TRACK_FRONT_EDGE + TRACK_CENTER_SPACING - TRACK_WIDTH / 2;
    const rearRail1 = rearTrackFrontEdge;
    const rearRail2 = rearTrackFrontEdge + TRACK_WIDTH;

    return [frontRail1, frontRail2, rearRail1, rearRail2];
  }

  function getNumberPosition(slot: any, size: any) {
    /*
      The number belongs at the back of the module, away from the front edge/tracks.
      These positions are calculated after rotation so the number appears on the
      visible back side of each module.
    */
    const margin = 18;

    if (slot.rotation === 0) {
      return { x: slot.x + margin, y: slot.y + size.height - margin };
    }

    if (slot.rotation === 90) {
      return { x: slot.x + size.height - margin, y: slot.y + margin };
    }

    if (slot.rotation === 180) {
      return { x: slot.x + size.width - margin, y: slot.y + margin };
    }

    if (slot.rotation === 270) {
      return { x: slot.x + margin, y: slot.y + size.width - margin };
    }

    return { x: slot.x + margin, y: slot.y + size.height - margin };
  }

  function getPlacedSlot(m: any, index: number) {
    const baseSlot = getTemplateSlot(index);
    const savedSlot = layoutOverrides[m.id];

    return {
      ...baseSlot,
      ...(savedSlot || {}),
    };
  }

  function snapToGrid(value: number) {
    return Math.round(value / 10) * 10;
  }

  function getSvgPoint(event: any) {
    const svg = svgPlannerRef.current;

    if (!svg) {
      return { x: 0, y: 0 };
    }

    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;

    const matrix = svg.getScreenCTM();

    if (!matrix) {
      return { x: 0, y: 0 };
    }

    const transformed = point.matrixTransform(matrix.inverse());

    return {
      x: transformed.x,
      y: transformed.y,
    };
  }

  function handleModulePointerDown(event: any, m: any, index: number) {
    event.preventDefault();
    event.stopPropagation();

    if (event.currentTarget?.setPointerCapture && event.pointerId !== undefined) {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch (_error) {}
    }

    const startingSlot = getPlacedSlot(m, index);
    const startingPoint = getSvgPoint(event);
    const startingX = startingSlot.x;
    const startingY = startingSlot.y;

    function moveHandler(moveEvent: any) {
      const currentPoint = getSvgPoint(moveEvent);

      setLayoutOverrides((prev: any) => ({
        ...prev,
        [m.id]: {
          ...startingSlot,
          ...(prev[m.id] || {}),
          x: snapToGrid(startingX + currentPoint.x - startingPoint.x),
          y: snapToGrid(startingY + currentPoint.y - startingPoint.y),
        },
      }));
    }

    function upHandler() {
      window.removeEventListener("pointermove", moveHandler);
      window.removeEventListener("pointerup", upHandler);
    }

    window.addEventListener("pointermove", moveHandler);
    window.addEventListener("pointerup", upHandler);
  }

  function rotateModule(event: any, m: any, index: number) {
    event.preventDefault();
    event.stopPropagation();

    const currentSlot = getPlacedSlot(m, index);
    const nextRotation = ((currentSlot.rotation || 0) + 90) % 360;

    setLayoutOverrides((prev: any) => ({
      ...prev,
      [m.id]: {
        ...currentSlot,
        ...(prev[m.id] || {}),
        rotation: nextRotation,
      },
    }));
  }

  return (
    <main>
      <style>{`
        body { margin: 0; background: #f3f2ed; }
        .page { min-height: 100vh; padding: 20px; font-family: Arial, sans-serif; color: #111; }
        .hero { background: linear-gradient(135deg, #050505, #202020); color: white; border-radius: 28px; padding: 28px; display: flex; align-items: center; gap: 22px; box-shadow: 0 16px 40px rgba(0,0,0,.22); }
        .logo { width: 120px; height: 120px; border-radius: 50%; background: white; object-fit: contain; border: 5px solid #ffd21f; flex-shrink: 0; }
        .badge { background: #ffd21f; color: black; display: inline-block; padding: 7px 13px; border-radius: 999px; font-weight: 900; font-size: 13px; }
        .title { font-size: 44px; margin: 10px 0; line-height: 1; }
        .subtitle { color: #ddd; max-width: 700px; font-size: 17px; }
        .toolbar { display: grid; grid-template-columns: 1fr auto; gap: 12px; margin: 20px 0 12px; }
        .filtersPanel {
  background: white;
  border-radius: 24px;
  padding: 22px;
  margin-bottom: 24px;
  box-shadow: 0 10px 26px rgba(0,0,0,.08);
  border-top: 8px solid #ffd21f;
}

.filtersTitle {
  margin-top: 0;
  margin-bottom: 18px;
  font-size: 28px;
}
        .filters { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
        input, select { padding: 14px; border-radius: 15px; border: 1px solid #ccc; font-size: 16px; background: white; }
        button { border: 0; border-radius: 15px; padding: 14px 18px; font-weight: 900; cursor: pointer; }
        .blackBtn { background: #050505; color: #ffd21f; }
        .yellowBtn { background: #ffd21f; color: black; margin-top: 14px; margin-right: 10px; }
        .grayBtn { background: #ddd; color: black; margin-top: 14px; }
        .formCard { background: white; padding: 22px; border-radius: 24px; border-top: 8px solid #ffd21f; box-shadow: 0 10px 26px rgba(0,0,0,.08); margin-bottom: 26px; }
        .formGrid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .uploadBox { padding: 14px; border-radius: 15px; border: 2px dashed #999; background: #fafafa; font-weight: 900; text-align: center; cursor: pointer; }
        .preview { margin-top: 15px; width: 200px; max-width: 100%; border-radius: 16px; border: 1px solid #ddd; }
        .sectionHeader { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; }
        .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
        .card { background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 12px 28px rgba(0,0,0,.13); }
        .moduleImage { width: 100%; height: 210px; object-fit: cover; background: #ddd; }
        .noImage { height: 210px; background: #ddd; display: flex; align-items: center; justify-content: center; color: #555; font-weight: 900; }
        .cardBody { padding: 18px; }
        .tag { background: #ffd21f; padding: 6px 11px; border-radius: 999px; font-weight: 900; font-size: 13px; display: inline-block; }
        .status { display: inline-block; margin-left: 8px; background: #eee; padding: 6px 11px; border-radius: 999px; font-weight: 800; font-size: 13px; }
        .badgeRow {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.typeTag {
  background: #050505;
  color: white;
  padding: 6px 11px;
  border-radius: 999px;
  font-weight: 900;
  font-size: 13px;
}
.cardBody h3 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 24px;
  line-height: 1.1;
}

.cardBody p {
  margin: 8px 0;
  line-height: 1.45;
}
        .actions { display: flex; gap: 10px; margin-top: 16px; }
        .editBtn { background: #050505; color: #ffd21f; flex: 1; }
        .deleteBtn { background: #b00020; color: white; flex: 1; }
.filterGroup {
  margin-bottom: 16px;
}

.filterGroup p {
  font-weight: 900;
  margin-bottom: 6px;
}
.filterGroup button {
  width: auto;
  flex: 0 0 auto;
  padding: 8px 10px;
  font-size: 13px;
}
.buttonRow {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.activeBtn {
  background: #ffd21f;
  color: black;
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 900;
  border: none;
}

.grayBtn {
  background: #eee;
  color: #333;
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 700;
  border: none;
}

.clearBtn {
  width: auto;
  align-self: flex-start;
  padding: 10px 16px;
  margin-top: 10px;
}
.viewToggle {
  display: flex;
  gap: 10px;
  margin: 18px 0;
  flex-wrap: wrap;
}
        @media (max-width: 700px) {
          .page { padding: 12px; }
          .hero { flex-direction: column; text-align: center; padding: 22px; }
          .logo { width: 100px; height: 100px; }
          .title { font-size: 32px; }
          .subtitle { font-size: 15px; }
          
          .toolbar, .filters, .formGrid { grid-template-columns: 1fr; }
          .sectionHeader { flex-direction: column; align-items: flex-start; gap: 4px; }
          input, select {
  width: 100%;
  box-sizing: border-box;
}

button {
  box-sizing: border-box;
}
          .actions { flex-direction: column; }
        }
        .filterGroup p {
  font-size: 14px;
  margin-bottom: 4px;
}

.buttonRow {
  gap: 4px;
}

.filterGroup button {
  padding: 8px 10px;
  font-size: 12px;
}

.card {
  border-radius: 18px;
}

.cardBody {
  padding: 14px;
}

.cardBody h3 {
  font-size: 22px;
}

.moduleImage {
  height: 180px;
}
.layoutCanvas {
  background: white;
  border: 1px solid #ddd;
  border-radius: 20px;
  overflow: auto;
  padding: 8px;
}

.svgPlanner {
  width: 100%;
  min-width: 1250px;
  height: auto;
  display: block;
  background: #fafafa;
}

.svgModule {
  fill: rgba(198, 226, 178, .55);
  stroke: #3d6b2d;
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
}

.svgModule.custom {
  stroke: #b00020;
  fill: rgba(198, 226, 178, .45);
}

.svgModule.bridge {
  stroke: #6b4b20;
  fill: rgba(198, 226, 178, .50);
}

.svgFrontEdge {
  stroke: #3d6b2d;
  stroke-width: 4;
  vector-effect: non-scaling-stroke;
}

.svgRail {
  stroke: #222;
  stroke-width: 2;
  fill: none;
  vector-effect: non-scaling-stroke;
}

.svgRailTie {
  stroke: #777;
  stroke-width: 1;
  opacity: .35;
  vector-effect: non-scaling-stroke;
}

.svgNumberText {
  fill: #2f6124;
  font-size: 14px;
  font-weight: 900;
  text-anchor: middle;
  dominant-baseline: central;
}

.svgPlanner {
  touch-action: none;
}

.svgModuleGroup {
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.svgModuleGroup:active {
  cursor: grabbing;
}

.legendCheckbox {
  width: 18px;
  height: 18px;
  margin: 0;
  accent-color: #ffd21f;
}

.legendRow {
  display: grid;
  grid-template-columns: 24px 44px 1fr;
  gap: 10px;
  padding: 10px 14px;
  border-top: 1px solid #eee;
  align-items: start;
}

.legendNumber.inactive {
  background: #ddd;
  color: #555;
}

.svgRotateCircle {
  fill: #ffd21f;
  stroke: #050505;
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
}

.svgRotateText {
  fill: #050505;
  font-size: 13px;
  font-weight: 900;
  text-anchor: middle;
  dominant-baseline: central;
  pointer-events: none;
}

.svgScaleKey {
  fill: rgba(255,255,255,.94);
  stroke: #ffd21f;
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
}

.svgKeyTitle {
  fill: #050505;
  font-size: 15px;
  font-weight: 900;
}

.svgKeyText {
  fill: #111;
  font-size: 12px;
}

.layoutLegend {
  margin-top: 18px;
  background: white;
  border-radius: 16px;
  border: 1px solid #ddd;
  overflow: hidden;
}

.legendTitle {
  margin: 0;
  padding: 12px 14px;
  background: #050505;
  color: #ffd21f;
  font-size: 16px;
  font-weight: 900;
}


.legendNumber {
  background: #ffd21f;
  color: #050505;
  border-radius: 999px;
  font-weight: 900;
  text-align: center;
  padding: 5px 0;
}

.legendText {
  font-size: 14px;
  line-height: 1.35;
}

.legendText strong {
  display: block;
  font-size: 15px;
}
        .imageModal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  padding: 16px;
}

.imageModalPhoto {
  max-width: 92vw;
  max-height: 82vh;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 10px;
}

.imageModalClose {
  position: fixed;
  top: 12px;
  right: 18px;
  background: black;
  border: 2px solid white;
  color: white;
  font-size: 32px;
  line-height: 1;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
}
      `}</style>

      <div className="page">
        <section className="hero">
          <img src="/cans-logo.png" alt="C.A.N.S. logo" className="logo" />
          <div>
            <p className="badge">Columbus Area N Scalers</p>
            <h1 className="title">C.A.N.S. Module Directory</h1>
            <p className="subtitle">
              A clean member-powered directory for module photos, standards,
              dimensions, status, and setup notes.
            </p>
          </div>
        </section>
<div className="viewToggle">
  <button
    className={viewMode === "directory" ? "activeBtn" : "grayBtn"}
    onClick={() => setViewMode("directory")}
  >
    Directory View
  </button>

  <button
    className={viewMode === "layout" ? "activeBtn" : "grayBtn"}
    onClick={() => setViewMode("layout")}
  >
    Layout View
  </button>
</div>
        <section className="toolbar">
          <button className="yellowBtn" onClick={exportToCSV}>
  Export Spreadsheet
</button>
          {!user ? (
            <button className="blackBtn" onClick={login}>
              Member Login
            </button>
          ) : (
            <button className="blackBtn" onClick={logout}>
              Logout
            </button>
          )}
        </section>

        <section className="filtersPanel">
  <h2 className="filtersTitle">Filter Modules</h2>

  <section className="filters">

  {/* STANDARD */}
  <div className="filterGroup">
    <p>Standard</p>
    <div className="buttonRow">
      {["All", "T-Trak", "N-Trak", "Free-moN", "Other"].map((s) => (
        <button
          key={s}
          className={standardFilter === s ? "activeBtn" : "grayBtn"}
          onClick={() => setStandardFilter(s)}
        >
          {s}
        </button>
      ))}
    </div>
  </div>

  {/* STATUS */}
  <div className="filterGroup">
    <p>Status</p>
    <div className="buttonRow">
      {["All", "Planning", "Under Construction", "Active", "Retired"].map((s) => (
        <button
          key={s}
          className={statusFilter === s ? "activeBtn" : "grayBtn"}
          onClick={() => setStatusFilter(s)}
        >
          {s}
        </button>
      ))}
    </div>
  </div>

  {/* TYPE */}
  <div className="filterGroup">
    <p>Type</p>
    <div className="buttonRow">
      {["All", "Straight", "Inside Corner", "Outside Corner", "Bridge"].map((t) => (
        <button
          key={t}
          className={typeFilter === t ? "activeBtn" : "grayBtn"}
          onClick={() => setTypeFilter(t)}
        >
          {t}
        </button>
      ))}
    </div>
  </div>

  {/* SIZE */}
  <div className="filterGroup">
    <p>Size</p>
    <div className="buttonRow">
      {["All", "Single", "Double", "Triple", "Quad"].map((d) => (
        <button
          key={d}
          className={dimensionFilter === d ? "activeBtn" : "grayBtn"}
          onClick={() => setDimensionFilter(d)}
        >
          {d}
        </button>
      ))}
    </div>
  </div>

  {/* CLEAR */}
  <button
  className="blackBtn clearBtn"
  onClick={() => {
    setStandardFilter("All");
    setStatusFilter("All");
    setTypeFilter("All");
    setDimensionFilter("All");
  }}
>
  Clear Filters
</button>

</section>
          </section>

        {user && (
          <section className="formCard">
            <h2>{editingId ? "Edit Module" : "Add a Module"}</h2>

            <div className="formGrid">
              <input
                placeholder="Module name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
  placeholder="Member name"
  value={ownerName}
  onChange={(e) => setOwnerName(e.target.value)}
/>

              <label className="uploadBox">
                {uploading
                  ? "Uploading..."
                  : photo
                  ? "Change Module Photo"
                  : "Choose Module Photo"}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadPhoto(file);
                  }}
                />
              </label>

              <select
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
              >
                <option>T-Trak</option>
                <option>N-Trak</option>
                <option>Free-moN</option>
                <option>Other</option>
              </select>
<select
  value={moduleType}
  onChange={(e) => {
    setModuleType(e.target.value);
    setCornerSize("");
  }}
>
  <option>Straight</option>
  <option>Inside Corner</option>
  <option>Outside Corner</option>
  <option>Bridge</option>
</select>
              {(moduleType === "Inside Corner" || moduleType === "Outside Corner") && (
  <select
    value={cornerSize}
    onChange={(e) => setCornerSize(e.target.value)}
  >
    <option value="">Select corner size</option>
    <option>Small Inside Corner - 195 mm / 220 mm</option>
    <option>Medium Inside Corner - 220 mm / 245 mm</option>
    <option>Large Inside Corner - 245 mm / 270 mm</option>
    <option>Standard Corner - 365 mm (14.37")</option>
    <option>End Cap - 365 mm x 732 mm (14.37" x 28.82")</option>
    <option>Large Radius - 315 mm / 348 mm</option>
    <option>Large Radius - 348 mm / 381 mm</option>
    <option>Large Radius - 381 mm / 414 mm</option>
    <option>Large Radius - 447 mm / 480 mm</option>
  </select>
)}
              <select
  value={dimensions}
  onChange={(e) => setDimensions(e.target.value)}
>
  <option value="">Select module size</option>
  <option>Single - 308 mm (12.13")</option>
  <option>Double - 618 mm (24.33")</option>
  <option>Triple - 928 mm (36.54")</option>
  <option>Quad - 1238 mm (48.74")</option>
  <option>Corner - 365.1 mm x 365.1 mm (14.38" x 14.38")</option>
  <option>End Cap - 731.8 mm x 365.1 mm (28.81" x 14.38")</option>
  <option>Interchange Double - 390 mm x 618 mm (15.35" x 24.33")</option>
  <option>Interchange Triple - 474 mm x 928 mm (18.66" x 36.54")</option>
  <option>Other / custom</option>
</select>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option>Planning</option>
                <option>Under Construction</option>
                <option>Active</option>
                <option>Retired</option>
              </select>

              <input
                placeholder="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {photo && <img src={photo} alt="Preview" className="preview" />}

            <div>
              <button className="yellowBtn" onClick={saveModule}>
                {editingId ? "Save Changes" : "Add Module"}
              </button>

              {editingId && (
                <button className="grayBtn" onClick={resetForm}>
                  Cancel Edit
                </button>
              )}
            </div>
          </section>
        )}
{viewMode === "directory" && (
  <>
        <div className="sectionHeader">
          <h2>Modules</h2>
          <p>{filteredModules.length} shown</p>
        </div>

        <section className="cards">
          {filteredModules.map((m) => (
            <article key={m.id} className="card">
              {m.photo_url ? (
                <img
  src={m.photo_url}
  alt={m.module_name}
  className="moduleImage"
  style={{ cursor: "pointer" }}
  onClick={() => {
    console.log("clicked image", m.photo_url);
    setSelectedImage(m.photo_url);
  }}
/>
                  
              ) : (
                <div className="noImage">No Photo</div>
              )}

              <div className="cardBody">
                <div className="badgeRow">
  <span className="tag">{m.standard || "Module"}</span>

  {m.module_type && (
    <span className="typeTag">{m.module_type}</span>
  )}

  <span className="status">{m.status || "Active"}</span>
</div>
                <h3>{m.module_name}</h3>
                <p>
                  <b>Owner:</b> {m.owner_name}
                </p>
{m.module_type && (
  <p>
    <b>Type:</b> {m.module_type}
  </p>
)}
                {m.dimensions && (
                  <p>
                    <b>Size:</b> {m.dimensions}
                  </p>
              )}
              {m.additional_notes && (
  <p>
    <strong>Notes:</strong> {m.additional_notes}
  </p>
)}
                    {user && user.id === m.user_id && (
  <div className="actions">
    <button className="editBtn" onClick={() => startEdit(m)}>
      Edit
    </button>
    <button
      className="deleteBtn"
      onClick={() => deleteModule(m.id)}
    >
      Delete
    </button>
  </div>
)}
              </div>
            </article>
          ))}
        </section>
    </>
)}
        {viewMode === "layout" && (
  <section className="formCard">
    <h2>Layout View</h2>

    <div className="layoutCanvas">
      <svg ref={svgPlannerRef} className="svgPlanner" viewBox="0 0 1250 880" role="img" aria-label="C.A.N.S. module layout planner">
        <defs>
          <pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#dddddd" strokeWidth="1" />
          </pattern>
          <pattern id="largeGrid" width="50" height="50" patternUnits="userSpaceOnUse">
            <rect width="50" height="50" fill="url(#smallGrid)" />
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#c9c9c9" strokeWidth="1.2" />
          </pattern>
        </defs>

        <rect x="0" y="0" width="1250" height="880" fill="url(#largeGrid)" />

        <g>
          <rect className="svgScaleKey" x="20" y="20" width="235" height="72" rx="8" />
          <text className="svgKeyTitle" x="36" y="44">Grid Scale</text>
          <text className="svgKeyText" x="36" y="64">1 small square = 1 inch</text>
          <text className="svgKeyText" x="36" y="82">1 large square = 5 inches</text>
        </g>

        {layoutModules.map((m, index) => {
          const slot = getPlacedSlot(m, index);
          const kind = slot.kind || getLayoutKind(m);
          const size = getLayoutSize(m, slot);
          const rails = getTrackRails();
          const moduleTransform = getModuleTransform(slot, size);
          const numberPosition = getNumberPosition(slot, size);

          return (
            <g key={m.id} className="svgModuleGroup" onPointerDown={(event) => handleModulePointerDown(event, m, index)}>
              <g transform={moduleTransform}>
                <rect
                  className={`svgModule ${kind === "custom" ? "custom" : ""} ${kind === "bridge" ? "bridge" : ""}`}
                  x="0"
                  y="0"
                  width={size.width}
                  height={size.height}
                  rx="1"
                />

                <line className="svgFrontEdge" x1="0" y1="0" x2={size.width} y2="0" />

                {isCornerKind(kind) ? (
                  kind === "outsideCorner" ? (
                    <>
                      {rails.map((rail, railIndex) => (
                        <path
                          key={railIndex}
                          className="svgRail"
                          d={`M 0 ${rail} A ${size.width - rail} ${size.height - rail} 0 0 1 ${size.width - rail} ${size.height}`}
                        />
                      ))}
                    </>
                  ) : (
                    <>
                      {rails.map((rail, railIndex) => (
                        <path
                          key={railIndex}
                          className="svgRail"
                          d={`M 0 ${size.height - rail} A ${size.height - rail} ${size.height - rail} 0 0 0 ${size.width - rail} 0`}
                        />
                      ))}
                    </>
                  )
                ) : (
                  <>
                    {rails.map((rail, railIndex) => (
                      <line
                        key={railIndex}
                        className="svgRail"
                        x1="0"
                        y1={rail}
                        x2={size.width}
                        y2={rail}
                      />
                    ))}
                    {Array.from({ length: Math.max(2, Math.floor(size.width / 18)) }).map((_, tieIndex) => (
                      <line
                        key={tieIndex}
                        className="svgRailTie"
                        x1={10 + tieIndex * 18}
                        y1={rails[0] - 3}
                        x2={10 + tieIndex * 18}
                        y2={rails[3] + 3}
                      />
                    ))}
                  </>
                )}
              </g>

              <text className="svgNumberText" x={numberPosition.x} y={numberPosition.y}>
                {index + 1}
              </text>

              <g
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => rotateModule(event, m, index)}
                style={{ cursor: "pointer" }}
              >
                <circle className="svgRotateCircle" cx={numberPosition.x + 24} cy={numberPosition.y} r="11" />
                <text className="svgRotateText" x={numberPosition.x + 24} y={numberPosition.y}>
                  ↻
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>

    <div className="layoutLegend">
      <h3 className="legendTitle">Module Key</h3>
      {filteredModules.map((m) => {
        const isIncluded = !layoutExcluded[m.id];
        const layoutNumber = layoutModules.findIndex((item) => item.id === m.id) + 1;

        return (
          <div key={m.id} className="legendRow">
            <input
              className="legendCheckbox"
              type="checkbox"
              checked={isIncluded}
              onChange={(event) => {
                const checked = event.target.checked;

                setLayoutExcluded((prev: any) => ({
                  ...prev,
                  [m.id]: !checked,
                }));
              }}
            />

            <div className={`legendNumber ${isIncluded ? "" : "inactive"}`}>
              {isIncluded ? layoutNumber : "—"}
            </div>

            <div className="legendText">
              <strong>{m.module_name || "Unnamed Module"}</strong>
              {m.module_type || "Module"} — {m.dimensions || "Custom Size"} — {m.owner_name || "Unknown Owner"}
            </div>
          </div>
        );
      })}
    </div>
  </section>
)}
        {selectedImage && (
  <div
    className="imageModal"
    onClick={() => setSelectedImage(null)}
  >
    <button
      className="imageModalClose"
      onClick={() => setSelectedImage(null)}
    >
      ×
    </button>

    <img
      src={selectedImage}
      alt="Full size module"
      className="imageModalPhoto"
    />
  </div>
)}
      </div>
    </main>
  );
}


