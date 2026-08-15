"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import LayoutPlanner from "./components/LayoutPlanner";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function Page() {
  const [viewMode, setViewMode] = useState("directory");
  const [modules, setModules] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [photo, setPhoto] = useState("");
  const [standard, setStandard] = useState("T-Trak");
  const [dimensions, setDimensions] = useState("");
  const [status, setStatus] = useState("Active");
  const [notes, setNotes] = useState("");
  const [customWidthInches, setCustomWidthInches] = useState("24");
const [customDepthInches, setCustomDepthInches] = useState("14");
  const [customShape, setCustomShape] = useState("Rectangle");
  const [polygonSides, setPolygonSides] = useState("6");
  const [polygonSideLengths, setPolygonSideLengths] = useState<any>({});
  const [polygonAngles, setPolygonAngles] = useState<any>({});
  const [trackEntryEdge, setTrackEntryEdge] = useState("1");
const [trackExitEdge, setTrackExitEdge] = useState("2");
  const [search, setSearch] = useState("");
  const [standardFilter, setStandardFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [uploading, setUploading] = useState(false);
const [moduleType, setModuleType] = useState("Straight");
const [trackType, setTrackType] = useState("Straight");
  const [bridgeSize, setBridgeSize] = useState("");
const [cornerSize, setCornerSize] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selectedImage, setSelectedImage] = useState(null);
const [dimensionFilter, setDimensionFilter] = useState("All");
  const [ownerName, setOwnerName] = useState("");
  const [mobileEditMode, setMobileEditMode] = useState(false);
 
const [layoutTables, setLayoutTables] = useState<any[]>([]);
  const [layoutLocks, setLayoutLocks] = useState<any>({});
  const [layoutConnections, setLayoutConnections] = useState<any[]>([]);
  const [snapPreview, setSnapPreview] = useState<any>(null);
  const [layoutHistory, setLayoutHistory] = useState<any[]>([]);
const [layoutFuture, setLayoutFuture] = useState<any[]>([]);
  const [layoutOverrides, setLayoutOverrides] = useState<any>({});
const [layoutIncluded, setLayoutIncluded] = useState<any>({});
const [gridWidthFeet, setGridWidthFeet] = useState(20);
const [gridDepthFeet, setGridDepthFeet] = useState(20);
const [layoutZoom, setLayoutZoom] = useState(25);
  const dragHistoryStartedRef = useRef(false);
const svgPlannerRef = useRef<SVGSVGElement | null>(null);
  const layoutCanvasRef = useRef<HTMLDivElement | null>(null);
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
setModuleType("Straight");
setTrackType("Straight");
setCornerSize("");
setBridgeSize("");
setCustomWidthInches("24");
setCustomDepthInches("14");
    setCustomShape("Rectangle");
    setPolygonSides("6");
    setPolygonSideLengths({});
    setPolygonAngles({});
    setTrackEntryEdge("1");
setTrackExitEdge("2");

setNotes("");
  }

  function startEdit(m: any) {
    setEditingId(m.id);
    setName(m.module_name || "");
    setPhoto(m.photo_url || "");
    setStandard(m.standard || "T-Trak");
    setDimensions(m.dimensions || "");
setStatus(m.status || "Active");
    setModuleType(m.module_type || "Straight");
    setTrackType(m.track_type || "Straight");
setCornerSize(m.corner_size || "");
setBridgeSize(m.bridge_size || "");

setCustomWidthInches(m.custom_width_inches || "24");
setCustomDepthInches(m.custom_depth_inches || "14");
    setCustomShape(m.custom_shape || "Rectangle");
setPolygonSides(m.polygon_sides || "6");
    setPolygonSideLengths(m.polygon_side_lengths || {});
    setPolygonAngles(m.polygon_angles || {});
    setTrackEntryEdge(m.track_entry_edge || "1");
setTrackExitEdge(m.track_exit_edge || "2");
setNotes(m.additional_notes || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveModule() {
    if (!user) return alert("Please log in first.");
    if (!name.trim()) return alert("Please enter a module name.");
    if (uploading) return alert("Please wait for photo upload to finish.");


const polygonSideCount = Math.max(3, Number(polygonSides) || 3);

const calculatedCornerA =
  (polygonSideCount - 2) * 180 -
  Array.from({ length: polygonSideCount - 1 }, (_, index) => {
    const value = Number(polygonAngles[index + 1] ?? 90);
    return Number.isFinite(value) ? value : 0;
  }).reduce((sum, value) => sum + value, 0);

const completePolygonAngles = Object.fromEntries(
  Array.from({ length: polygonSideCount }, (_, index) => {
    const sideNumber = index + 1;

    return [
      String(sideNumber),
      String(
        sideNumber === polygonSideCount
          ? calculatedCornerA
          : polygonAngles[sideNumber] ?? "90"
      ),
    ];
  })
);
    const payload = {
      module_name: name,
      owner_name: ownerName || user.email,
      user_id: user.id,
      photo_url: photo,
      standard,
      module_type: moduleType,
      track_type: trackType,
      bridge_size: bridgeSize,
corner_size: cornerSize,
      dimensions,
      custom_width_inches: customWidthInches,
custom_depth_inches: customDepthInches,
      custom_shape: customShape,
      polygon_sides: polygonSides,
polygon_side_lengths: polygonSideLengths,
     polygon_angles: completePolygonAngles,
      track_entry_edge: trackEntryEdge,
track_exit_edge: trackExitEdge,
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

  const LAYOUT_SCALE = 10;
  const FRONT_TRACK_FRONT_EDGE = 15;
  const TRACK_WIDTH = 10;
  const TRACK_CENTER_SPACING = 13;
  const TRACK_SNAP_DISTANCE_MOUSE = 34;
  const TRACK_SNAP_DISTANCE_TOUCH = 56;
  const TRACK_SNAP_LATERAL_MOUSE = 16;
  const TRACK_SNAP_LATERAL_TOUCH = 26;

  const moduleNumberMap = useMemo(() => {
    const sortedModules = [...modules].sort((a, b) => {
      const aTime = Date.parse(a.created_at || "");
      const bTime = Date.parse(b.created_at || "");

      if (!Number.isNaN(aTime) && !Number.isNaN(bTime) && aTime !== bTime) {
        return aTime - bTime;
      }

      return String(a.id || "").localeCompare(String(b.id || ""));
    });

    return sortedModules.reduce((map: any, module: any, index: number) => {
      map[module.id] = index + 1;
      return map;
    }, {});
  }, [modules]);

  const layoutModules = useMemo(() => {
    return filteredModules.filter((module: any) => layoutIncluded[module.id]);
  }, [filteredModules, layoutIncluded]);

  const gridWidthInches = gridWidthFeet * 12;
  const gridDepthInches = gridDepthFeet * 12;
  const gridSvgWidth = gridWidthInches * LAYOUT_SCALE;
  const gridSvgHeight = gridDepthInches * LAYOUT_SCALE;
  const displaySvgWidth = Math.round(gridSvgWidth * (layoutZoom / 100));
  const displaySvgHeight = Math.round(gridSvgHeight * (layoutZoom / 100));

  function normalizeModuleText(value: any) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, " ");
  }

  function getCustomShapeName(m: any) {
    return normalizeModuleText(m.custom_shape);
  }

  function isPolygonModule(m: any) {
    const shape = getCustomShapeName(m);
    return (
      shape.includes("polygon") ||
      shape === "triangle" ||
      shape === "quadrilateral" ||
      shape === "pentagon" ||
      shape === "hexagon" ||
      shape === "heptagon" ||
      shape === "octagon" ||
      shape === "nonagon" ||
      shape === "decagon" ||
      shape === "hendecagon" ||
      shape === "dodecagon"
    );
  }

  function getLayoutKind(m: any) {
    const moduleType = normalizeModuleText(m.module_type);
    const dimensionsText = normalizeModuleText(m.dimensions);
    const customShape = getCustomShapeName(m);

    // Module type describes the module's purpose. The physical outline comes
    // from its selected dimensions/custom-shape fields. A custom outline must
    // therefore take priority over labels such as Inside Corner or Bridge.
    const usesCustomDimensions =
      dimensionsText.includes("other") || dimensionsText.includes("custom");
    const hasExplicitCustomShape =
      customShape === "rectangle" ||
      isPolygonModule(m) ||
      customShape === "angled inside corner" ||
      customShape === "angled outside corner";

    // Any explicitly selected physical shape overrides module_type.
    // module_type is informational/purpose-only.
    if (hasExplicitCustomShape) return "custom";
    if (usesCustomDimensions) return "custom";

    if (dimensionsText.startsWith("end cap")) return "endCap";
    if (dimensionsText.startsWith("single")) return "single";
    if (dimensionsText.startsWith("double")) return "double";
    if (dimensionsText.startsWith("triple")) return "triple";
    if (dimensionsText.startsWith("quad")) return "quad";

    // Standard corner-size selections use the purpose to choose the direction
    // of the curved track, while their outline remains standard corner geometry.
    if (dimensionsText.startsWith("corner")) {
      return moduleType === "inside corner" ? "insideCorner" : "outsideCorner";
    }

    if (moduleType === "bridge") return "bridge";
    if (moduleType === "end cap") return "endCap";
    if (moduleType === "inside corner") return "insideCorner";
    if (moduleType === "outside corner") return "outsideCorner";
    return "custom";
  }

  function getPolygonSideCount(m: any) {
    const shape = getCustomShapeName(m);
    const namedCounts: Record<string, number> = {
      triangle: 3,
      quadrilateral: 4,
      pentagon: 5,
      hexagon: 6,
      heptagon: 7,
      octagon: 8,
      nonagon: 9,
      decagon: 10,
      hendecagon: 11,
      dodecagon: 12,
    };

    const storedCount = Number(m.polygon_sides);
    const count = Number.isFinite(storedCount) && storedCount >= 3
      ? storedCount
      : namedCounts[shape] || 6;

    return Math.max(3, Math.min(12, Math.round(count)));
  }

  function readPolygonValue(source: any, sideNumber: number) {
    if (!source || typeof source !== "object") return undefined;

    const possibleKeys: Array<string | number> = [
      sideNumber,
      String(sideNumber),
      `side${sideNumber}`,
      `side_${sideNumber}`,
      `Side ${sideNumber}`,
    ];

    for (const key of possibleKeys) {
      const value = source[key as any];
      if (value !== undefined && value !== null && value !== "") return Number(value);
    }

    return undefined;
  }

  function getPolygonGeometry(m: any) {
    const sideCount = getPolygonSideCount(m);
    const lengths = m.polygon_side_lengths || {};
    const angles = m.polygon_angles || {};
    const fallbackLength = Math.max(
      1,
      Number(m.custom_width_inches || m.custom_depth_inches || 24)
    );

    const sideLengths = Array.from({ length: sideCount }, (_, index) => {
      const value = readPolygonValue(lengths, index + 1);
      return Math.max(1, Number.isFinite(value) ? Number(value) : fallbackLength) * LAYOUT_SCALE;
    });

    const suppliedAngles = Array.from({ length: sideCount }, (_, index) =>
      readPolygonValue(angles, index + 1)
    );
    const hasCompleteAngles = suppliedAngles.every(
      (value) => Number.isFinite(value) && Number(value) > 0 && Number(value) < 360
    );

    const points: Array<{ x: number; y: number }> = [];
    let x = 0;
    let y = 0;
    let heading = 0;

    for (let index = 0; index < sideCount; index += 1) {
      points.push({ x, y });
      x += Math.cos(heading) * sideLengths[index];
      y += Math.sin(heading) * sideLengths[index];

      const turnDegrees = hasCompleteAngles
        ? 180 - Number(suppliedAngles[index])
        : 360 / sideCount;
      heading += (turnDegrees * Math.PI) / 180;
    }

const finalPoint = { x, y };

const minX = Math.min(
  ...points.map((point) => point.x),
  finalPoint.x
);
const minY = Math.min(
  ...points.map((point) => point.y),
  finalPoint.y
);
const maxX = Math.max(
  ...points.map((point) => point.x),
  finalPoint.x
);
const maxY = Math.max(
  ...points.map((point) => point.y),
  finalPoint.y
);

const normalizedPoints = points.map((point) => ({
  x: point.x - minX,
  y: point.y - minY,
}));

const normalizedFinalPoint = {
  x: finalPoint.x - minX,
  y: finalPoint.y - minY,
};

const enteredPathPoints = [
  ...normalizedPoints,
  normalizedFinalPoint,
];

const closureDistance = Math.hypot(
  normalizedFinalPoint.x - normalizedPoints[0].x,
  normalizedFinalPoint.y - normalizedPoints[0].y
);

return {
  points: normalizedPoints,

  pointsString: normalizedPoints
    .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" "),

  enteredPathPoints,

  enteredPathString: enteredPathPoints
    .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" "),

  finalPoint: normalizedFinalPoint,

  closureDistance,

  width: Math.max(20, maxX - minX),
  height: Math.max(20, maxY - minY),
};
  }
