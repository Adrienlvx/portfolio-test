"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import { Artwork } from "./artwork";
import { Icon } from "./icons";
import { InfiniteCanvas } from "./infinite-canvas";
import { categories, projects, wrapIndex, type Project } from "./projects";

const views = [
  { id: "canvas", label: "Canvas" },
  { id: "list", label: "Liste" },
  { id: "gallery", label: "Galerie" },
] as const;

type View = (typeof views)[number]["id"];
type Overlay = { type: "intro" | "menu" } | { type: "project"; project: Project };
type OpenProject = (project: Project, trigger: HTMLElement) => void;

const introKey = "atelier-atlas:intro";

function showIntroThisSession() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    if (sessionStorage.getItem(introKey)) return false;
    sessionStorage.setItem(introKey, "seen");
  } catch {
    // A blocked session store still allows the introduction to be skipped.
  }
  return true;
}

export function Portfolio() {
  const [view, setView] = useState<View>("canvas");
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const origin = useRef<HTMLElement | null>(null);
  const viewControls = useRef<HTMLElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (showIntroThisSession()) {
        setOverlay((current) => current ?? { type: "intro" });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  function restoreFocus(target: HTMLElement | null) {
    requestAnimationFrame(() => {
      if (target?.isConnected && target.getClientRects().length) {
        target.focus({ preventScroll: true });
      } else {
        viewControls.current?.querySelector<HTMLButtonElement>("[aria-pressed=true]")?.focus();
      }
    });
  }

  function closeOverlay() {
    const target = origin.current;
    origin.current = null;
    setOverlay(null);
    if (overlay?.type !== "intro") restoreFocus(target);
  }

  function openProject(project: Project, trigger: HTMLElement) {
    origin.current = trigger;
    setOverlay({ type: "project", project });
  }

  function chooseView(next: View) {
    setView(next);
    if (overlay?.type === "menu") {
      origin.current = null;
      setOverlay(null);
      restoreFocus(null);
    }
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="wordmark">
          <span className="atlas-mark" aria-hidden="true" />
          <span>Atelier Atlas</span>
        </div>
        <button
          className="menu-button"
          type="button"
          aria-haspopup="dialog"
          onClick={(event) => {
            origin.current = event.currentTarget;
            setOverlay({ type: "menu" });
          }}
        >
          <Icon name="menu" />
          Menu
        </button>
      </header>

      <main className="portfolio">
        <div className="portfolio-heading">
          <h1>Atlas visuel<span aria-hidden="true">.</span></h1>
          <p>Une collection d’illustrations, d’affiches<br className="wide-break" /> et d’études visuelles à explorer.</p>
        </div>

        <div className="portfolio-stage">
          <div className="view-panel" hidden={view !== "canvas"}>
            <InfiniteCanvas onOpen={openProject} />
          </div>
          <div className="view-panel list-panel" hidden={view !== "list"}>
            <ProjectList onOpen={openProject} />
          </div>
          <div className="view-panel gallery-panel" hidden={view !== "gallery"}>
            <Gallery onOpen={openProject} active={view === "gallery"} />
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <span className="project-count">{projects.length} projets</span>
        <nav ref={viewControls} className="view-switcher" aria-label="Vues du portfolio">
          {views.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              onClick={() => chooseView(id)}
            >
              <Icon name={id} />
              {label}
            </button>
          ))}
        </nav>
        {view === "canvas" && (
          <span className="canvas-hint">
            <Icon name="move" />
            Glisser pour explorer
          </span>
        )}
      </footer>

      {overlay?.type === "intro" && <Introduction onClose={closeOverlay} />}
      {overlay?.type === "menu" && (
        <OverlayDialog variant="menu" title="À propos" onClose={closeOverlay}>
          <p>Atelier Atlas est un portfolio de démonstration. Il réunit des projets fictifs autour de l’illustration, de l’affiche et de la couleur.</p>
          <nav className="menu-views" aria-label="Explorer les projets">
            {views.map(({ id, label }) => (
              <button key={id} type="button" aria-current={view === id ? "true" : undefined} onClick={() => chooseView(id)}>
                <Icon name={id} />
                {label}
              </button>
            ))}
          </nav>
        </OverlayDialog>
      )}
      {overlay?.type === "project" && (
        <OverlayDialog
          variant="project"
          title={overlay.project.title}
          category={overlay.project.category}
          onClose={closeOverlay}
        >
          <Artwork project={overlay.project} eager sizes="(max-width: 575px) 90vw, 491px" />
          <p>{overlay.project.description}</p>
        </OverlayDialog>
      )}
    </div>
  );
}

