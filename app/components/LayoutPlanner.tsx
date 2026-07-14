"use client";

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
  } = planner;

  return (
      <section className="formCard layoutPrintArea">
        <h2>Layout View</h2>

        <details className="plannerKey" open>
          <summary>Symbols & Colors Key</summary>
          <div className="symbolKeyGrid">
            <div className="symbolKeyItem"><span className="symbolSwatch" /> Green edge: standard module</div>
            <div className="symbolKeyItem"><span className="symbolSwatch custom" /> Red edge: custom module</div>
            <div className="symbolKeyItem"><span className="symbolSwatch bridge" /> Brown edge: bridge module</div>
            <div className="symbolKeyItem"><span className="symbolSwatch table" /> Blue shape: table</div>
            <div className="symbolKeyItem"><span className="symbolDot available" /> Blue dot: open track endpoint</div>
            <div className="symbolKeyItem"><span className="symbolDot candidate" /> Yellow dot: valid snap candidate</div>
            <div className="symbolKeyItem"><span className="symbolDot connected" /> Green dot: connected track endpoint</div>
            <div className="symbolKeyItem"><span className="symbolIcon rotate">↻</span> Rotate connected group</div>
            <div className="symbolKeyItem"><span className="symbolIcon lock">L</span> Lock/unlock connected group</div>
            <div className="symbolKeyItem"><span className="symbolIcon disconnect">⛓</span> Disconnect module</div>
            <div className="symbolKeyItem"><span className="symbolIcon number">#</span> Yellow number: module ID</div>
            <div className="symbolKeyItem"><span className="symbolIcon delete">×</span> Delete table</div>
          </div>
        </details>
    
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
            <button className="layoutControlBtn" onClick={autoArrangeLayout}>Auto Arrange</button>
            <button className="layoutControlBtn" onClick={saveLayoutDesign}>Save Layout</button>
            <button className="layoutControlBtn" onClick={loadLayoutDesign}>Load Layout</button>
            <button className="layoutControlBtn" onClick={exportLayoutPDF}>Export PDF</button>
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
    
                  {getTrackEndpointsForModule(m, slot).map((endpoint: any, endpointIndex: number) => {
                    const connected = isEndpointConnected(m.id, endpoint.key);
                    const previewed = isEndpointPreviewed(m.id, endpoint.key);
                    const stateClass = connected ? "connected" : previewed ? "candidate" : "available";

                    return (
                      <circle
                        key={`snap-${m.id}-${endpointIndex}`}
                        className={`svgSnapPoint ${stateClass}`}
                        cx={endpoint.x}
                        cy={endpoint.y}
                        r={connected || previewed ? "8" : "6"}
                      />
                    );
                  })}
    
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
                  {moduleHasConnection(m.id) && (
                    <g
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={() => {
                        pushLayoutHistory();
                        setLayoutConnections((prev: any[]) =>
                          prev.filter((c) => c.a !== m.id && c.b !== m.id)
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
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => toggleModuleGroupLock(m.id)}
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
  );
}