function getPreviewDimensions() {
  const mmToPreview = (mm: number) => (mm / 25.4) * LAYOUT_SCALE;

  if (dimensions === 'Single - 308 mm (12.13")') {
    return { width: mmToPreview(308), height: mmToPreview(365.1) };
  }

  if (dimensions === 'Double - 618 mm (24.33")') {
    return { width: mmToPreview(618), height: mmToPreview(365.1) };
  }

  if (dimensions === 'Triple - 928 mm (36.54")') {
    return { width: mmToPreview(928), height: mmToPreview(365.1) };
  }

  if (dimensions === 'Quad - 1238 mm (48.74")') {
    return { width: mmToPreview(1238), height: mmToPreview(365.1) };
  }

  if (dimensions === 'Corner - 365.1 mm x 365.1 mm (14.38" x 14.38")') {
    return { width: mmToPreview(365.1), height: mmToPreview(365.1) };
  }

  if (dimensions === 'End Cap - 731.8 mm x 365.1 mm (28.81" x 14.38")') {
    return { width: mmToPreview(731.8), height: mmToPreview(365.1) };
  }

  if (dimensions === 'Interchange Double - 390 mm x 618 mm (15.35" x 24.33")') {
    return { width: mmToPreview(618), height: mmToPreview(390) };
  }

  if (dimensions === 'Interchange Triple - 474 mm x 928 mm (18.66" x 36.54")') {
    return { width: mmToPreview(928), height: mmToPreview(474) };
  }

  return {
    width: Math.max(1, Number(customWidthInches) || 24) * LAYOUT_SCALE,
    height: Math.max(1, Number(customDepthInches) || 14) * LAYOUT_SCALE,
  };
}
  function getLayoutSize(m: any) {
    const kind = getLayoutKind(m);

    if (kind === "insideCorner" || kind === "outsideCorner") return { width: 144, height: 144 };
    if (kind === "endCap") return { width: 288, height: 144 };
    if (kind === "single") return { width: 121, height: 144 };
    if (kind === "double") return { width: 243, height: 144 };
    if (kind === "triple") return { width: 365, height: 144 };
    if (kind === "quad") return { width: 487, height: 144 };

    if (kind === "bridge") {
      const bridgeSizeName = normalizeModuleText(m.bridge_size);
      let bridgeWidth = 243;

      if (bridgeSizeName === "single bridge") bridgeWidth = 121;
      if (bridgeSizeName === "double bridge") bridgeWidth = 243;
      if (bridgeSizeName === "triple bridge") bridgeWidth = 365;
      if (bridgeSizeName === "custom bridge") {
        bridgeWidth = Math.max(1, Number(m.custom_width_inches || 24)) * LAYOUT_SCALE;
      }

      return { width: bridgeWidth, height: 80 };
    }

    if (kind === "custom") {
      if (isPolygonModule(m)) {
        const polygon = getPolygonGeometry(m);
        return { width: polygon.width, height: polygon.height };
      }

      return {
        width: Math.max(1, Number(m.custom_width_inches || 24)) * LAYOUT_SCALE,
        height: Math.max(1, Number(m.custom_depth_inches || 14)) * LAYOUT_SCALE,
      };
    }

    return { width: 160, height: 144 };
  }

  function getTemplateSlot(index: number) {
    return {
      x: 80 + (index % 5) * 190,
      y: 140 + Math.floor(index / 5) * 180,
      rotation: 0,
    };
  }

  function getPlacedSlot(m: any, index: number) {
    const baseSlot = getTemplateSlot(index);
    const savedSlot = layoutOverrides[m.id];
    return {
      ...baseSlot,
      ...(savedSlot || {}),
    };
  }

  function getModuleTransform(slot: any, size: any) {
    if (slot.rotation === 90) return `translate(${slot.x + size.height}, ${slot.y}) rotate(90)`;
    if (slot.rotation === 180) return `translate(${slot.x + size.width}, ${slot.y + size.height}) rotate(180)`;
    if (slot.rotation === 270) return `translate(${slot.x}, ${slot.y + size.width}) rotate(270)`;
    return `translate(${slot.x}, ${slot.y})`;
  }

  function isCornerKind(kind: string) {
    return kind === "insideCorner" || kind === "outsideCorner";
  }

  function getTrackRails() {
    const frontRail1 = FRONT_TRACK_FRONT_EDGE;
    const frontRail2 = FRONT_TRACK_FRONT_EDGE + TRACK_WIDTH;
    const rearTrackFrontEdge = FRONT_TRACK_FRONT_EDGE + TRACK_CENTER_SPACING - TRACK_WIDTH / 2;
    const rearRail1 = rearTrackFrontEdge;
    const rearRail2 = rearTrackFrontEdge + TRACK_WIDTH;
    return [frontRail1, frontRail2, rearRail1, rearRail2];
  }

  function snapToGrid(value: number) {
    return Math.round(value / 10) * 10;
  }

  function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
  }

  function getRotatedBounds(slot: any, size: any) {
    if (slot.rotation === 90 || slot.rotation === 270) {
      return { width: size.height, height: size.width };
    }

    return { width: size.width, height: size.height };
  }

  function clampSlotToGrid(slot: any, size: any) {
    const bounds = getRotatedBounds(slot, size);

    return {
      ...slot,
      x: clamp(slot.x, 0, Math.max(0, gridSvgWidth - bounds.width)),
      y: clamp(slot.y, 0, Math.max(0, gridSvgHeight - bounds.height)),
    };
  }

  function getMainTrackCenters() {
    const frontTrackCenter = FRONT_TRACK_FRONT_EDGE + TRACK_WIDTH / 2;
    const rearTrackCenter = frontTrackCenter + TRACK_CENTER_SPACING;

    return [frontTrackCenter, rearTrackCenter];
  }

  function rotatePoint(x: number, y: number, rotation: number, size: any) {
    if (rotation === 90) return { x: size.height - y, y: x };
    if (rotation === 180) return { x: size.width - x, y: size.height - y };
    if (rotation === 270) return { x: y, y: size.width - x };

    return { x, y };
  }

  function rotateDirection(dx: number, dy: number, rotation: number) {
    if (rotation === 90) return { dx: -dy, dy: dx };
    if (rotation === 180) return { dx: -dx, dy: -dy };
    if (rotation === 270) return { dx: dy, dy: -dx };
    return { dx, dy };
  }

  function getTrackEndpointsForModule(m: any, slot: any) {
    const size = getLayoutSize(m);
    const kind = getLayoutKind(m);
    const rotation = slot.rotation || 0;
    const trackCenters = getMainTrackCenters();

    // Each module end has one logical connection point centered between the
    // two parallel main tracks. Snapping this point aligns the complete
    // two-track interface instead of allowing either individual track to grab.
    const connectionCenter =
      trackCenters.reduce((sum, center) => sum + center, 0) /
      trackCenters.length;

    const sideDirection: any = {
      left: { dx: -1, dy: 0 },
      right: { dx: 1, dy: 0 },
      top: { dx: 0, dy: -1 },
      bottom: { dx: 0, dy: 1 },
    };

    const localPoints =
      kind === "endCap"
        ? [{ x: 0, y: connectionCenter, side: "left" }]
        : isCornerKind(kind)
          ? [
              {
                x: 0,
                y:
                  kind === "insideCorner"
                    ? size.height - connectionCenter
                    : connectionCenter,
                side: "left",
              },
              {
                x: size.width - connectionCenter,
                y: kind === "insideCorner" ? 0 : size.height,
                side: kind === "insideCorner" ? "top" : "bottom",
              },
            ]
          : [
              { x: 0, y: connectionCenter, side: "left" },
              { x: size.width, y: connectionCenter, side: "right" },
            ];

    return localPoints.map((point) => {
      const rotated = rotatePoint(point.x, point.y, rotation, size);
      const baseDirection = sideDirection[point.side];
      const direction = rotateDirection(
        baseDirection.dx,
        baseDirection.dy,
        rotation
      );

      return {
        x: slot.x + rotated.x,
        y: slot.y + rotated.y,
        side: point.side,
        key: point.side,
        dx: direction.dx,
        dy: direction.dy,
      };
    });
  }

  function endpointsFaceEachOther(a: any, b: any) {
    return a.dx * b.dx + a.dy * b.dy < -0.9;
  }

  function normalizeEndpointKey(endpointKey: string) {
    // Saved layouts from the older two-dot system used keys such as
    // "0-left" and "1-left". Treat both as the single centered "left" end.
    const parts = String(endpointKey || "").split("-");
    return parts[parts.length - 1];
  }

  function endpointHasConnection(
    moduleId: string,
    endpointKey: string,
    connections: any[] = layoutConnections
  ) {
    return connections.some(
      (connection: any) =>
        (connection.a === moduleId &&
          normalizeEndpointKey(connection.aEndpointKey) ===
            normalizeEndpointKey(endpointKey)) ||
        (connection.b === moduleId &&
          normalizeEndpointKey(connection.bEndpointKey) ===
            normalizeEndpointKey(endpointKey))
    );
  }

  function findBestTrackSnap(
    candidateSlot: any,
    movingModule: any,
    excludedModuleIds: string[],
    snapDistance: number,
    lateralTolerance: number
  ) {
    const movingEndpoints = getTrackEndpointsForModule(movingModule, candidateSlot);
    let bestSnap: any = null;

    layoutModules.forEach((otherModule: any) => {
      if (excludedModuleIds.includes(otherModule.id)) return;

      const otherPermanentIndex = Math.max(
        0,
        (moduleNumberMap[otherModule.id] || 1) - 1
      );
      const otherSlot = getPlacedSlot(otherModule, otherPermanentIndex);
      const otherEndpoints = getTrackEndpointsForModule(otherModule, otherSlot);

      movingEndpoints.forEach((movingEndpoint: any) => {
        if (endpointHasConnection(movingModule.id, movingEndpoint.key)) return;

        otherEndpoints.forEach((otherEndpoint: any) => {
          if (!endpointsFaceEachOther(movingEndpoint, otherEndpoint)) return;
          if (endpointHasConnection(otherModule.id, otherEndpoint.key)) return;

          const dx = otherEndpoint.x - movingEndpoint.x;
          const dy = otherEndpoint.y - movingEndpoint.y;
          const distance = Math.hypot(dx, dy);

          // The target should be mostly straight ahead of the endpoint, not far
          // off to one side. This prevents accidental corner-to-edge grabs.
          const forward = dx * movingEndpoint.dx + dy * movingEndpoint.dy;
          const lateral = Math.abs(
            dx * movingEndpoint.dy - dy * movingEndpoint.dx
          );

          if (forward < -6) return;
          if (lateral > lateralTolerance) return;
          if (distance > snapDistance) return;
          if (bestSnap && distance >= bestSnap.distance) return;

          bestSnap = {
            distance,
            dx,
            dy,
            otherModuleId: otherModule.id,
            movingEndpointKey: movingEndpoint.key,
            otherEndpointKey: otherEndpoint.key,
            movingPoint: movingEndpoint,
            otherPoint: otherEndpoint,
          };
        });
      });
    });

    return bestSnap;
  }

  function applyTrackSnap(
    candidateSlot: any,
    movingModule: any,
    excludedModuleIds: string[],
    snapDistance: number,
    lateralTolerance: number
  ) {
    const movingSize = getLayoutSize(movingModule);
    const bestSnap = findBestTrackSnap(
      candidateSlot,
      movingModule,
      excludedModuleIds,
      snapDistance,
      lateralTolerance
    );

    if (!bestSnap) {
      setSnapPreview(null);
      return {
        slot: clampSlotToGrid(
          {
            ...candidateSlot,
            x: snapToGrid(candidateSlot.x),
            y: snapToGrid(candidateSlot.y),
          },
          movingSize
        ),
        connection: null,
      };
    }

    const snappedSlot = clampSlotToGrid(
      {
        ...candidateSlot,
        x: candidateSlot.x + bestSnap.dx,
        y: candidateSlot.y + bestSnap.dy,
      },
      movingSize
    );

    const snappedMovingEndpoint = getTrackEndpointsForModule(
      movingModule,
      snappedSlot
    ).find((endpoint: any) => endpoint.key === bestSnap.movingEndpointKey);

    const connection = {
      a: movingModule.id,
      b: bestSnap.otherModuleId,
      aEndpointKey: bestSnap.movingEndpointKey,
      bEndpointKey: bestSnap.otherEndpointKey,
    };

    setSnapPreview({
      movingModuleId: movingModule.id,
      otherModuleId: bestSnap.otherModuleId,
      movingEndpointKey: bestSnap.movingEndpointKey,
      otherEndpointKey: bestSnap.otherEndpointKey,
      a: snappedMovingEndpoint || bestSnap.movingPoint,
      b: bestSnap.otherPoint,
    });

    return { slot: snappedSlot, connection };
  }

  function addTrackConnection(connection: any) {
    if (!connection) return;

    setLayoutConnections((previous: any[]) => {
      const sameConnection = (existing: any) =>
        (existing.a === connection.a &&
          existing.b === connection.b &&
          existing.aEndpointKey === connection.aEndpointKey &&
          existing.bEndpointKey === connection.bEndpointKey) ||
        (existing.b === connection.a &&
          existing.a === connection.b &&
          existing.bEndpointKey === connection.aEndpointKey &&
          existing.aEndpointKey === connection.bEndpointKey);

      if (previous.some(sameConnection)) return previous;
      if (
        endpointHasConnection(
          connection.a,
          connection.aEndpointKey,
          previous
        ) ||
        endpointHasConnection(
          connection.b,
          connection.bEndpointKey,
          previous
        )
      ) {
        return previous;
      }

      return [...previous, connection];
    });
  }

