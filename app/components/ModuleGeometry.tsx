"use client";

type Point = { x: number; y: number };

type ModuleGeometryProps = {
  module: any;
  kind: string;
  size: { width: number; height: number };
  getPolygonGeometry: (module: any) => any;
  getCustomShapeName: (module: any) => string;
  isPolygonModule: (module: any) => boolean;
  layoutScale?: number;
};

const GREEN = "#3d6b2d";
const DARK_GREEN = "#2f5f24";
const RED = "red";
const YELLOW = "#d4a900";
const MODULE_FILL = "rgba(198, 226, 178, .55)";

function normalize(value: any) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");
}

function radiusPair(module: any): [number, number] {
  const pairs: Record<string, [number, number]> = {
    "Standard Corner": [282, 315],
    "Medium Corner": [348, 381],
    "Large Corner": [447, 480],
    "Extra-Large Corner": [481, 481],
  };

  return pairs[module?.corner_size] || [282, 315];
}

function lineIntersection(a1: Point, a2: Point, b1: Point, b2: Point) {
  const x1 = a1.x;
  const y1 = a1.y;
  const x2 = a2.x;
  const y2 = a2.y;
  const x3 = b1.x;
  const y3 = b1.y;
  const x4 = b2.x;
  const y4 = b2.y;

  const denominator =
    (x1 - x2) * (y3 - y4) -
    (y1 - y2) * (x3 - x4);

  if (Math.abs(denominator) < 0.0001) return null;

  return {
    x:
      ((x1 * y2 - y1 * x2) * (x3 - x4) -
        (x1 - x2) * (x3 * y4 - y3 * x4)) /
      denominator,
    y:
      ((x1 * y2 - y1 * x2) * (y3 - y4) -
        (y1 - y2) * (x3 * y4 - y3 * x4)) /
      denominator,
  };
}

function pointToSegmentDistance(point: Point, start: Point, end: Point) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * dx + (point.y - start.y) * dy) /
        lengthSquared
    )
  );

  const closestX = start.x + t * dx;
  const closestY = start.y + t * dy;

  return Math.hypot(point.x - closestX, point.y - closestY);
}

function tangentPoint(
  corner: Point,
  start: Point,
  end: Point,
  radius: number
) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.max(0.0001, Math.hypot(dx, dy));
  const ux = dx / length;
  const uy = dy / length;

  const candidateA = {
    x: corner.x + ux * radius,
    y: corner.y + uy * radius,
  };

  const candidateB = {
    x: corner.x - ux * radius,
    y: corner.y - uy * radius,
  };

  return pointToSegmentDistance(candidateA, start, end) <=
    pointToSegmentDistance(candidateB, start, end)
    ? candidateA
    : candidateB;
}

