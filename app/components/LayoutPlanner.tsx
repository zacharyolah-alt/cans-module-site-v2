"use client";

import ModuleGeometry from "./ModuleGeometry";

export default function LayoutPlanner({ planner }: { planner: any }) {
  const {
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
    layoutTables,
    handleTablePointerDown,
    getTableTransform,
    rotateTable,
    layoutLocks,
    toggleLayoutLock,
    deleteLayoutTable,
    layoutModules,
    moduleNumberMap,
    getPlacedSlot,
    getLayoutKind,
    getLayoutSize,
    getPolygonGeometry,
    getCustomShapeName,
    isPolygonModule,
    getModuleTransform,
    getRotatedBounds,
    handleModulePointerDown,
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
  } = planner;

  function normalize(value: any) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, " ");
  }

 function getPlannerKind(module: any) {
  const shape = normalize(getCustomShapeName(module));
  const moduleType = normalize(module?.module_type);

  if (shape === "rectangle") {
    if (moduleType === "inside corner") return "insideCorner";
    if (moduleType === "outside corner") return "outsideCorner";

    return "custom";
  }

  if (
    shape === "angled inside corner" ||
    shape === "angled outside corner" ||
    shape === "pie-shaped outside corner"
  ) {
    return "custom";
  }

  return getLayoutKind(module);
}

  function getPlannerSize(module: any) {
    const kind = getPlannerKind(module);
    const shape = normalize(getCustomShapeName(module));

    if (
      kind === "custom" &&
      shape === "angled inside corner"
    ) {
      const polygon = getPolygonGeometry(module);
      if (polygon?.width && polygon?.height) {
        return { width: polygon.width, height: polygon.height };
      }
    }

    if (kind === "custom" && shape === "pie-shaped outside corner") {
      const width =
        Math.max(1, Number(module?.custom_width_inches || 14)) * 10;

      const height =
        Math.max(1, Number(module?.custom_depth_inches || 14)) * 10;

      const radius = Math.min(width, height);

      return {
        width: radius,
        height: radius,
      };
    }

    return getLayoutSize(module);
  }

  return (
    <section className="formCard layoutPrintArea">
      <h2>Layout View</h2>

      <div
        className={mobileEditMode ? "layoutCanvas editMode" : "layoutCanvas"}
        ref={layoutCanvasRef}
      >
        <div className="layoutControls">
          <label>
            Grid width:
            <select
              value={gridWidthFeet}
              onChange={(event) =>
                setGridWidthFeet(Number(event.target.value))
              }
            >
              <option value={10}>10 ft</option>
              <option value={20}>20 ft</option>
              <option value={30}>30 ft</option>
              <option value={40}>40 ft</option>
              <option value={50}>50 ft</option>
            </select>
          </label>

          <label>
            Grid depth:
            <select
              value={gridDepthFeet}
              onChange={(event) =>
                setGridDepthFeet(Number(event.target.value))
              }
            >
              <option value={10}>10 ft</option>
              <option value={20}>20 ft</option>
              <option value={30}>30 ft</option>
              <option value={40}>40 ft</option>
              <option value={50}>50 ft</option>
            </select>
          </label>

          <span className="layoutZoomLabel">
            Zoom: {layoutZoom}%
          </span>

          <button
            className="layoutControlBtn small"
            onClick={() => zoomLayout("out")}
          >
            −
          </button>

          <button
            className="layoutControlBtn small"
            onClick={() => zoomLayout("in")}
          >
            +
          </button>

          <button
            className="layoutControlBtn"
            onClick={() => panLayout(-300, 0)}
          >
            ←
          </button>

          <button
            className="layoutControlBtn"
            onClick={() => panLayout(300, 0)}
          >
            →
          </button>

          <button
            className="layoutControlBtn"
            onClick={() => panLayout(0, -300)}
          >
            ↑
          </button>

          <button
            className="layoutControlBtn"
            onClick={() => panLayout(0, 300)}
          >
            ↓
          </button>

          <button
            className={mobileEditMode ? "activeBtn" : "grayBtn"}
            onClick={() =>
              setMobileEditMode((current: boolean) => !current)
            }
          >
            Mobile Edit {mobileEditMode ? "On" : "Off"}
          </button>

          <button
            className="layoutControlBtn"
            onClick={() => addLayoutTable("6ft")}
          >
            Add 6 ft Table
          </button>

          <button
            className="layoutControlBtn"
            onClick={() => addLayoutTable("8ft")}
          >
            Add 8 ft Table
          </button>

          <button
            className="layoutControlBtn"
            onClick={autoArrangeLayout}
          >
            Auto Arrange
          </button>

          <button
            className="layoutControlBtn"
            onClick={saveLayoutDesign}
          >
            Save Layout
          </button>

          <button
            className="layoutControlBtn"
            onClick={loadLayoutDesign}
          >
            Load Layout
          </button>

          <button
            className="layoutControlBtn"
            onClick={exportLayoutPDF}
          >
            Export PDF
          </button>

          <button
            className="layoutActionBtn"
            onClick={undoLayoutChange}
            disabled={layoutHistory.length === 0}
          >
            Undo
          </button>

          <button
            className="layoutActionBtn"
            onClick={redoLayoutChange}
            disabled={layoutFuture.length === 0}
          >
            Redo
          </button>
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
            <pattern
              id="smallGrid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="#dddddd"
                strokeWidth="1"
              />
            </pattern>

            <pattern
              id="largeGrid"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <rect
                width="60"
                height="60"
                fill="url(#smallGrid)"
              />

              <path
                d="M 60 0 L 0 0 0 60"
                fill="none"
                stroke="#c9c9c9"
                strokeWidth="1.2"
              />
            </pattern>
          </defs>

          <rect
            x="0"
            y="0"
            width={gridSvgWidth}
            height={gridSvgHeight}
            fill="url(#largeGrid)"
          />

          <g>
            <rect
              className="svgScaleKey"
              x="20"
              y="20"
              width="290"
              height="92"
              rx="8"
              fill="rgba(255,255,255,.94)"
              stroke="#ffd21f"
              strokeWidth="1.5"
            />

            <text
              className="svgKeyTitle"
              x="36"
              y="44"
              fill="#050505"
              fontSize="15"
              fontWeight="900"
            >
              Grid Scale
            </text>

            <text
              className="svgKeyText"
              x="36"
              y="64"
              fill="#111111"
              fontSize="12"
            >
              1 small square = 2 inches
            </text>

            <text
              className="svgKeyText"
              x="36"
              y="84"
              fill="#111111"
              fontSize="12"
            >
              1 large square = 6 inches
            </text>

            <text
              className="svgKeyText"
              x="36"
              y="104"
              fill="#111111"
              fontSize="12"
            >
              2 x 2 large squares = 1 sq ft
            </text>
          </g>

          {layoutConnections.map(
            (connection: any, index: number) => {
              const line = getConnectionLine(connection);

              if (!line) return null;

              return (
                <line
                  key={`connection-${connection.a}-${connection.b}-${index}`}
                  className="svgConnectionLine"
                  x1={line.a.x}
                  y1={line.a.y}
                  x2={line.b.x}
                  y2={line.b.y}
                  stroke="#ff8c00"
                  strokeWidth="3"
                  strokeDasharray="10 7"
                  opacity=".85"
                />
              );
            }
          )}

          {layoutTables.map((table: any) => (
            <g
              key={table.id}
              className="svgTableGroup"
              onPointerDown={(event) =>
                handleTablePointerDown(event, table)
              }
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

                <text
                  className="svgTableLabel"
                  x={table.width / 2}
                  y={table.height / 2}
                >
                  {table.kind === "6ft"
                    ? "6 ft Table"
                    : "8 ft Table"}
                </text>

                <g
                  onPointerDown={(event) =>
                    event.stopPropagation()
                  }
                  onClick={(event) =>
                    rotateTable(event, table)
                  }
                  style={{
                    cursor: layoutLocks[table.id]
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  <circle
                    className="svgRotateCircle"
                    cx="28"
                    cy="28"
                    r="13"
                    fill="#ffd21f"
                    stroke="#050505"
                    strokeWidth="1.5"
                  />

                  <text
                    className="svgRotateText"
                    x="28"
                    y="28"
                  >
                    ↻
                  </text>
                </g>

                <g
                  onPointerDown={(event) =>
                    event.stopPropagation()
                  }
                  onClick={() =>
                    toggleLayoutLock(table.id)
                  }
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    className={`svgLockCircle ${
                      layoutLocks[table.id]
                        ? "locked"
                        : ""
                    }`}
                    cx={table.width - 28}
                    cy="28"
                    r="12"
                    fill={layoutLocks[table.id] ? "#777777" : "#b00020"}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />

                  <text
                    className="svgLockText"
                    x={table.width - 28}
                    y="28"
                  >
                    {layoutLocks[table.id] ? "L" : "●"}
                  </text>
                </g>

                <g
                  onPointerDown={(event) =>
                    event.stopPropagation()
                  }
                  onClick={() =>
                    deleteLayoutTable(table.id)
                  }
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    className="svgDeleteCircle"
                    cx={table.width - 28}
                    cy={table.height - 28}
                    r="12"
                    fill="#b00020"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />

                  <text
                    className="svgDeleteText"
                    x={table.width - 28}
                    y={table.height - 28}
                  >
                    ×
                  </text>
                </g>
              </g>
            </g>
          ))}

          {layoutModules
  .filter((m: any) => !isPolygonModule(m))
  .map((m: any, index: number) => {
            const permanentIndex = Math.max(
              0,
              (moduleNumberMap[m.id] || index + 1) - 1
            );

            const slot = getPlacedSlot(
              m,
              permanentIndex
            );

            const kind = getPlannerKind(m);
            const size = getPlannerSize(m);

            const moduleTransform =
              getModuleTransform(slot, size);

            const moduleBounds =
              getRotatedBounds(slot, size);

            const numberPosition = {
              x: slot.x + moduleBounds.width / 2,
              y: slot.y + moduleBounds.height / 2,
            };

            const lockButton = {
              x: slot.x + moduleBounds.width - 22,
              y: slot.y + 22,
            };

            return (
              <g
                key={m.id}
                className="svgModuleGroup"
                onPointerDown={(event) =>
                  handleModulePointerDown(
                    event,
                    m,
                    index
                  )
                }
              >
                <g transform={moduleTransform}>
                  <ModuleGeometry
                    module={m}
                    kind={kind}
                    size={size}
                    getPolygonGeometry={
                      getPolygonGeometry
                    }
                    getCustomShapeName={
                      getCustomShapeName
                    }
                    isPolygonModule={
                      isPolygonModule
                    }
                  />
                </g>

                {getTrackEndpointsForModule(
                  m,
                  slot
                ).map(
                  (
                    endpoint: any,
                    endpointIndex: number
                  ) => (
                    <circle
                      key={`snap-${m.id}-${endpointIndex}`}
                      className="svgSnapPoint available"
                      cx={endpoint.x}
                      cy={endpoint.y}
                      r="5"
                      fill="#1f6fff"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                    />
                  )
                )}

                <text
                  className="svgNumberText"
                  x={numberPosition.x}
                  y={numberPosition.y}
                >
                  {moduleNumberMap[m.id] ?? ""}
                </text>

                <g
                  onPointerDown={(event) =>
                    event.stopPropagation()
                  }
                  onClick={(event) =>
                    rotateModule(event, m, index)
                  }
                  style={{
                    cursor: layoutLocks[m.id]
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  <circle
                    className="svgRotateCircle"
                    cx={numberPosition.x + 34}
                    cy={numberPosition.y}
                    r="11"
                    fill="#ffd21f"
                    stroke="#050505"
                    strokeWidth="1.5"
                  />

                  <text
                    className="svgRotateText"
                    x={numberPosition.x + 34}
                    y={numberPosition.y}
                  >
                    ↻
                  </text>
                </g>

                {moduleHasConnection(m.id) && (
                  <g
                    onPointerDown={(event) =>
                      event.stopPropagation()
                    }
                    onClick={() => {
                      pushLayoutHistory();

                      setLayoutConnections(
                        (prev: any[]) =>
                          prev.filter(
                            (connection) =>
                              connection.a !== m.id &&
                              connection.b !== m.id
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
                )}

                <g
                  onPointerDown={(event) =>
                    event.stopPropagation()
                  }
                  onClick={() =>
                    toggleLayoutLock(m.id)
                  }
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    className={`svgLockCircle ${
                      layoutLocks[m.id]
                        ? "locked"
                        : ""
                    }`}
                    cx={lockButton.x}
                    cy={lockButton.y}
                    r="10"
                    fill={layoutLocks[m.id] ? "#777777" : "#b00020"}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />

                  <text
                    className="svgLockText"
                    x={lockButton.x}
                    y={lockButton.y}
                  >
                    {layoutLocks[m.id] ? "L" : "●"}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="layoutLegend">
        <h3 className="legendTitle">
          Layout Symbols Key
        </h3>

        <div className="symbolKeyGrid">
          <div className="symbolKeyItem">
            <span style={{ width: "22px", height: "14px", borderRadius: "4px", border: "2px solid #3d6b2d", background: "rgba(198, 226, 178, .55)", display: "inline-block" }} />
            Green = module tabletop
          </div>

          <div className="symbolKeyItem">
            <span
              style={{
                width: "26px",
                borderTop: "3px solid red",
              }}
            />
            Red = front main
          </div>

          <div className="symbolKeyItem">
            <span
              style={{
                width: "26px",
                borderTop: "3px solid #d4a900",
              }}
            />
            Yellow = rear main
          </div>

          <div className="symbolKeyItem">
            <span
              style={{
                width: "26px",
                borderTop: "5px solid #2f5f24",
              }}
            />
            Dark green = exposed/front edge
          </div>

          <div className="symbolKeyItem">
            <span style={{ width: "22px", height: "14px", borderRadius: "4px", border: "2px solid #1f6fbf", background: "rgba(70, 155, 255, .28)", display: "inline-block" }} />
            Blue = table
          </div>

          <div className="symbolKeyItem">
            <span style={{ width: "14px", height: "14px", borderRadius: "999px", background: "#1f6fff", border: "2px solid #ffffff", boxShadow: "0 0 0 1px #777", display: "inline-block" }} />
            Blue dot = connection point
          </div>

          <div className="symbolKeyItem">
            <span style={{ width: "28px", borderTop: "3px dashed #ff8c00", display: "inline-block" }} />
            Orange dash = connected modules
          </div>

          <div className="symbolKeyItem">
            ↻ Rotate · ● / L Lock · ⛓ Disconnect
          </div>
        </div>

        <h3 className="legendTitle">
          Module Key
        </h3>

        <div
          style={{
            padding: "12px",
            display: "grid",
            gap: "10px",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(300px, 1fr))",
          }}
        >
          {filteredModules
  .filter((m: any) => !isPolygonModule(m))
  .map((m: any) => {
            const isIncluded =
              !!layoutIncluded[m.id];

            const permanentNumber =
              moduleNumberMap[m.id];

            return (
              <div
                key={m.id}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "24px 42px 86px 1fr",
                  gap: "10px",
                  alignItems: "center",
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                  padding: "10px",
                  background: isIncluded
                    ? "#fff"
                    : "#f7f7f7",
                }}
              >
                <input
                  className="legendCheckbox"
                  type="checkbox"
                  checked={isIncluded}
                  onChange={(event) => {
                    const checked =
                      event.target.checked;

                    const permanentIndex =
                      Math.max(
                        0,
                        (moduleNumberMap[m.id] ||
                          1) -
                          1
                      );

                    if (
                      checked &&
                      !layoutOverrides[m.id]
                    ) {
                      const startingSlot =
                        clampSlotToGrid(
                          getTemplateSlot(
                            permanentIndex
                          ),
                          getLayoutSize(m)
                        );

                      setLayoutOverrides(
                        (prev: any) => ({
                          ...prev,
                          [m.id]: {
                            x: startingSlot.x,
                            y: startingSlot.y,
                            rotation:
                              startingSlot.rotation ||
                              0,
                          },
                        })
                      );
                    }

                    setLayoutIncluded(
                      (prev: any) => ({
                        ...prev,
                        [m.id]: checked,
                      })
                    );
                  }}
                />

                <div
                  className={`legendNumber ${
                    isIncluded ? "" : "inactive"
                  }`}
                >
                  {permanentNumber || "—"}
                </div>

                <div
                  style={{
                    width: "86px",
                    height: "64px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "1px solid #ddd",
                    background: "#eee",
                  }}
                >
                  {m.photo_url ? (
                    <img
                      src={m.photo_url}
                      alt={
                        m.module_name || "Module"
                      }
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        color: "#777",
                      }}
                    >
                      No photo
                    </div>
                  )}
                </div>

                <div className="legendText">
                  <strong>
                    {m.module_name ||
                      "Unnamed Module"}
                  </strong>

                  <div>
                    {m.module_type || "Module"} ·{" "}
                    {m.dimensions ||
                      "Custom Size"}
                  </div>

                  <div
                    style={{
                      color: "#666",
                      fontSize: "12px",
                    }}
                  >
                    {m.owner_name ||
                      "Unknown Owner"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