function getConnectedModuleIds(startId: string) {
  const visited = new Set<string>();
  const stack = [startId];

  while (stack.length) {
    const current = stack.pop()!;

    if (visited.has(current)) continue;

    visited.add(current);

    layoutConnections.forEach((c: any) => {
      if (c.a === current && !visited.has(c.b)) {
        stack.push(c.b);
      }

      if (c.b === current && !visited.has(c.a)) {
        stack.push(c.a);
      }
    });
  }

  return Array.from(visited);
}

  function moduleHasConnection(moduleId: string) {
    return layoutConnections.some((c: any) => c.a === moduleId || c.b === moduleId);
  }

  function getEndpointForConnection(moduleId: string, endpointKey: string) {
    const module = layoutModules.find((m: any) => m.id === moduleId);
    if (!module) return null;

    const permanentIndex = Math.max(0, (moduleNumberMap[module.id] || 1) - 1);
    const slot = getPlacedSlot(module, permanentIndex);
    return (
      getTrackEndpointsForModule(module, slot).find(
        (endpoint: any) =>
          normalizeEndpointKey(endpoint.key) ===
          normalizeEndpointKey(endpointKey)
      ) || null
    );
  }

  function getConnectionLine(connection: any) {
    const a = getEndpointForConnection(connection.a, connection.aEndpointKey);
    const b = getEndpointForConnection(connection.b, connection.bEndpointKey);

    if (!a || !b) return null;
    return { a, b };
  }

  function isEndpointConnected(moduleId: string, endpointKey: string) {
    return layoutConnections.some(
      (connection: any) =>
        (connection.a === moduleId &&
          normalizeEndpointKey(connection.aEndpointKey) ===
            normalizeEndpointKey(endpointKey)) ||
        (connection.b === moduleId &&
          normalizeEndpointKey(connection.bEndpointKey) ===
            normalizeEndpointKey(endpointKey))
    );
  }

  function isEndpointPreviewed(moduleId: string, endpointKey: string) {
    if (!snapPreview) return false;

    return (
      (snapPreview.movingModuleId === moduleId &&
        normalizeEndpointKey(snapPreview.movingEndpointKey) ===
          normalizeEndpointKey(endpointKey)) ||
      (snapPreview.otherModuleId === moduleId &&
        normalizeEndpointKey(snapPreview.otherEndpointKey) ===
          normalizeEndpointKey(endpointKey))
    );
  }

  function autoArrangeLayout() {
    pushLayoutHistory();

    let cursorX = 80;
    const y = 140;
    const nextOverrides: any = {};
    layoutModules.forEach((m: any) => {
      const size = getLayoutSize(m);
      nextOverrides[m.id] = {
        x: cursorX,
        y,
        rotation: 0,
      };

      cursorX += size.width + 20;
    });

    setLayoutOverrides((prev: any) => ({ ...prev, ...nextOverrides }));
    // Auto Arrange places modules neatly but does not claim track connections.
    // Connections are created only by a successful blue-dot-to-blue-dot snap.
    setLayoutConnections([]);
  }

  function getCurrentLayoutState() {
  return {
    layoutOverrides,
    layoutTables,
    layoutLocks,
    layoutConnections,
  };
}
  function pushLayoutHistory() {
  setLayoutHistory((prev: any[]) => [
    ...prev,
    structuredClone(getCurrentLayoutState()),
  ]);

  setLayoutFuture([]);
  }
  function restoreLayoutState(state: any) {
  setLayoutOverrides(state.layoutOverrides || {});
  setLayoutTables(state.layoutTables || []);
  setLayoutLocks(state.layoutLocks || {});
  setLayoutConnections(state.layoutConnections || []);
}

