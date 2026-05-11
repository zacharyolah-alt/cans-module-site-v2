"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

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
  const [search, setSearch] = useState("");
  const [standardFilter, setStandardFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [uploading, setUploading] = useState(false);
const [moduleType, setModuleType] = useState("Straight");
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
  const [layoutHistory, setLayoutHistory] = useState<any[]>([]);
const [layoutFuture, setLayoutFuture] = useState<any[]>([]);
  const [layoutOverrides, setLayoutOverrides] = useState<any>({});
const [layoutIncluded, setLayoutIncluded] = useState<any>({});
const [gridWidthFeet, setGridWidthFeet] = useState(20);
const [gridDepthFeet, setGridDepthFeet] = useState(20);
const [layoutZoom, setLayoutZoom] = useState(25);
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
setCornerSize("");
setBridgeSize("");
setCustomWidthInches("24");
setCustomDepthInches("14");
    setCustomShape("Rectangle");

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
setCornerSize(m.corner_size || "");
setBridgeSize(m.bridge_size || "");

setCustomWidthInches(m.custom_width_inches || "24");
setCustomDepthInches(m.custom_depth_inches || "14");
    setCustomShape(m.custom_shape || "Rectangle");

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
      bridge_size: bridgeSize,
corner_size: cornerSize,
      dimensions,
      custom_width_inches: customWidthInches,
custom_depth_inches: customDepthInches,
      custom_shape: customShape,
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

  function getLayoutSize(m: any) {
    const kind = getLayoutKind(m);

    if (kind === "insideCorner" || kind === "outsideCorner") return { width: 144, height: 144 };
    if (kind === "single") return { width: 121, height: 144 };
    if (kind === "double") return { width: 243, height: 144 };
    if (kind === "triple") return { width: 365, height: 144 };
    if (kind === "quad") return { width: 487, height: 144 };
    if (kind === "bridge") {
  let bridgeWidth = 243;

  if (m.bridge_size === "Single Bridge") {
    bridgeWidth = 121;
  }

  if (m.bridge_size === "Double Bridge") {
    bridgeWidth = 243;
  }

  if (m.bridge_size === "Triple Bridge") {
    bridgeWidth = 365;
  }

  if (m.bridge_size === "Custom Bridge") {
    bridgeWidth =
      Number(m.custom_width_inches || 24) * LAYOUT_SCALE;
  }

  return {
    width: bridgeWidth,
    height: 80,
  };
    }
if (kind === "custom") {
  return {
    width: Number(m.custom_width_inches || 24) * LAYOUT_SCALE,
    height: Number(m.custom_depth_inches || 14) * LAYOUT_SCALE,
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

  function getTrackEndpointsForModule(m: any, slot: any) {
    const size = getLayoutSize(m);
    const kind = getLayoutKind(m);
    const rotation = slot.rotation || 0;
    const rails = getMainTrackCenters();

    const localPoints = isCornerKind(kind)
      ? rails.flatMap((rail) => [
          { x: 0, y: rail },
          { x: size.width - rail, y: size.height },
        ])
      : rails.flatMap((rail) => [
          { x: 0, y: rail },
          { x: size.width, y: rail },
        ]);

    return localPoints.map((point) => {
      const rotated = rotatePoint(point.x, point.y, rotation, size);
      return {
        x: slot.x + rotated.x,
        y: slot.y + rotated.y,
      };
    });
  }

  function applyTrackSnap(candidateSlot: any, movingModule: any) {
    const movingSize = getLayoutSize(movingModule);
    const movingEndpoints = getTrackEndpointsForModule(movingModule, candidateSlot);
    let bestSnap: any = null;
    const snapDistance = 40;

    layoutModules.forEach((otherModule: any) => {
      if (otherModule.id === movingModule.id) return;

      const otherPermanentIndex = Math.max(0, (moduleNumberMap[otherModule.id] || 1) - 1);
      const otherSlot = getPlacedSlot(otherModule, otherPermanentIndex);
      const otherEndpoints = getTrackEndpointsForModule(otherModule, otherSlot);

movingEndpoints.forEach((movingEndpoint) => {
        otherEndpoints.forEach((otherEndpoint) => {
          const dx = otherEndpoint.x - movingEndpoint.x;
          const dy = otherEndpoint.y - movingEndpoint.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance <= snapDistance && (!bestSnap || distance < bestSnap.distance)) {
            bestSnap = {
  distance,
  dx,
  dy,
  otherModuleId: otherModule.id,
};
          }
        });
      });
    });

    if (!bestSnap) {
      return clampSlotToGrid(candidateSlot, movingSize);
    }
if (bestSnap && bestSnap.otherModuleId) {
  setLayoutConnections((prev: any[]) => {
    const exists = prev.some(
      (c) =>
        (c.a === movingModule.id && c.b === bestSnap.otherModuleId) ||
        (c.b === movingModule.id && c.a === bestSnap.otherModuleId)
    );

    if (exists) return prev;

    return [
      ...prev,
      {
        a: movingModule.id,
        b: bestSnap.otherModuleId,
      },
    ];
  });
}
    return clampSlotToGrid(
      {
        ...candidateSlot,
        x: snapToGrid(candidateSlot.x + bestSnap.dx),
        y: snapToGrid(candidateSlot.y + bestSnap.dy),
      },
      movingSize
    );
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

    const permanentIndex = Math.max(0, (moduleNumberMap[m.id] || index + 1) - 1);
    const startingSlot = getPlacedSlot(m, permanentIndex);
    const startingPoint = getSvgPoint(event);
    const startingX = startingSlot.x;
    const startingY = startingSlot.y;

    function moveHandler(moveEvent: any) {
      const currentPoint = getSvgPoint(moveEvent);
      const candidateSlot = {
        ...startingSlot,
        x: snapToGrid(startingX + currentPoint.x - startingPoint.x),
        y: snapToGrid(startingY + currentPoint.y - startingPoint.y),
      };

      const snappedSlot = applyTrackSnap(candidateSlot, m);

      setLayoutOverrides((prev: any) => {
  const connectedIds = getConnectedModuleIds(m.id);

  const deltaX = snappedSlot.x - startingSlot.x;
  const deltaY = snappedSlot.y - startingSlot.y;

  const next = { ...prev };

  connectedIds.forEach((connectedId) => {
    const connectedModule = layoutModules.find(
      (mod: any) => mod.id === connectedId
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
      ...(prev[connectedId] || {}),
      x: connectedSlot.x + deltaX,
      y: connectedSlot.y + deltaY,
    };
  });

  return next;
});
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

    if (layoutLocks[m.id]) return;

    const permanentIndex = Math.max(0, (moduleNumberMap[m.id] || index + 1) - 1);
    const currentSlot = getPlacedSlot(m, permanentIndex);
    const nextSlot = clampSlotToGrid(
      {
        ...currentSlot,
        rotation: ((currentSlot.rotation || 0) + 90) % 360,
      },
      getLayoutSize(m)
    );

    setLayoutOverrides((prev: any) => ({
      ...prev,
      [m.id]: {
        ...(prev[m.id] || {}),
        ...nextSlot,
      },
    }));
  }

  function addLayoutTable(kind: "6ft" | "8ft") {
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
    if (event.pointerType === "touch" && !mobileEditMode) return;

    const startingPoint = getSvgPoint(event);
    const startingX = table.x;
    const startingY = table.y;

    function moveHandler(moveEvent: any) {
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
    setLayoutLocks((prev: any) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  function deleteLayoutTable(id: string) {
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
</div>

<div>
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
</div>
    <div>
  <label>Custom Shape</label>

  <select
    value={customShape}
    onChange={(e) => setCustomShape(e.target.value)}
  >
    <option>Rectangle</option>
    <option>Angled Inside Corner</option>
    <option>Angled Outside Corner</option>
  </select>
</div>
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
  </>
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
                {m.dimensions === "Other / custom" && (
  <p>
    Custom Size: {m.custom_width_inches}" W × {m.custom_depth_inches}" D
  </p>
)}
                {m.dimensions === "Other / custom" && m.custom_shape && (
  <p>
    <b>Shape:</b> {m.custom_shape}
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
  <section className="formCard layoutPrintArea">
    <h2>Layout View</h2>

    <div className={mobileEditMode ? "layoutCanvas editMode" : "layoutCanvas"} ref={layoutCanvasRef}>
      <div className="layoutControls">
        <label>
          Grid width:
          <select value={gridWidthFeet} onChange={(event) => setGridWidthFeet(Number(event.target.value))}>
            <option value={10}>10 ft</option>
            <option value={20}>20 ft</option>
            <option value={30}>30 ft</option>
            <option value={40}>40 ft</option>
            <option value={50}>50 ft</option>
          </select>
        </label>

        <label>
          Grid depth:
          <select value={gridDepthFeet} onChange={(event) => setGridDepthFeet(Number(event.target.value))}>
            <option value={10}>10 ft</option>
            <option value={20}>20 ft</option>
            <option value={30}>30 ft</option>
            <option value={40}>40 ft</option>
            <option value={50}>50 ft</option>
          </select>
        </label>

        <span className="layoutZoomLabel">Zoom: {layoutZoom}%</span>
        <button className="layoutControlBtn small" onClick={() => zoomLayout("out")}>−</button>
        <button className="layoutControlBtn small" onClick={() => zoomLayout("in")}>+</button>

        <button className="layoutControlBtn" onClick={() => panLayout(-300, 0)}>←</button>
        <button className="layoutControlBtn" onClick={() => panLayout(300, 0)}>→</button>
        <button className="layoutControlBtn" onClick={() => panLayout(0, -300)}>↑</button>
        <button className="layoutControlBtn" onClick={() => panLayout(0, 300)}>↓</button>

        <button
          className={mobileEditMode ? "activeBtn" : "grayBtn"}
          onClick={() => setMobileEditMode((current) => !current)}
        >
          Mobile Edit {mobileEditMode ? "On" : "Off"}
        </button>

        <button className="layoutControlBtn" onClick={() => addLayoutTable("6ft")}>Add 6 ft Table</button>
        <button className="layoutControlBtn" onClick={() => addLayoutTable("8ft")}>Add 8 ft Table</button>
        <button className="layoutControlBtn" onClick={saveLayoutDesign}>Save Layout</button>
        <button className="layoutControlBtn" onClick={loadLayoutDesign}>Load Layout</button>
        <button className="layoutControlBtn" onClick={exportLayoutPDF}>Export PDF</button>
      </div>

<svg
        ref={svgPlannerRef}
        className="svgPlanner"
        width={displaySvgWidth}
        height={displaySvgHeight}
        viewBox={`0 0 ${gridSvgWidth} ${gridSvgHeight}`}
        role="img"
        aria-label="C.A.N.S. module layout planner"
      >
        <defs>
          <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#dddddd" strokeWidth="1" />
          </pattern>
          <pattern id="largeGrid" width="60" height="60" patternUnits="userSpaceOnUse">
            <rect width="60" height="60" fill="url(#smallGrid)" />
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#c9c9c9" strokeWidth="1.2" />
          </pattern>
        </defs>

        <rect x="0" y="0" width={gridSvgWidth} height={gridSvgHeight} fill="url(#largeGrid)" />

        <g>
          <rect className="svgScaleKey" x="20" y="20" width="290" height="92" rx="8" />
          <text className="svgKeyTitle" x="36" y="44">Grid Scale</text>
          <text className="svgKeyText" x="36" y="64">1 small square = 2 inches</text>
          <text className="svgKeyText" x="36" y="84">1 large square = 6 inches</text>
          <text className="svgKeyText" x="36" y="104">2 x 2 large squares = 1 sq ft</text>
        </g>

        {layoutTables.map((table) => (
          <g
            key={table.id}
            className="svgTableGroup"
            onPointerDown={(event) => handleTablePointerDown(event, table)}
          >
            <g transform={getTableTransform(table)}>
  <rect
    className="svgTable"
    x="0"
    y="0"
    width={table.width}
    height={table.height}
    rx="4"
  />

  <text className="svgTableLabel" x={table.width / 2} y={table.height / 2}>
    {table.kind === "6ft" ? "6 ft Table" : "8 ft Table"}
  </text>

  <g
    onPointerDown={(event) => event.stopPropagation()}
    onClick={(event) => rotateTable(event, table)}
    style={{ cursor: layoutLocks[table.id] ? "not-allowed" : "pointer" }}
  >
    <circle className="svgRotateCircle" cx="28" cy="28" r="13" />
    <text className="svgRotateText" x="28" y="28">↻</text>
  </g>

  <g
    onPointerDown={(event) => event.stopPropagation()}
    onClick={() => toggleLayoutLock(table.id)}
    style={{ cursor: "pointer" }}
  >
    <circle
      className={`svgLockCircle ${layoutLocks[table.id] ? "locked" : ""}`}
      cx={table.width - 28}
      cy="28"
      r="12"
    />
    <text className="svgLockText" x={table.width - 28} y="28">
      {layoutLocks[table.id] ? "L" : "●"}
    </text>
  </g>

  <g
    onPointerDown={(event) => event.stopPropagation()}
    onClick={() => deleteLayoutTable(table.id)}
    style={{ cursor: "pointer" }}
  >
    <circle
      className="svgDeleteCircle"
      cx={table.width - 28}
      cy={table.height - 28}
      r="12"
    />
    <text className="svgDeleteText" x={table.width - 28} y={table.height - 28}>
      ×
    </text>
  </g>
</g>
            </g>
        ))}

        {layoutModules.map((m, index) => {
          const permanentIndex = Math.max(0, (moduleNumberMap[m.id] || index + 1) - 1);
          const slot = getPlacedSlot(m, permanentIndex);
          const kind = getLayoutKind(m);
          const size = getLayoutSize(m);
          const rails = getTrackRails();
          const moduleTransform = getModuleTransform(slot, size);
          const moduleBounds = getRotatedBounds(slot, size);
          const numberPosition = {
            x: slot.x + moduleBounds.width / 2,
            y: slot.y + moduleBounds.height / 2,
          };
          const lockButton = {
            x: slot.x + moduleBounds.width - 22,
            y: slot.y + 22,
          };

          return (
            <g key={m.id} className="svgModuleGroup" onPointerDown={(event) => handleModulePointerDown(event, m, index)}>
              <g transform={moduleTransform}>
                {kind === "custom" && m.custom_shape === "Angled Inside Corner" ? (
  <polygon
    className="svgModule custom"
    points={`0,${size.height} 0,${size.height * 0.35} ${size.width * 0.35},0 ${size.width},0 ${size.width},${size.height} 0,${size.height}`}
  />
) : kind === "custom" && m.custom_shape === "Angled Outside Corner" ? (
  <polygon
    className="svgModule custom"
    points={`0,0 ${size.width},0 ${size.width},${size.height * 0.65} ${size.width * 0.65},${size.height} 0,${size.height} 0,0`}
  />
) : (
  <rect
    className={`svgModule ${kind === "custom" ? "custom" : ""} ${kind === "bridge" ? "bridge" : ""}`}
    x="0"
    y="0"
    width={size.width}
    height={size.height}
    rx="1"
  />
)}

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
                {moduleNumberMap[m.id] ?? ""}
              </text>

              <g
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => rotateModule(event, m, index)}
                style={{ cursor: layoutLocks[m.id] ? "not-allowed" : "pointer" }}
              >
                <circle className="svgRotateCircle" cx={numberPosition.x + 34} cy={numberPosition.y} r="11" />
                <text className="svgRotateText" x={numberPosition.x + 34} y={numberPosition.y}>
                  ↻
                </text>
              </g>
              <g
  onPointerDown={(event) => event.stopPropagation()}
  onClick={() => {
    setLayoutConnections((prev: any[]) =>
      prev.filter(
        (c) => c.a !== m.id && c.b !== m.id
      )
    );
  }}
  style={{ cursor: "pointer" }}
>
  <circle
    cx={lockButton.x}
    cy={lockButton.y + 28}
    r="10"
    fill="#ff6b35"
    stroke="#ffffff"
    strokeWidth="2"
  />

  <text
    x={lockButton.x}
    y={lockButton.y + 28}
    textAnchor="middle"
    dominantBaseline="central"
    fontSize="11"
    fill="#ffffff"
    fontWeight="700"
  >
    ⛓
  </text>
</g>

              <g
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => toggleLayoutLock(m.id)}
                style={{ cursor: "pointer" }}
              >
                <circle
                  className={`svgLockCircle ${layoutLocks[m.id] ? "locked" : ""}`}
                  cx={lockButton.x}
                  cy={lockButton.y}
                  r="10"
                />
                <text className="svgLockText" x={lockButton.x} y={lockButton.y}>
                  {layoutLocks[m.id] ? "L" : "●"}
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
        const isIncluded = !!layoutIncluded[m.id];
        const permanentNumber = moduleNumberMap[m.id];

        return (
          <div key={m.id} className="legendRow">
            <input
              className="legendCheckbox"
              type="checkbox"
              checked={isIncluded}
              onChange={(event) => {
                const checked = event.target.checked;
                const permanentIndex = Math.max(0, (moduleNumberMap[m.id] || 1) - 1);

                if (checked && !layoutOverrides[m.id]) {
                  const startingSlot = clampSlotToGrid(getTemplateSlot(permanentIndex), getLayoutSize(m));

                  setLayoutOverrides((prev: any) => ({
                    ...prev,
                    [m.id]: {
                      x: startingSlot.x,
                      y: startingSlot.y,
                      rotation: startingSlot.rotation || 0,
                    },
                  }));
                }

                setLayoutIncluded((prev: any) => ({
                  ...prev,
                  [m.id]: checked,
                }));
              }}
            />

            <div className={`legendNumber ${isIncluded ? "" : "inactive"}`}>
              {permanentNumber || "—"}
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




