import Image from "next/image";
import type { Project } from "./projects";

type ArtworkProps = {
  project: Project;
  decorative?: boolean;
  eager?: boolean;
  sizes: string;
};

export function Artwork({ project, decorative = false, eager = false, sizes }: ArtworkProps) {
  return (
    <span className="artwork" style={{ backgroundColor: project.color }}>
      <Image
        src={project.image}
        alt={decorative ? "" : project.alt}
        width={960}
        height={960}
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        draggable={false}
      />
    </span>
  );
}