function normalizeSearch(value: string) {
  return value.toLocaleLowerCase("fr").normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function ProjectList({ onOpen }: { onOpen: OpenProject }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const query = normalizeSearch(search.trim());
  const filtered = projects.filter((project) =>
    (!category || project.category === category) && normalizeSearch(project.title).includes(query),
  );

  return (
    <section className="project-list" aria-label="Liste des projets">
      <div className="list-controls">
        <label className="search-control">
          <Icon name="search" />
          <span className="sr-only">Rechercher par titre</span>
          <input
            type="search"
            placeholder="Rechercher un projet"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
          />
        </label>
        <label className="category-control">
          <span className="sr-only">Filtrer par catégorie</span>
          <select value={category} onChange={(event) => setCategory(event.currentTarget.value)}>
            <option value="">Toutes les catégories</option>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <span className="result-count" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "résultat" : "résultats"}
        </span>
      </div>

      {filtered.length ? (
        <ul className="list-rows">
          {filtered.map((project) => (
            <li key={project.id}>
              <button type="button" onClick={(event) => onOpen(project, event.currentTarget)}>
                <Artwork project={project} decorative sizes="49px" />
                <span className="list-title">{project.title}</span>
                <span className="list-category">{project.category}</span>
                <Icon name="right" />
              </button>
            </li>
          ))}
        </ul>
      ) : <p className="empty-state">Aucun projet ne correspond à la recherche.</p>}
    </section>
  );
}

function Gallery({ onOpen, active }: { onOpen: OpenProject; active: boolean }) {
  const [index, setIndex] = useState(0);
  const start = useRef<{ id: number; x: number; y: number } | null>(null);
  const ignoreClick = useRef(false);
  const project = projects[index];

  function step(direction: number) {
    setIndex((current) => wrapIndex(current + direction, projects.length));
  }

  function swipeStart(event: PointerEvent<HTMLElement>) {
    ignoreClick.current = false;
    if (event.pointerType !== "touch" || start.current) return;
    start.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }

  function swipeEnd(event: PointerEvent<HTMLElement>) {
    const point = start.current;
    if (!point || point.id !== event.pointerId) return;
    start.current = null;
    if (event.type === "pointercancel") return;
    const x = event.clientX - point.x;
    const y = event.clientY - point.y;
    if (Math.abs(x) < 40 || Math.abs(x) <= Math.abs(y)) return;
    ignoreClick.current = true;
    step(x > 0 ? -1 : 1);
  }

  return (
    <section
      className="gallery"
      aria-label="Galerie des projets"
      onKeyDown={(event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        step(event.key === "ArrowLeft" ? -1 : 1);
      }}
    >
      <div
        className="gallery-slide"
        onPointerDown={swipeStart}
        onPointerUp={swipeEnd}
        onPointerCancel={swipeEnd}
      >
        <button
          type="button"
          className="gallery-art"
          aria-label={`Ouvrir ${project.title}`}
          onClick={(event) => {
            if (ignoreClick.current && event.detail > 0) {
              ignoreClick.current = false;
              return;
            }
            onOpen(project, event.currentTarget);
          }}
        >
          <Artwork
            project={project}
            decorative
            eager={active}
            sizes="(max-width: 720px) min(85vw, 340px), min(42vw, 500px)"
          />
        </button>
        <div className="gallery-caption" aria-live="polite">
          <span>{project.category}</span>
          <h2>{project.title}</h2>
        </div>
      </div>

      <div className="gallery-controls">
        <button className="icon-button" type="button" aria-label="Projet précédent" onClick={() => step(-1)}>
          <Icon name="left" />
        </button>
        <span aria-label={`Projet ${index + 1} sur ${projects.length}`}>{index + 1} / {projects.length}</span>
        <button className="icon-button" type="button" aria-label="Projet suivant" onClick={() => step(1)}>
          <Icon name="right" />
        </button>
      </div>
    </section>
  );
}

function Introduction({ onClose }: { onClose: () => void }) {
  const close = useRef(onClose);

  useEffect(() => {
    const timeout = window.setTimeout(() => close.current(), 1700);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const skipOnReducedMotion = () => {
      if (motion.matches) close.current();
    };
    motion.addEventListener("change", skipOnReducedMotion);
    return () => {
      window.clearTimeout(timeout);
      motion.removeEventListener("change", skipOnReducedMotion);
    };
  }, []);

  return (
    <OverlayDialog variant="intro" title="Atlas visuel" onClose={onClose}>
      <button className="intro-skip" type="button" onClick={onClose}>Passer l’introduction</button>
    </OverlayDialog>
  );
}

type OverlayProps = {
  variant: "intro" | "menu" | "project";
  title: string;
  category?: string;
  onClose: () => void;
  children: ReactNode;
};

function OverlayDialog({ variant, title, category, onClose, children }: OverlayProps) {
  const element = useRef<HTMLDialogElement>(null);
  const label = useId();

  useEffect(() => {
    const dialog = element.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={element}
      className={`overlay overlay--${variant}`}
      aria-labelledby={label}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <div className="overlay-inner">
        {variant !== "intro" && (
          <button className="icon-button overlay-close" type="button" aria-label="Fermer" onClick={onClose}>
            <Icon name="close" />
          </button>
        )}
        {variant === "intro" && <span className="atlas-mark" aria-hidden="true" />}
        {category && <div className="overlay-category">{category}</div>}
        <h2 id={label}>{title}</h2>
        {children}
      </div>
    </dialog>
  );
}