function undoLayoutChange() {
  setLayoutHistory((history: any[]) => {
    if (history.length === 0) return history;

    const previous = history[history.length - 1];
    const remaining = history.slice(0, -1);

    setLayoutFuture((future: any[]) => [
      structuredClone(getCurrentLayoutState()),
      ...future,
    ]);

    restoreLayoutState(previous);
    return remaining;
  });
}
function redoLayoutChange() {
  setLayoutFuture((future: any[]) => {
    if (future.length === 0) return future;

    const next = future[0];
    const remaining = future.slice(1);
    setLayoutHistory((history: any[]) => [
      ...history,
      structuredClone(getCurrentLayoutState()),
    ]);

    restoreLayoutState(next);
    return remaining;
  });
}
  function getSvgPoint(event: any) {
    const svg = svgPlannerRef.current;

    if (!svg) return { x: 0, y: 0 };

    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;

    const matrix = svg.getScreenCTM();
    if (!matrix) return { x: 0, y: 0 };
    const transformed = point.matrixTransform(matrix.inverse());

    return {
      x: transformed.x,
      y: transformed.y,
    };
  }

  function handleModulePointerDown(event: any, m: any, index: number) {
    event.preventDefault();
    event.stopPropagation();

    if (layoutLocks[m.id]) return;
    if (event.pointerType === "touch" && !mobileEditMode) return;

    pushLayoutHistory();

    const connectedIds = getConnectedModuleIds(m.id);
    const permanentIndex = Math.max(
      0,
      (moduleNumberMap[m.id] || index + 1) - 1
    );
    const startingSlot = getPlacedSlot(m, permanentIndex);
    const startingPoint = getSvgPoint(event);
    const startingX = startingSlot.x;
    const startingY = startingSlot.y;
    const snapDistance =
      event.pointerType === "touch"
        ? TRACK_SNAP_DISTANCE_TOUCH
        : TRACK_SNAP_DISTANCE_MOUSE;
    const lateralTolerance =
      event.pointerType === "touch"
        ? TRACK_SNAP_LATERAL_TOUCH
        : TRACK_SNAP_LATERAL_MOUSE;

    let pendingConnection: any = null;

    function moveHandler(moveEvent: any) {
      const currentPoint = getSvgPoint(moveEvent);
      const candidateSlot = {
        ...startingSlot,
        x: startingX + currentPoint.x - startingPoint.x,
        y: startingY + currentPoint.y - startingPoint.y,
      };

      const snapResult = applyTrackSnap(
        candidateSlot,
        m,
        connectedIds,
        snapDistance,
        lateralTolerance
      );
      const snappedSlot = snapResult.slot;
      pendingConnection = snapResult.connection;

      setLayoutOverrides((previous: any) => {
        const deltaX = snappedSlot.x - startingSlot.x;
        const deltaY = snappedSlot.y - startingSlot.y;
        const next = { ...previous };

        connectedIds.forEach((connectedId) => {
          const connectedModule = layoutModules.find(
            (module: any) => module.id === connectedId
          );
          if (!connectedModule) return;

          const connectedIndex = Math.max(
            0,
            (moduleNumberMap[connectedModule.id] || 1) - 1
          );
          const connectedSlot = getPlacedSlot(
            connectedModule,
            connectedIndex
          );

          next[connectedId] = {
            ...connectedSlot,
            ...(previous[connectedId] || {}),
            x: connectedSlot.x + deltaX,
            y: connectedSlot.y + deltaY,
          };
        });

        return next;
      });
    }

    function upHandler() {
      if (pendingConnection) addTrackConnection(pendingConnection);
      setSnapPreview(null);
      window.removeEventListener("pointermove", moveHandler);
      window.removeEventListener("pointerup", upHandler);
      window.removeEventListener("pointercancel", upHandler);
    }

    window.addEventListener("pointermove", moveHandler);
    window.addEventListener("pointerup", upHandler);
    window.addEventListener("pointercancel", upHandler);
  }

  function rotateModule(event: any, m: any, index: number) {
    event.preventDefault();
    event.stopPropagation();

    const connectedIds = getConnectedModuleIds(m.id);
    const groupModules = connectedIds
      .map((id) => layoutModules.find((module: any) => module.id === id))
      .filter(Boolean);

    if (groupModules.some((module: any) => layoutLocks[module.id])) return;
    pushLayoutHistory();

    const currentItems = groupModules.map((module: any) => {
      const permanentIndex = Math.max(0, (moduleNumberMap[module.id] || 1) - 1);
      const slot = getPlacedSlot(module, permanentIndex);
      const size = getLayoutSize(module);
      const bounds = getRotatedBounds(slot, size);

      return {
        module,
        slot,
        size,
        center: {
          x: slot.x + bounds.width / 2,
          y: slot.y + bounds.height / 2,
        },
      };
    });

    const groupCenter = {
      x: currentItems.reduce((sum, item) => sum + item.center.x, 0) / currentItems.length,
      y: currentItems.reduce((sum, item) => sum + item.center.y, 0) / currentItems.length,
    };

    const nextItems = currentItems.map((item) => {
      const relativeX = item.center.x - groupCenter.x;
      const relativeY = item.center.y - groupCenter.y;
      const nextCenter = {
        x: groupCenter.x - relativeY,
        y: groupCenter.y + relativeX,
      };
      const nextRotation = ((item.slot.rotation || 0) + 90) % 360;
      const nextBounds =
        nextRotation === 90 || nextRotation === 270
          ? { width: item.size.height, height: item.size.width }
          : { width: item.size.width, height: item.size.height };

      return {
        id: item.module.id,
        slot: {
          ...item.slot,
          x: nextCenter.x - nextBounds.width / 2,
          y: nextCenter.y - nextBounds.height / 2,
          rotation: nextRotation,
        },
        bounds: nextBounds,
      };
    });

    const minX = Math.min(...nextItems.map((item) => item.slot.x));
    const minY = Math.min(...nextItems.map((item) => item.slot.y));
    const maxX = Math.max(...nextItems.map((item) => item.slot.x + item.bounds.width));
    const maxY = Math.max(...nextItems.map((item) => item.slot.y + item.bounds.height));

    const correctionX = minX < 0 ? -minX : maxX > gridSvgWidth ? gridSvgWidth - maxX : 0;
    const correctionY = minY < 0 ? -minY : maxY > gridSvgHeight ? gridSvgHeight - maxY : 0;

    setLayoutOverrides((prev: any) => {
      const next = { ...prev };

      nextItems.forEach((item) => {
        next[item.id] = {
          ...(prev[item.id] || {}),
          ...item.slot,
          x: item.slot.x + correctionX,
          y: item.slot.y + correctionY,
        };
      });

      return next;
    });
  }

  function toggleModuleGroupLock(moduleId: string) {
    pushLayoutHistory();
    const connectedIds = getConnectedModuleIds(moduleId);
    const shouldLock = connectedIds.some((id) => !layoutLocks[id]);

    setLayoutLocks((prev: any) => {
      const next = { ...prev };
      connectedIds.forEach((id) => {
        next[id] = shouldLock;
      });
      return next;
    });
  }

  function addLayoutTable(kind: "6ft" | "8ft") {
    pushLayoutHistory();
    const width = kind === "6ft" ? 72 * LAYOUT_SCALE : 96 * LAYOUT_SCALE;
    const height = 30 * LAYOUT_SCALE;

    setLayoutTables((current) => [
      ...current,
      {
        id: `table-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        kind,
        x: 120,
        y: 120 + current.length * 40,
        width,
        height,
        rotation: 0,
      },
    ]);
  }

  function getTableTransform(table: any) {
    if (table.rotation === 90) return `translate(${table.x + table.height}, ${table.y}) rotate(90)`;
    if (table.rotation === 180) return `translate(${table.x + table.width}, ${table.y + table.height}) rotate(180)`;
    if (table.rotation === 270) return `translate(${table.x}, ${table.y + table.width}) rotate(270)`;
    return `translate(${table.x}, ${table.y})`;
  }

  function handleTablePointerDown(event: any, table: any) {
    event.preventDefault();
    event.stopPropagation();

    if (layoutLocks[table.id]) return;
    pushLayoutHistory();
    if (event.pointerType === "touch" && !mobileEditMode) return;

    const startingPoint = getSvgPoint(event);
    const startingX = table.x;
    const startingY = table.y;

    function moveHandler(moveEvent: any) {
      if (!dragHistoryStartedRef.current) {
  pushLayoutHistory();
dragHistoryStartedRef.current = true;
      }
      const currentPoint = getSvgPoint(moveEvent);

      setLayoutTables((current) =>
        current.map((item) => {
          if (item.id !== table.id) return item;

          const candidate = {
            ...item,
            x: snapToGrid(startingX + currentPoint.x - startingPoint.x),
            y: snapToGrid(startingY + currentPoint.y - startingPoint.y),
          };

          const clamped = clampSlotToGrid(candidate, {
            width: item.width,
            height: item.height,
          });

          return {
            ...item,
            x: clamped.x,
            y: clamped.y,
          };
        })
      );
    }

    function upHandler() {
      dragHistoryStartedRef.current = false;
      window.removeEventListener("pointermove", moveHandler);
      window.removeEventListener("pointerup", upHandler);
    }

    window.addEventListener("pointermove", moveHandler);
    window.addEventListener("pointerup", upHandler);
  }

  function rotateTable(event: any, table: any) {
    event.preventDefault();
    event.stopPropagation();

    if (layoutLocks[table.id]) return;
    pushLayoutHistory();

    setLayoutTables((current) =>
      current.map((item) => {
        if (item.id !== table.id) return item;

        const next = {
          ...item,
          rotation: ((item.rotation || 0) + 90) % 360,
        };

        const clamped = clampSlotToGrid(next, {
          width: item.width,
          height: item.height,
        });

        return {
          ...next,
          x: clamped.x,
          y: clamped.y,
        };
      })
    );
  }

  function toggleLayoutLock(id: string) {
    pushLayoutHistory();
    setLayoutLocks((prev: any) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  function deleteLayoutTable(id: string) {
    pushLayoutHistory();
    setLayoutTables((current) => current.filter((table) => table.id !== id));
    setLayoutLocks((prev: any) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }
  function zoomLayout(direction: "in" | "out") {
    setLayoutZoom((current) => {
      const next = direction === "in" ? current + 10 : current - 10;
      return Math.min(100, Math.max(15, next));
    });
  }

  function panLayout(dx: number, dy: number) {
    layoutCanvasRef.current?.scrollBy({
      left: dx,
      top: dy,
      behavior: "smooth",
    });
  }

  function saveLayoutDesign() {
    const savedLayout = {
      layoutOverrides,
      layoutIncluded,
      gridWidthFeet,
      gridDepthFeet,
      layoutZoom,
      layoutTables,
      layoutLocks,
      layoutConnections,
    };

    window.localStorage.setItem("cans-layout-design-v2", JSON.stringify(savedLayout));
    alert("Layout saved on this device.");
  }

  function loadLayoutDesign() {
    const saved =
      window.localStorage.getItem("cans-layout-design-v2") ||
      window.localStorage.getItem("cans-layout-design-v1");

    if (!saved) {
      alert("No saved layout found on this device.");
      return;
    }

    const parsed = JSON.parse(saved);

    setLayoutOverrides(parsed.layoutOverrides || {});
    setLayoutIncluded(parsed.layoutIncluded || {});
    setGridWidthFeet(parsed.gridWidthFeet || 20);
    setGridDepthFeet(parsed.gridDepthFeet || 20);
    setLayoutZoom(parsed.layoutZoom || 25);
    setLayoutTables(parsed.layoutTables || []);
    setLayoutLocks(parsed.layoutLocks || {});
    setLayoutConnections(parsed.layoutConnections || []);
  }

  function exportLayoutPDF() {
    window.print();
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
.layoutGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  margin-top: 20px;
}

.layoutBlock {
  background: #202020;
  color: white;
  border-left: 6px solid #ffd21f;
  border-radius: 18px;
  padding: 16px;
  min-height: 100px;
  box-shadow: 0 8px 18px rgba(0,0,0,.18);
}
.singleBlock {
  min-height: 90px;
}

.doubleBlock {
  min-height: 120px;
}

.tripleBlock {
  min-height: 150px;
} 

.quadBlock {
  min-height: 180px;
}

.cornerBlock {
  border-radius: 28px 28px 28px 8px;
  border-left: 8px solid #ffd21f;
}

.bridgeBlock {
  border-left: 8px solid #999;
}

.customBlock {
  border-left: 8px solid #b00020;
}

.layoutTitle {
  font-size: 18px;
  font-weight: 900;
  margin-bottom: 10px;
}

.layoutMeta {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 6px;
}
        
.layoutControlBtn {
  background: #050505;
  color: #ffd21f;
  padding: 10px 12px;
  border-radius: 12px;
  min-width: 44px;
}

.layoutControlBtn.small {
  min-width: 38px;
  padding: 8px 10px;
}

.layoutZoomLabel {
  font-weight: 900;
  background: #eee;
  border-radius: 999px;
  padding: 8px 12px;
}

.layoutCanvas.editMode {
  touch-action: none;
  overscroll-behavior: contain;
}

.layoutCanvas.editMode .svgPlanner,
.layoutCanvas.editMode .svgModuleGroup,
.layoutCanvas.editMode .svgTableGroup {
  touch-action: none;
}
.svgTableGroup {
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.svgTable {
  fill: rgba(70, 155, 255, .28);
  stroke: #1f6fbf;
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
}

.svgTableLabel {
  fill: #14508a;
  font-size: 18px;
  font-weight: 900;
  text-anchor: middle;
  dominant-baseline: central;
}
@media print {
  body * {
    visibility: hidden;
  }

  .layoutPrintArea, .layoutPrintArea * {
    visibility: visible;
  }

  .layoutPrintArea {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }

  .layoutControls,
  .layoutLegend,
  .filtersPanel,
  .toolbar,
  .viewToggle,
  .hero {
    display: none !important;
  }

  .layoutCanvas {
    max-height: none;
    overflow: visible;
    border: 0;
  }
}


.layoutCanvas {
  background: white;
  border: 1px solid #ddd;
  border-radius: 20px;
  overflow: auto;
  padding: 8px;
  max-width: 100%;
  max-height: 80vh;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x pan-y;
  overscroll-behavior: contain;
}

.layoutControls {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 14px;
}

.layoutControls label {
  font-weight: 900;
}

.layoutControls select {
  width: auto;
  min-width: 130px;
  padding: 10px 12px;
}

.layoutControlBtn {
  background: #050505;
  color: #ffd21f;
  padding: 10px 12px;
  border-radius: 12px;
  min-width: 44px;
}
.layoutControlBtn.small {
  min-width: 38px;
  padding: 8px 10px;
}

.layoutZoomLabel {
  font-weight: 900;
  background: #eee;
  border-radius: 999px;
  padding: 8px 12px;
}

.layoutCanvas.editMode {
  touch-action: none;
  overscroll-behavior: contain;
}

.svgPlanner {
  width: auto;
  height: auto;
  display: block;
  background: #fafafa;
}

.layoutCanvas.editMode .svgPlanner,
.layoutCanvas.editMode .svgModuleGroup,
.layoutCanvas.editMode .svgTableGroup {
  touch-action: none;
}

.svgModuleGroup,
.svgTableGroup {
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.svgModule {
  fill: rgba(198, 226, 178, .55);
  stroke: #3d6b2d;
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
}
.svgModule.custom {
  stroke: #b00020;
}

.svgModule.bridge {
  stroke: #6b4b20;
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
  font-size: 28px;
  font-weight: 900;
  text-anchor: middle;
  dominant-baseline: central;
  pointer-events: none;
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
.svgLockCircle {
  fill: #b00020;
  stroke: white;
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
}

.svgLockCircle.locked {
  fill: #777;
}
.svgLockText {
  fill: white;
  font-size: 11px;
  font-weight: 900;
  text-anchor: middle;
  dominant-baseline: central;
  pointer-events: none;
}

.svgDeleteCircle {
  fill: #b00020;
  stroke: white;
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
}

.svgDeleteText {
  fill: white;
  font-size: 15px;
  font-weight: 900;
  text-anchor: middle;
  dominant-baseline: central;
  pointer-events: none;
}

.svgTable {
  fill: rgba(70, 155, 255, .28);
  stroke: #1f6fbf;
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
}

.svgTableLabel {
  fill: #14508a;
  font-size: 18px;
  font-weight: 900;
  text-anchor: middle;
  dominant-baseline: central;
}

.svgConnectionLine {
  stroke: #ff8c00;
  stroke-width: 3;
  stroke-dasharray: 10 7;
  opacity: .85;
  vector-effect: non-scaling-stroke;
}

.svgSnapPoint {
  stroke: white;
  stroke-width: 2.5;
  vector-effect: non-scaling-stroke;
  pointer-events: none;
}

.svgSnapPoint.available {
  fill: #1f6fff;
}

.svgSnapPoint.candidate {
  fill: #ffd21f;
  stroke: #050505;
}

.svgSnapPoint.connected {
  fill: #18a558;
  stroke: white;
}

.plannerKey {
  background: #fff;
  border: 2px solid #ffd21f;
  border-radius: 16px;
  margin-bottom: 14px;
  overflow: hidden;
}

.plannerKey summary {
  background: #050505;
  color: #ffd21f;
  cursor: pointer;
  font-size: 17px;
  font-weight: 900;
  padding: 13px 16px;
}

.symbolDot {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  border: 2px solid white;
  box-shadow: 0 0 0 1px #777;
  flex: 0 0 auto;
}

.symbolDot.available { background: #1f6fff; }
.symbolDot.candidate { background: #ffd21f; box-shadow: 0 0 0 1px #050505; }
.symbolDot.connected { background: #18a558; }

.symbolIcon {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  flex: 0 0 auto;
}

.symbolIcon.rotate, .symbolIcon.number { background: #ffd21f; color: #050505; }
.symbolIcon.lock, .symbolIcon.delete { background: #b00020; color: white; }
.symbolIcon.disconnect { background: #ff6b35; color: white; }

.symbolKeyGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
  padding: 12px 14px;
  border-top: 1px solid #eee;
}

.symbolKeyItem {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.symbolSwatch {
  width: 22px;
  height: 14px;
  border-radius: 4px;
  border: 2px solid #3d6b2d;
  background: rgba(198, 226, 178, .55);
  flex: 0 0 auto;
}

.symbolSwatch.custom { border-color: #b00020; }
.symbolSwatch.bridge { border-color: #6b4b20; }
.symbolSwatch.table { border-color: #1f6fbf; background: rgba(70, 155, 255, .28); }
.symbolSwatch.connection { border-color: #ff8c00; background: repeating-linear-gradient(90deg, #ff8c00 0 8px, transparent 8px 14px); }
.symbolSwatch.snap { border-radius: 999px; width: 14px; height: 14px; border-color: white; background: #1f6fff; }

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

.legendRow {
  display: grid;
  grid-template-columns: 24px 44px 1fr;
  gap: 10px;
  padding: 10px 14px;
  border-top: 1px solid #eee;
  align-items: start;
}

.legendCheckbox {
  width: 18px;
  height: 18px;
  margin: 0;
  accent-color: #ffd21f;
}
.legendNumber {
  background: #ffd21f;
  color: #050505;
  border-radius: 999px;
  font-weight: 900;
  text-align: center;
  padding: 5px 0;
}

.legendNumber.inactive {
  background: #ddd;
  color: #555;
}

.legendText {
  font-size: 14px;
  line-height: 1.35;
}

.legendText strong {
  display: block;
  font-size: 15px;
}

@media print {
  body * {
    visibility: hidden;
  }

  .layoutPrintArea, .layoutPrintArea * {
    visibility: visible;
  }

  .layoutPrintArea {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }

  .layoutControls,
  .layoutLegend,
  .filtersPanel,
  .toolbar,
  .viewToggle,
  .hero {
    display: none !important;
  }

  .layoutCanvas {
    max-height: none;
    overflow: visible;
    border: 0;
  }
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
<label>Track Path</label>
<select
  value={trackType}
  onChange={(e) => setTrackType(e.target.value)}
>
  <option>Straight</option>
  <option>Inside Curve</option>
  <option>Outside Curve</option>
</select>
              {moduleType === "Bridge" && (
  <select
    value={bridgeSize}
    onChange={(e) => setBridgeSize(e.target.value)}
  >
    <option value="">Select bridge size</option>
    <option>Single Bridge</option>
    <option>Double Bridge</option>
    <option>Triple Bridge</option>
    <option>Custom Bridge</option>
  </select>
)}
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
              {(dimensions === "Other / custom" ||
  bridgeSize === "Custom Bridge") && (
  <>
    <div>
      <label>Custom Shape</label>
      <select
        value={customShape}
        onChange={(e) => setCustomShape(e.target.value)}
      >
        <option>Rectangle</option>
        <option>Angled Inside Corner</option>
        <option>Angled Outside Corner</option>
        <option>Polygon</option>
      </select>
    </div>

    {customShape === "Polygon" && (
      <div>
        <label>Number of Sides</label>
        <select
          value={polygonSides}
          onChange={(e) => setPolygonSides(e.target.value)}
        >
          {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((sideCount) => (
            <option key={sideCount} value={String(sideCount)}>
              {sideCount} sides
            </option>
          ))}
        </select>
<label>
  Track Entry Edge
  <select
    value={trackEntryEdge}
    onChange={(event) => setTrackEntryEdge(event.target.value)}
  >
    {Array.from({ length: Math.max(3, Number(polygonSides) || 3) }, (_, index) => (
      <option key={index + 1} value={String(index + 1)}>
        Edge {index + 1}
      </option>
    ))}
  </select>
</label>
<label>
  Track Exit Edge
  <select
    value={trackExitEdge}
    onChange={(event) => setTrackExitEdge(event.target.value)}
  >
    {Array.from(
      { length: Math.max(3, Number(polygonSides) || 3) },
      (_, index) => (
        <option key={index + 1} value={String(index + 1)}>
          Edge {index + 1}
        </option>
      )
    )}
  </select>
</label>

<div
  style={{
    marginTop: "16px",
    marginBottom: "16px",
    padding: "12px",
    border: "1px solid #ccc",
    borderRadius: "12px",
    background: "#fafafa",
  }}
>
  <strong>Live Module Preview</strong>

  <div style={{ marginTop: "10px", overflow: "auto" }}>
    {(() => {
const previewSideCount = Math.max(3, Number(polygonSides) || 3);

const calculatedCornerA =
  (previewSideCount - 2) * 180 -
  Array.from({ length: previewSideCount - 1 }, (_, index) => {
    const value = Number(polygonAngles[index + 1] ?? 90);
    return Number.isFinite(value) ? value : 0;
  }).reduce((sum, value) => sum + value, 0);

const previewAngles = Object.fromEntries(
  Array.from({ length: previewSideCount }, (_, index) => {
    const sideNumber = index + 1;

    return [
      String(sideNumber),
      String(
        sideNumber === previewSideCount
          ? calculatedCornerA
          : polygonAngles[sideNumber] ?? "90"
      ),
    ];
  })
);

      const previewModule = {
        custom_shape: "Polygon",
        polygon_sides: polygonSides,
        polygon_side_lengths: polygonSideLengths,
        polygon_angles: previewAngles,
      };

      const preview = getPolygonGeometry(previewModule);
const previewPathPoints = preview.enteredPathPoints;

const getPreviewEdgeMidpoint = (edgeValue: string) => {
  const edgeNumber = Math.max(
    1,
    Math.min(Number(edgeValue) || 1, previewPathPoints.length - 1)
  );

  const start = previewPathPoints[edgeNumber - 1];
  const end = previewPathPoints[edgeNumber];

  return {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };
};

const trackEntry = getPreviewEdgeMidpoint(trackEntryEdge);
const trackExit = getPreviewEdgeMidpoint(trackExitEdge);

const trackDx = trackExit.x - trackEntry.x;
const trackDy = trackExit.y - trackEntry.y;
const trackLength = Math.max(1, Math.hypot(trackDx, trackDy));

const normalX = -trackDy / trackLength;
const normalY = trackDx / trackLength;

const trackSpacing = 6;

const moduleCenter = {
  x: preview.width / 2,
  y: preview.height / 2,
};

const trackMidpoint = {
  x: (trackEntry.x + trackExit.x) / 2,
  y: (trackEntry.y + trackExit.y) / 2,
};

const centerVector = {
  x: moduleCenter.x - trackMidpoint.x,
  y: moduleCenter.y - trackMidpoint.y,
};

const curveDirection =
  trackType === "Inside Curve"
    ? 1
    : trackType === "Outside Curve"
      ? -1
      : 0;

const tTrakRadiusPairs: Record<string, [number, number]> = {
  "Small Inside Corner - 195 mm / 220 mm": [195, 220],
  "Medium Inside Corner - 220 mm / 245 mm": [220, 245],
  "Large Inside Corner - 245 mm / 270 mm": [245, 270],
  "Large Radius - 315 mm / 348 mm": [315, 348],
  "Large Radius - 348 mm / 381 mm": [348, 381],
  "Large Radius - 381 mm / 414 mm": [381, 414],
  "Large Radius - 447 mm / 480 mm": [447, 480],
};

const selectedRadiusPair =
  tTrakRadiusPairs[cornerSize] || [220, 245];

const innerTrackRadius =
  (selectedRadiusPair[0] / 25.4) * LAYOUT_SCALE;

const outerTrackRadius =
  (selectedRadiusPair[1] / 25.4) * LAYOUT_SCALE;
      return (
        <svg
          width="320"
          height="220"
          viewBox={`-20 -20 ${preview.width + 40} ${preview.height + 40}`}
          style={{
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "8px",
          }}
        >
         <polyline
  points={preview.enteredPathString}
  fill="none"
  stroke="#3d6b2d"
  strokeWidth="2"
/>

<line
  x1={preview.finalPoint.x}
  y1={preview.finalPoint.y}
  x2={preview.points[0].x}
  y2={preview.points[0].y}
  stroke="#b00020"
  strokeWidth="2"
  strokeDasharray="6 4"
/>
{[-trackSpacing / 2, trackSpacing / 2].map((offset, index) => {
  const startX = trackEntry.x + normalX * offset;
  const startY = trackEntry.y + normalY * offset;
  const endX = trackExit.x + normalX * offset;
  const endY = trackExit.y + normalY * offset;

  if (trackType === "Straight") {
    return (
      <line
        key={`track-${index}`}
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke="#444"
        strokeWidth="2"
      />
    );
  }

  const radius =
    index === 0 ? innerTrackRadius : outerTrackRadius;

  const chordLength = Math.hypot(
    endX - startX,
    endY - startY
  );

  const safeRadius = Math.max(
    radius,
    chordLength / 2 + 0.01
  );

  const largeArcFlag = 0;

  const sweepFlag =
    trackType === "Inside Curve" ? 1 : 0;

  return (
    <path
      key={`track-${index}`}
      d={`M ${startX} ${startY} A ${safeRadius} ${safeRadius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`}
      fill="none"
      stroke="#444"
      strokeWidth="2"
    />
  );
})}
     {preview.points.map((point: any, index: number) => {
  const next =
    preview.points[(index + 1) % preview.points.length];

  const cornerLetter = String.fromCharCode(65 + index);

  return (
    <g key={`preview-edge-${index}`}>
      <text
        x={(point.x + next.x) / 2}
        y={(point.y + next.y) / 2}
        fontSize="12"
        fontWeight="700"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#111"
      >
        {index + 1}
      </text>

      <circle
        cx={point.x}
        cy={point.y}
        r="9"
        fill="#ffd21f"
        stroke="#111"
        strokeWidth="1"
      />

      <text
        x={point.x}
        y={point.y}
        fontSize="10"
        fontWeight="900"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#111"
      >
        {cornerLetter}
      </text>
    </g>
  );
})}
        </svg>
      );
    })()}
  </div>
</div>
        {Array.from({ length: Number(polygonSides) }, (_, i) => i + 1).map((sideNumber) => (
          <div key={sideNumber}>
            <label>Side {sideNumber} Length (inches)</label>
            <select
              value={polygonSideLengths[sideNumber] || "24"}
              onChange={(e) =>
                setPolygonSideLengths((prev: any) => ({
                  ...prev,
                  [sideNumber]: e.target.value,
                }))
              }
            >
              

              {Array.from({ length: 100 }, (_, i) => i + 1).map((inch) => (
                <option key={inch} value={String(inch)}>
                  {inch}"
                </option>
              ))}
            </select>

           {sideNumber === Number(polygonSides) ? (
  <>
    <label>
      Corner A Angle (calculated)
    </label>

    <input
      type="text"
      readOnly
      value={`${(
        (Math.max(3, Number(polygonSides) || 3) - 2) * 180 -
        Array.from(
          { length: Math.max(3, Number(polygonSides) || 3) - 1 },
          (_, index) => {
            const value = Number(polygonAngles[index + 1] ?? 90);
            return Number.isFinite(value) ? value : 0;
          }
        ).reduce((sum, value) => sum + value, 0)
      ).toFixed(1)}°`}
      style={{
        background: "#eee",
        fontWeight: "700",
      }}
    />
  </>
) : (
  <>
    <label>
      Corner {String.fromCharCode(65 + sideNumber)} Angle
      {" "}(after Side {sideNumber}) (degrees)
    </label>

    <input
      type="number"
      inputMode="decimal"
      min="1"
      max="359"
      step="0.1"
      value={polygonAngles[sideNumber] ?? "90"}
      onChange={(e) => {
        setPolygonAngles((prev: any) => ({
          ...prev,
          [sideNumber]: e.target.value,
        }));
      }}
      onBlur={(e) => {
        const parsed = Number(e.target.value);
        const safeAngle = Number.isFinite(parsed)
          ? Math.min(359, Math.max(1, parsed))
          : 90;

        setPolygonAngles((prev: any) => ({
          ...prev,
          [sideNumber]: String(safeAngle),
        }));
      }}
    />
  </>
)}
          </div>
        ))}

        <p style={{ marginTop: "12px", color: "#555", fontSize: "14px" }}>
          For a closed {polygonSides}-sided polygon, the interior angles should total{" "}
          {(Math.max(3, Number(polygonSides) || 3) - 2) * 180}°. Current total:{" "}
          {Array.from({ length: Math.max(3, Number(polygonSides) || 3) }, (_, index) => {
            const value = Number(polygonAngles[index + 1] ?? 90);
            return Number.isFinite(value) ? value : 0;
          }).reduce((sum, value) => sum + value, 0)}°.
        </p>
      </div>
    )}

    {customShape !== "Polygon" && (
      <div>
        <label>Custom Width (inches)</label>
        <select
          value={customWidthInches}
          onChange={(e) => setCustomWidthInches(e.target.value)}
        >
          {Array.from({ length: 100 }, (_, i) => String(i + 1)).map((inch) => (
            <option key={inch} value={inch}>
              {inch}"
            </option>
          ))}
        </select>
        <label>Custom Depth (inches)</label>
        <select
          value={customDepthInches}
          onChange={(e) => setCustomDepthInches(e.target.value)}
        >
          {Array.from({ length: 100 }, (_, i) => String(i + 1)).map((inch) => (
            <option key={inch} value={inch}>
              {inch}"
            </option>
          ))}
        </select>
        <div
  style={{
    marginTop: "16px",
    marginBottom: "16px",
    padding: "12px",
    border: "1px solid #ccc",
    borderRadius: "12px",
    background: "#fafafa",
  }}
>
  <strong>Live Module Preview</strong>

  <div style={{ marginTop: "10px" }}>
    <svg
      width="320"
      height="220"
      viewBox={`0 0 ${getPreviewDimensions().width} ${getPreviewDimensions().height}`}
      style={{
        background: "white",
        border: "1px solid #ddd",
        borderRadius: "8px",
      }}
    >
      <rect
  x="0"
  y="0"
  width={getPreviewDimensions().width}
  height={getPreviewDimensions().height}
  fill="rgba(198, 226, 178, .55)"
  stroke="#3d6b2d"
  strokeWidth="2"
/>
      {[0.42, 0.58].map((fraction, index) => (
  <line
    key={`rect-track-${index}`}
    x1="0"
    y1={Math.max(1, Number(customDepthInches)) * LAYOUT_SCALE * fraction}
    x2={Math.max(1, Number(customWidthInches)) * LAYOUT_SCALE}
    y2={Math.max(1, Number(customDepthInches)) * LAYOUT_SCALE * fraction}
    stroke="#444"
    strokeWidth="2"
  />
))}
    </svg>
  </div>
</div>
      </div>
    )}
  </>
)}{dimensions && dimensions !== "Other / custom" && (
  <div
    style={{
      marginTop: "16px",
      marginBottom: "16px",
      padding: "12px",
      border: "1px solid #ccc",
      borderRadius: "12px",
      background: "#fafafa",
    }}
  >
    <strong>Live Module Preview</strong>

    <div style={{ marginTop: "10px" }}>
      {(() => {
        const previewSize = getPreviewDimensions();

        return (
          <svg
            width="320"
            height="220"
            viewBox={`0 0 ${previewSize.width} ${previewSize.height}`}
            style={{
              background: "white",
              border: "1px solid #ddd",
              borderRadius: "8px",
            }}
          >
            <rect
              x="0"
              y="0"
              width={previewSize.width}
              height={previewSize.height}
              fill="rgba(198, 226, 178, .55)"
              stroke="#3d6b2d"
              strokeWidth="2"
            />

         {dimensions === 'Corner - 365.1 mm x 365.1 mm (14.38" x 14.38")' ? (
  <>
    {[0.42, 0.58].map((fraction, index) => {
      const radius = previewSize.width * fraction;

      return (
        <path
          key={`corner-track-${index}`}
          d={`
            M 0 ${radius}
            A ${radius} ${radius} 0 0 1 ${radius} 0
          `}
          fill="none"
          stroke="#444"
          strokeWidth="2"
        />
      );
    })}
  </>
) : (
  <>
    {[0.42, 0.58].map((fraction, index) => (
      <line
        key={`standard-track-${index}`}
        x1="0"
        y1={previewSize.height * fraction}
        x2={previewSize.width}
        y2={previewSize.height * fraction}
        stroke="#444"
        strokeWidth="2"
      />
    ))}
  </>
)}
          </svg>
        );
      })()}
    </div>
  </div>
)}

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

  {m.bridge_size && (
    <> — {m.bridge_size}</>
  )}
</p>
)}
                {m.dimensions && (
                  <p>
                    <b>Size:</b> {m.dimensions}
                  </p>
              )}
                {m.dimensions === "Other / custom" && m.custom_shape !== "Polygon" && (
  <p>
    Custom Size: {m.custom_width_inches}" W × {m.custom_depth_inches}" D
  </p>
)}
                {m.dimensions === "Other / custom" && m.custom_shape && (
  <p>
    <b>Shape:</b> {m.custom_shape}
  </p>
)}
                {m.custom_shape === "Polygon" && m.polygon_side_lengths && (
  <p>
    <b>Polygon Sides:</b>{" "}
    {Object.entries(m.polygon_side_lengths)
      .map(([side, length]) => `Side ${side}: ${length}"`)
      .join(", ")}
  </p>
)}
                {m.custom_shape === "Polygon" && m.polygon_angles && (
  <p>
    <b>Polygon Angles:</b>{" "}
    {Object.entries(m.polygon_angles)
      .map(([side, angle]) => `Side ${side}: ${angle}°`)
      .join(", ")}
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
          <LayoutPlanner
            planner={{
              mobileEditMode,
              setMobileEditMode,
              layoutCanvasRef,
              gridWidthFeet,
              setGridWidthFeet,
              gridDepthFeet,
              setGridDepthFeet,
              layoutZoom,
              zoomLayout,
              panLayout,
              addLayoutTable,
              autoArrangeLayout,
              saveLayoutDesign,
              loadLayoutDesign,
              exportLayoutPDF,
              undoLayoutChange,
              layoutHistory,
              redoLayoutChange,
              layoutFuture,
              svgPlannerRef,
              displaySvgWidth,
              displaySvgHeight,
              gridSvgWidth,
              gridSvgHeight,
              layoutConnections,
              getConnectionLine,
              snapPreview,
              isEndpointConnected,
              isEndpointPreviewed,
              layoutTables,
              handleTablePointerDown,
              getTableTransform,
              rotateTable,
              layoutLocks,
              toggleLayoutLock,
              toggleModuleGroupLock,
              deleteLayoutTable,
              layoutModules,
              moduleNumberMap,
              getPlacedSlot,
              getLayoutKind,
              getLayoutSize,
              getPolygonGeometry,
              getCustomShapeName,
              isPolygonModule,
              getTrackRails,
              getModuleTransform,
              getRotatedBounds,
              handleModulePointerDown,
              isCornerKind,
              getTrackEndpointsForModule,
              rotateModule,
              moduleHasConnection,
              pushLayoutHistory,
              setLayoutConnections,
              filteredModules,
              layoutIncluded,
              layoutOverrides,
              clampSlotToGrid,
              getTemplateSlot,
              setLayoutOverrides,
              setLayoutIncluded,
            }}
          />
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