export default function ModuleGeometry({
  module,
  kind,
  size,
  getPolygonGeometry,
  getCustomShapeName,
  isPolygonModule,
  layoutScale = 10,
}: ModuleGeometryProps) {
  const shape = normalize(getCustomShapeName(module));
  const mmToLayout = (mm: number) => (mm / 25.4) * layoutScale;

  const bodyProps = {
    fill: MODULE_FILL,
    stroke: GREEN,
    strokeWidth: 2,
    vectorEffect: "non-scaling-stroke" as const,
  };

  const frontEdgeProps = {
    fill: "none",
    stroke: DARK_GREEN,
    strokeWidth: 5,
    vectorEffect: "non-scaling-stroke" as const,
  };

  const renderBody = () => {
    if (kind === "endCap") {
      return (
        <path
          {...bodyProps}
          d={`M 0 0 H ${size.width - size.height / 2}
              A ${size.height / 2} ${size.height / 2} 0 0 1
              ${size.width - size.height / 2} ${size.height}
              H 0 Z`}
        />
      );
    }

    if (shape === "pie-shaped outside corner") {
      const radius = Math.min(size.width, size.height);
      return (
        <path
          {...bodyProps}
          d={`M 0 ${radius}
              L 0 0
              A ${radius} ${radius} 0 0 1 ${radius} ${radius}
              Z`}
        />
      );
    }

    if (isPolygonModule(module) || shape === "angled inside corner") {
      const polygon = getPolygonGeometry(module);
      const entered: Point[] =
        polygon?.enteredPathPoints ||
        polygon?.points ||
        [];

      if (entered.length >= 3) {
        const path = entered
          .map(
            (point: Point, index: number) =>
              `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
          )
          .join(" ");

        return <path {...bodyProps} d={`${path} Z`} />;
      }
    }

    return (
      <rect
        {...bodyProps}
        x="0"
        y="0"
        width={size.width}
        height={size.height}
        rx="1"
      />
    );
  };

  const renderFrontEdge = () => {
    if (shape === "angled inside corner") {
      const points: Point[] = getPolygonGeometry(module)?.points || [];
      if (points[2] && points[3]) {
        return (
          <line
            {...frontEdgeProps}
            x1={points[2].x}
            y1={points[2].y}
            x2={points[3].x}
            y2={points[3].y}
          />
        );
      }
      return null;
    }

    if (shape === "pie-shaped outside corner") {
      const radius = Math.min(size.width, size.height);
      return (
        <path
          {...frontEdgeProps}
          d={`M 0 0 A ${radius} ${radius} 0 0 1 ${radius} ${radius}`}
        />
      );
    }

    if (kind === "insideCorner" || kind === "outsideCorner") {
      return (
        <>
          <line
            {...frontEdgeProps}
            x1="0"
            y1={size.height - 2}
            x2={size.width}
            y2={size.height - 2}
          />
          <line
            {...frontEdgeProps}
            x1={size.width - 2}
            y1="0"
            x2={size.width - 2}
            y2={size.height}
          />
        </>
      );
    }

    if (kind === "endCap") {
      return (
        <line
          {...frontEdgeProps}
          x1="0"
          y1="0"
          x2="0"
          y2={size.height}
        />
      );
    }

    if (isPolygonModule(module)) {
      const points: Point[] = getPolygonGeometry(module)?.points || [];
      if (points[0] && points[1]) {
        return (
          <line
            {...frontEdgeProps}
            x1={points[0].x}
            y1={points[0].y}
            x2={points[1].x}
            y2={points[1].y}
          />
        );
      }
    }

    return (
      <line
        {...frontEdgeProps}
        x1="0"
        y1={size.height - 2}
        x2={size.width}
        y2={size.height - 2}
      />
    );
  };

  const renderAngledInsideTracks = () => {
    const polygon = getPolygonGeometry(module);
    const points: Point[] = polygon?.points || [];
    if (points.length < 5) return null;

    // Same convention established in the Module Designer:
    // Side 2 = points 1 -> 2; Side 4 = points 3 -> 4.
    const side2Start = points[1];
    const side2End = points[2];
    const side4Start = points[3];
    const side4End = points[4];

    const corner = lineIntersection(
      side2Start,
      side2End,
      side4Start,
      side4End
    );

    if (!corner) return null;

    const pair = radiusPair(module);
    const tracks = [
      { radius: mmToLayout(pair[0]), color: RED },
      { radius: mmToLayout(pair[1]), color: YELLOW },
    ];

    return (
      <>
        {tracks.map((track, index) => {
          const start = tangentPoint(
            corner,
            side2Start,
            side2End,
            track.radius
          );

          const end = tangentPoint(
            corner,
            side4Start,
            side4End,
            track.radius
          );

          const center = {
            x: start.x + end.x - corner.x,
            y: start.y + end.y - corner.y,
          };

          const startVector = {
            x: start.x - center.x,
            y: start.y - center.y,
          };

          const endVector = {
            x: end.x - center.x,
            y: end.y - center.y,
          };

          const cross =
            startVector.x * endVector.y -
            startVector.y * endVector.x;

          const sweepFlag = cross > 0 ? 0 : 1;

          return (
            <path
              key={`angled-inside-track-${index}`}
              d={`M ${start.x} ${start.y}
                  A ${track.radius} ${track.radius}
                  0 0 ${sweepFlag}
                  ${end.x} ${end.y}`}
              fill="none"
              stroke={track.color}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </>
    );
  };

  const renderTracks = () => {
    const pair = radiusPair(module);

    if (shape === "angled inside corner") {
      return renderAngledInsideTracks();
    }

    if (shape === "pie-shaped outside corner") {
      const sectorRadius = Math.min(size.width, size.height);

      const tracks = [
        { radius: mmToLayout(pair[0]), color: YELLOW },
        { radius: mmToLayout(pair[1]), color: RED },
      ];

      return (
        <>
          {tracks.map((track, index) => (
            <path
              key={`pie-track-${index}`}
              d={`M 0 ${sectorRadius - track.radius}
                  A ${track.radius} ${track.radius}
                  0 0 1
                  ${track.radius} ${sectorRadius}`}
              fill="none"
              stroke={track.color}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </>
      );
    }

    if (kind === "insideCorner" || kind === "outsideCorner") {
      const tracks =
        kind === "insideCorner"
          ? [
              { radius: mmToLayout(pair[0]), color: RED },
              { radius: mmToLayout(pair[1]), color: YELLOW },
            ]
          : [
              { radius: mmToLayout(pair[0]), color: YELLOW },
              { radius: mmToLayout(pair[1]), color: RED },
            ];

      return (
        <>
          {tracks.map((track, index) =>
            kind === "outsideCorner" ? (
              <path
                key={`corner-track-${index}`}
                d={`M 0 ${track.radius}
                    A ${track.radius} ${track.radius}
                    0 0 0
                    ${track.radius} 0`}
                fill="none"
                stroke={track.color}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            ) : (
              <path
                key={`corner-track-${index}`}
                d={`M ${size.width - track.radius} ${size.height}
                    A ${track.radius} ${track.radius}
                    0 0 1
                    ${size.width} ${size.height - track.radius}`}
                fill="none"
                stroke={track.color}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            )
          )}
        </>
      );
    }

    if (kind === "endCap") {
      // Keep the legacy end-cap path for now; Goal 5 is about preserving the
      // already-proven designer geometry for the newly-created shapes.
      const front = 20;
      const rear = 33;

      return (
        <>
          {[front, rear].map((offset, index) => {
            const radius = Math.max(1, size.height / 2 - offset);
            return (
              <path
                key={`end-cap-track-${index}`}
                d={`M 0 ${offset}
                    H ${size.width - size.height / 2}
                    A ${radius} ${radius}
                    0 0 1
                    ${size.width - size.height / 2}
                    ${size.height - offset}
                    H 0`}
                fill="none"
                stroke={index === 0 ? RED : YELLOW}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </>
      );
    }

    // Same centerline positions used by the current designer preview:
    // 38.1 mm ballast setback + 12.5 mm half-roadbed = 50.6 mm centerline.
    const frontTrackCenter =
      ((38.1 + 25 / 2) / 25.4) * layoutScale;

    const rearTrackCenter =
      ((38.1 + 25 / 2 + 33) / 25.4) * layoutScale;

    return (
      <>
        <line
          x1="0"
          y1={size.height - frontTrackCenter}
          x2={size.width}
          y2={size.height - frontTrackCenter}
          stroke={RED}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="0"
          y1={size.height - rearTrackCenter}
          x2={size.width}
          y2={size.height - rearTrackCenter}
          stroke={YELLOW}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </>
    );
  };

  return (
    <>
      {renderBody()}
      {renderTracks()}
      {renderFrontEdge()}
    </>
  );
}
