"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { Artwork } from "./artwork";
import { projects, wrapIndex, type Project } from "./projects";
import { useReducedMotion } from "./use-reduced-motion";

type Point = { x: number; y: number };
type Cell = { column: number; row: number };
type Geometry = {
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  stepX: number;
  stepY: number;
};
type TileWindow = { firstColumn: number; lastColumn: number; firstRow: number; lastRow: number };
type Frame = { geometry: Geometry; tiles: TileWindow };
type Drag = {
  id: number;
  origin: Point;
  last: Point;
  timestamp: number;
  velocity: Point;
  moved: boolean;
};

const initialCamera = { x: -0.34, y: -0.08 };
const dragThreshold = 6;
const directions: Record<string, Cell> = {
  ArrowLeft: { column: -1, row: 0 },
  ArrowRight: { column: 1, row: 0 },
  ArrowUp: { column: 0, row: -1 },
  ArrowDown: { column: 0, row: 1 },
};

function measure(width: number, height: number): Geometry {
  const gap = width < 640 ? 12 : 16;
  const tileWidth = Math.round(Math.max(158, Math.min(326, width / 5.25 - gap)));
  const tileHeight = Math.round(tileWidth * 0.79);
  return { width, height, tileWidth, tileHeight, stepX: tileWidth + gap, stepY: tileHeight + gap };
}

function getWindow(camera: Point, { width, height, stepX, stepY }: Geometry): TileWindow {
  return {
    firstColumn: Math.floor(-camera.x - 0.5) - 1,
    lastColumn: Math.floor(width / stepX - camera.x) + 1,
    firstRow: Math.floor(-camera.y) - 1,
    lastRow: Math.floor(height / stepY - camera.y) + 1,
  };
}

function sameWindow(a: TileWindow, b: TileWindow) {
  return a.firstColumn === b.firstColumn && a.lastColumn === b.lastColumn
    && a.firstRow === b.firstRow && a.lastRow === b.lastRow;
}

function rowOffset(row: number) {
  return wrapIndex(row, 2) * 0.42;
}

function projectAt({ column, row }: Cell) {
  return projects[wrapIndex(column + row * 5, projects.length)];
}

function cellAtCenter(camera: Point, geometry: Geometry): Cell {
  const centerX = geometry.width / 2 / geometry.stepX - camera.x;
  const centerY = geometry.height / 2 / geometry.stepY - camera.y;
  const row = Math.round(centerY - geometry.tileHeight / 2 / geometry.stepY);
  const column = Math.round(centerX - rowOffset(row) - geometry.tileWidth / 2 / geometry.stepX);
  return { column, row };
}

const initialGeometry = measure(1440, 610);
const initialFrame = { geometry: initialGeometry, tiles: getWindow(initialCamera, initialGeometry) };

function boardTransform(frame: Frame, camera: Point) {
  const { geometry, tiles } = frame;
  const x = (camera.x + tiles.firstColumn) * geometry.stepX;
  const y = (camera.y + tiles.firstRow) * geometry.stepY;
  return `translate3d(${x}px, ${y}px, 0)`;
}

