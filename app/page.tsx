from pathlib import Path

src = Path("/mnt/data/page.tsx (1).txt")
text = src.read_text()

old_css = """.layoutGrid {
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
}"""

new_css = """.layoutCanvas {
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
  grid-template-columns: 44px 1fr;
  gap: 10px;
  padding: 10px 14px;
  border-top: 1px solid #eee;
  align-items: start;
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
}"""

if old_css not in text:
    raise ValueError("Could not find old layout CSS block.")
text = text.replace(old_css, new_css)

marker = """}, [modules, search, standardFilter, statusFilter, typeFilter, dimensionFilter]);
  return (
"""
helpers = """}, [modules, search, standardFilter, statusFilter, typeFilter, dimensionFilter]);

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

  return (
"""
if marker not in text:
    raise ValueError("Could not find helper insertion marker.")
text = text.replace(marker, helpers)

old_layout = """        {viewMode === "layout" && (
  <section className="formCard">
    <h2>Layout View</h2>
    <div className="layoutGrid">
  {filteredModules.map((m) => (
    <div
  key={m.id}
  className={`layoutBlock ${
    m.module_type === "Inside Corner" || m.module_type === "Outside Corner"
      ? "cornerBlock"
      : m.module_type === "Bridge"
      ? "bridgeBlock"
      : m.dimensions?.startsWith("Single")
      ? "singleBlock"
      : m.dimensions?.startsWith("Double")
      ? "doubleBlock"
      : m.dimensions?.startsWith("Triple")
      ? "tripleBlock"
      : m.dimensions?.startsWith("Quad")
      ? "quadBlock"
      : "customBlock"
  }`}
>
      <div className="layoutTitle">
        {m.module_name}
      </div>

      <div className="layoutMeta">
        {m.module_type || "Module"}
      </div>

      <div className="layoutMeta">
        {m.dimensions || "Custom Size"}
      </div>
    </div>
  ))}
</div>
  </section>
)}"""

new_layout = """        {viewMode === "layout" && (
  <section className="formCard">
    <h2>Layout View</h2>

    <div className="layoutCanvas">
      <svg className="svgPlanner" viewBox="0 0 1250 880" role="img" aria-label="C.A.N.S. module layout planner">
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

        {filteredModules.map((m, index) => {
          const slot = getTemplateSlot(index);
          const kind = slot.kind || getLayoutKind(m);
          const size = getLayoutSize(m, slot);
          const rails = getTrackRails();
          const moduleTransform = getModuleTransform(slot, size);
          const numberPosition = getNumberPosition(slot, size);

          return (
            <g key={m.id}>
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
            </g>
          );
        })}
      </svg>
    </div>

    <div className="layoutLegend">
      <h3 className="legendTitle">Module Key</h3>
      {filteredModules.map((m, index) => (
        <div key={m.id} className="legendRow">
          <div className="legendNumber">{index + 1}</div>
          <div className="legendText">
            <strong>{m.module_name || "Unnamed Module"}</strong>
            {m.module_type || "Module"} — {m.dimensions || "Custom Size"} — {m.owner_name || "Unknown Owner"}
          </div>
        </div>
      ))}
    </div>
  </section>
)}"""

if old_layout not in text:
    raise ValueError("Could not find old layout JSX block.")
text = text.replace(old_layout, new_layout)

out = Path("/mnt/data/CANS_page_green_modules_numbers_back.txt")
out.write_text(text)
print(f"Saved: {out}")
print(f"Characters: {len(text):,}")
