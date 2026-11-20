import type { SVGProps } from "react";

type IconName = "menu" | "close" | "canvas" | "list" | "gallery" | "move" | "left" | "right" | "search";

const paths: Record<IconName, React.ReactNode> = {
  menu: <path d="M3 6h14M3 13h14" />,
  close: <path d="m5 5 10 10M15 5 5 15" />,
  canvas: <path d="M3 3h5v5H3zM12 3h5v5h-5zM3 12h5v5H3zM12 12h5v5h-5z" />,
  list: <path d="M6.5 4.5h10m-10 5.5h10m-10 5.5h10M3 4.5h.1M3 10h.1M3 15.5h.1" />,
  gallery: <><rect x="5" y="3" width="10" height="14" rx="1" /><path d="M2 6v8m16-8v8" /></>,
  move: <path d="M10 2v16M2 10h16M7.5 4.5 10 2l2.5 2.5m-5 11L10 18l2.5-2.5m3-8L18 10l-2.5 2.5m-11-5L2 10l2.5 2.5" />,
  left: <path d="m11.5 4.5-5.5 5.5 5.5 5.5" />,
  right: <path d="m8.5 4.5 5.5 5.5-5.5 5.5" />,
  search: <><circle cx="8.5" cy="8.5" r="4.5" /><path d="m12 12 4 4" /></>,
};

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