export function InfiniteCanvas({ onOpen }: { onOpen: (project: Project, trigger: HTMLElement) => void }) {
  const viewport = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const world = useRef({ camera: initialCamera, committed: initialFrame, pending: initialFrame });
  const drag = useRef<Drag | null>(null);
  const suppressedClick = useRef(false);
  const animation = useRef(0);
  const [frame, setFrame] = useState(initialFrame);
  const [dragging, setDragging] = useState(false);
  const [keyboardCell, setKeyboardCell] = useState<Cell | null>(null);
  const reducedMotion = useReducedMotion();

  const moveTo = useCallback((next: Point) => {
    const current = world.current;
    current.camera = next;
    // Move the mounted window immediately. React only recycles tiles at grid boundaries.
    if (board.current) board.current.style.transform = boardTransform(current.committed, next);

    const { geometry, tiles } = current.pending;
    const nextWindow = getWindow(next, geometry);
    if (sameWindow(tiles, nextWindow)) return;
    const nextFrame = { geometry, tiles: nextWindow };
    current.pending = nextFrame;
    setFrame(nextFrame);
  }, []);

  const pan = useCallback((x: number, y: number) => {
    const { camera, pending: { geometry } } = world.current;
    moveTo({ x: camera.x + x / geometry.stepX, y: camera.y + y / geometry.stepY });
  }, [moveTo]);

  useLayoutEffect(() => {
    world.current.committed = frame;
    if (board.current) board.current.style.transform = boardTransform(frame, world.current.camera);
  }, [frame]);

  useEffect(() => {
    if (reducedMotion) cancelAnimationFrame(animation.current);
  }, [reducedMotion]);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;

    const resize = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width === 0 || height === 0) return;
      const current = world.current;
      if (width === current.pending.geometry.width && height === current.pending.geometry.height) return;
      const geometry = measure(width, height);
      const next = { geometry, tiles: getWindow(current.camera, geometry) };
      current.pending = next;
      setFrame(next);
    });
    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      event.preventDefault();
      cancelAnimationFrame(animation.current);
      setKeyboardCell(null);
      const { height } = world.current.pending.geometry;
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1;
      const x = event.shiftKey && event.deltaX === 0 ? event.deltaY : event.deltaX;
      const y = event.shiftKey && event.deltaX === 0 ? 0 : event.deltaY;
      pan(-x * unit, -y * unit);
    };

    resize.observe(element);
    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      resize.disconnect();
      element.removeEventListener("wheel", handleWheel);
      cancelAnimationFrame(animation.current);
    };
  }, [pan]);

  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || drag.current) return;
    cancelAnimationFrame(animation.current);
    suppressedClick.current = false;
    const point = { x: event.clientX, y: event.clientY };
    drag.current = {
      id: event.pointerId,
      origin: point,
      last: point,
      timestamp: event.timeStamp,
      velocity: { x: 0, y: 0 },
      moved: false,
    };
  }

  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    const point = { x: event.clientX, y: event.clientY };
    if (!current.moved) {
      if (Math.hypot(point.x - current.origin.x, point.y - current.origin.y) < dragThreshold) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      current.moved = true;
      suppressedClick.current = true;
      setKeyboardCell(null);
      setDragging(true);
    }
    const x = point.x - current.last.x;
    const y = point.y - current.last.y;
    const elapsed = Math.max(event.timeStamp - current.timestamp, 8);
    current.velocity = { x: x / elapsed, y: y / elapsed };
    current.last = point;
    current.timestamp = event.timeStamp;
    pan(x, y);
  }

  function pointerEnd(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    drag.current = null;
    if (!current.moved) return;

    setDragging(false);
    if (reducedMotion || event.type !== "pointerup" || event.timeStamp - current.timestamp > 85) return;
    let velocityX = Math.max(-2.6, Math.min(2.6, current.velocity.x));
    let velocityY = Math.max(-2.6, Math.min(2.6, current.velocity.y));
    let previous = performance.now();

    function coast(now: number) {
      const elapsed = Math.min(now - previous, 32);
      previous = now;
      const friction = Math.exp(-elapsed / 95);
      velocityX *= friction;
      velocityY *= friction;
      if (Math.hypot(velocityX, velocityY) < 0.025) return;
      pan(velocityX * elapsed, velocityY * elapsed);
      animation.current = requestAnimationFrame(coast);
    }

    animation.current = requestAnimationFrame(coast);
  }

  function keyboardPan(event: KeyboardEvent<HTMLDivElement>) {
    const direction = directions[event.key];
    const { camera, pending: { geometry } } = world.current;
    if (direction) {
      event.preventDefault();
      cancelAnimationFrame(animation.current);
      event.currentTarget.focus({ preventScroll: true });
      const current = keyboardCell ?? cellAtCenter(camera, geometry);
      const next = { column: current.column + direction.column, row: current.row + direction.row };
      setKeyboardCell(next);
      moveTo({
        x: (geometry.width - geometry.tileWidth) / 2 / geometry.stepX - next.column - rowOffset(next.row),
        y: (geometry.height - geometry.tileHeight) / 2 / geometry.stepY - next.row,
      });
    } else if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      cancelAnimationFrame(animation.current);
      onOpen(projectAt(keyboardCell ?? cellAtCenter(camera, geometry)), event.currentTarget);
    }
  }

  const { geometry, tiles } = frame;
  const cells = [];
  for (let row = tiles.firstRow; row <= tiles.lastRow; row++) {
    for (let column = tiles.firstColumn; column <= tiles.lastColumn; column++) {
      const project = projectAt({ column, row });
      const selected = keyboardCell?.column === column && keyboardCell.row === row;
      cells.push(
        <button
          key={`${column}:${row}`}
          type="button"
          className="canvas-tile"
          data-selected={selected || undefined}
          tabIndex={-1}
          aria-label={project.title}
          onClick={(event) => {
            cancelAnimationFrame(animation.current);
            onOpen(project, event.currentTarget);
          }}
          style={{
            left: (column - tiles.firstColumn + rowOffset(row)) * geometry.stepX,
            top: (row - tiles.firstRow) * geometry.stepY,
            width: geometry.tileWidth,
            height: geometry.tileHeight,
          }}
        >
          <Artwork project={project} decorative sizes="(max-width: 910px) 158px, (max-width: 1800px) 18vw, 326px" />
          <span className="canvas-tile-title" aria-hidden="true">{project.title}</span>
        </button>,
      );
    }
  }

  return (
    <div
      ref={viewport}
      role="region"
      aria-label="Canvas des projets"
      aria-describedby="canvas-instructions"
      className="canvas-viewport"
      data-dragging={dragging || undefined}
      tabIndex={0}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerEnd}
      onPointerCancel={pointerEnd}
      onLostPointerCapture={pointerEnd}
      onPointerLeave={(event) => {
        if (!drag.current?.moved) pointerEnd(event);
      }}
      onClickCapture={(event) => {
        if (suppressedClick.current && event.detail > 0) {
          event.preventDefault();
          event.stopPropagation();
          suppressedClick.current = false;
        }
      }}
      onKeyDown={keyboardPan}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setKeyboardCell(null);
      }}
    >
      <span id="canvas-instructions" className="sr-only">
        Déplacez-vous avec les flèches du clavier. Appuyez sur Entrée pour ouvrir le projet sélectionné.
      </span>
      <div ref={board} className="canvas-board" style={{ transform: boardTransform(initialFrame, initialCamera) }}>
        {cells}
      </div>
      <span className="sr-only" aria-live="polite">
        {keyboardCell ? projectAt(keyboardCell).title : ""}
      </span>
    </div>
  );
}
