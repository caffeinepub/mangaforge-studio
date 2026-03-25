import type { ReactNode } from "react";

interface Layout {
  id: number;
  name: string;
  elements: ReactNode;
}

const R = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => (
  <rect
    x={x}
    y={y}
    width={w}
    height={h}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
  />
);

const LAYOUTS: Layout[] = [
  {
    id: 1,
    name: "Single Full Page",
    elements: <R x={2} y={2} w={56} h={76} />,
  },
  {
    id: 2,
    name: "2 Horizontal Strips",
    elements: (
      <>
        <R x={2} y={2} w={56} h={37} />
        <R x={2} y={41} w={56} h={37} />
      </>
    ),
  },
  {
    id: 3,
    name: "3 Horizontal Strips",
    elements: (
      <>
        <R x={2} y={2} w={56} h={23} />
        <R x={2} y={27} w={56} h={23} />
        <R x={2} y={52} w={56} h={26} />
      </>
    ),
  },
  {
    id: 4,
    name: "2×2 Grid",
    elements: (
      <>
        <R x={2} y={2} w={26} h={37} />
        <R x={32} y={2} w={26} h={37} />
        <R x={2} y={41} w={26} h={37} />
        <R x={32} y={41} w={26} h={37} />
      </>
    ),
  },
  {
    id: 5,
    name: "2×3 Grid",
    elements: (
      <>
        <R x={2} y={2} w={26} h={23} />
        <R x={32} y={2} w={26} h={23} />
        <R x={2} y={27} w={26} h={23} />
        <R x={32} y={27} w={26} h={23} />
        <R x={2} y={52} w={26} h={26} />
        <R x={32} y={52} w={26} h={26} />
      </>
    ),
  },
  {
    id: 6,
    name: "3×3 Grid",
    elements: (
      <>
        <R x={2} y={2} w={17} h={23} />
        <R x={22} y={2} w={17} h={23} />
        <R x={42} y={2} w={17} h={23} />
        <R x={2} y={27} w={17} h={23} />
        <R x={22} y={27} w={17} h={23} />
        <R x={42} y={27} w={17} h={23} />
        <R x={2} y={52} w={17} h={26} />
        <R x={22} y={52} w={17} h={26} />
        <R x={42} y={52} w={17} h={26} />
      </>
    ),
  },
  {
    id: 7,
    name: "Large Top + 2 Bottom",
    elements: (
      <>
        <R x={2} y={2} w={56} h={44} />
        <R x={2} y={48} w={26} h={30} />
        <R x={32} y={48} w={26} h={30} />
      </>
    ),
  },
  {
    id: 8,
    name: "2 Top + Large Bottom",
    elements: (
      <>
        <R x={2} y={2} w={26} h={30} />
        <R x={32} y={2} w={26} h={30} />
        <R x={2} y={34} w={56} h={44} />
      </>
    ),
  },
  {
    id: 9,
    name: "Large Left + 2 Right",
    elements: (
      <>
        <R x={2} y={2} w={34} h={76} />
        <R x={38} y={2} w={20} h={36} />
        <R x={38} y={40} w={20} h={38} />
      </>
    ),
  },
  {
    id: 10,
    name: "2 Left + Large Right",
    elements: (
      <>
        <R x={2} y={2} w={20} h={36} />
        <R x={2} y={40} w={20} h={38} />
        <R x={24} y={2} w={34} h={76} />
      </>
    ),
  },
  {
    id: 11,
    name: "Dynamic Diagonal",
    elements: (
      <>
        <polygon
          points="2,2 58,2 58,40 2,60"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        />
        <polygon
          points="2,60 58,40 58,78 2,78"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        />
      </>
    ),
  },
  {
    id: 12,
    name: "Action Burst",
    elements: (
      <>
        <R x={2} y={2} w={26} h={36} />
        <R x={32} y={2} w={26} h={36} />
        <R x={2} y={40} w={26} h={38} />
        <R x={32} y={40} w={26} h={38} />
        <line
          x1="30"
          y1="2"
          x2="30"
          y2="78"
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.4}
        />
        <line
          x1="2"
          y1="39"
          x2="58"
          y2="39"
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.4}
        />
      </>
    ),
  },
  {
    id: 13,
    name: "Focus Point",
    elements: (
      <>
        <R x={16} y={16} w={28} h={48} />
        <R x={2} y={2} w={12} h={12} />
        <R x={46} y={2} w={12} h={12} />
        <R x={2} y={66} w={12} h={12} />
        <R x={46} y={66} w={12} h={12} />
      </>
    ),
  },
  {
    id: 14,
    name: "Cinematic Widescreen",
    elements: (
      <>
        <R x={2} y={2} w={56} h={18} />
        <R x={2} y={22} w={56} h={18} />
        <R x={2} y={42} w={56} h={38} />
      </>
    ),
  },
  {
    id: 15,
    name: "Vertical Flow",
    elements: (
      <>
        <R x={2} y={2} w={17} h={76} />
        <R x={22} y={2} w={17} h={76} />
        <R x={42} y={2} w={16} h={76} />
      </>
    ),
  },
  {
    id: 16,
    name: "Staircase Down",
    elements: (
      <>
        <R x={2} y={2} w={22} h={28} />
        <R x={26} y={2} w={30} h={28} />
        <R x={2} y={32} w={30} h={46} />
        <R x={34} y={32} w={24} h={46} />
      </>
    ),
  },
  {
    id: 17,
    name: "Staircase Up",
    elements: (
      <>
        <R x={2} y={50} w={30} h={28} />
        <R x={34} y={50} w={24} h={28} />
        <R x={2} y={2} w={24} h={46} />
        <R x={28} y={2} w={30} h={46} />
      </>
    ),
  },
  {
    id: 18,
    name: "Cross Split",
    elements: (
      <>
        <R x={2} y={2} w={30} h={44} />
        <R x={34} y={2} w={24} h={44} />
        <R x={2} y={48} w={24} h={30} />
        <R x={28} y={48} w={30} h={30} />
      </>
    ),
  },
  {
    id: 19,
    name: "Overlapping Panels",
    elements: (
      <>
        <R x={2} y={2} w={40} h={44} />
        <R x={18} y={30} w={40} h={48} />
      </>
    ),
  },
  {
    id: 20,
    name: "Scattered Dynamic",
    elements: (
      <>
        <R x={2} y={2} w={24} h={38} />
        <R x={28} y={8} w={30} h={24} />
        <R x={2} y={42} w={36} h={36} />
        <R x={40} y={34} w={18} h={44} />
      </>
    ),
  },
  {
    id: 21,
    name: "Top Banner + Grid",
    elements: (
      <>
        <R x={2} y={2} w={56} h={22} />
        <R x={2} y={26} w={26} h={52} />
        <R x={30} y={26} w={26} h={52} />
      </>
    ),
  },
  {
    id: 22,
    name: "Bottom Banner + Grid",
    elements: (
      <>
        <R x={2} y={2} w={26} h={52} />
        <R x={30} y={2} w={26} h={52} />
        <R x={2} y={56} w={56} h={22} />
      </>
    ),
  },
  {
    id: 23,
    name: "Triptych Vertical",
    elements: (
      <>
        <R x={2} y={2} w={17} h={44} />
        <R x={22} y={18} w={17} h={60} />
        <R x={42} y={2} w={16} h={44} />
      </>
    ),
  },
  {
    id: 24,
    name: "Manga Splash",
    elements: (
      <>
        <R x={2} y={2} w={36} h={76} />
        <R x={40} y={2} w={18} h={24} />
        <R x={40} y={28} w={18} h={24} />
        <R x={40} y={54} w={18} h={24} />
      </>
    ),
  },
  {
    id: 25,
    name: "Full Bleed Spread",
    elements: (
      <>
        <R x={2} y={2} w={27} h={76} />
        <R x={31} y={2} w={27} h={76} />
      </>
    ),
  },
];

interface Props {
  selectedLayout: number | null;
  onSelect: (id: number) => void;
}

export default function PanelLayoutPicker({ selectedLayout, onSelect }: Props) {
  return (
    <div className="grid grid-cols-5 gap-2 p-2">
      {LAYOUTS.map((layout) => {
        const isSelected = selectedLayout === layout.id;
        return (
          <button
            type="button"
            key={layout.id}
            data-ocid={`panel_layout.item.${layout.id}`}
            onClick={() => onSelect(layout.id)}
            className={`panel-layout-tile flex flex-col items-center gap-1 p-1.5 rounded border ${
              isSelected
                ? "selected border-amber bg-amber/10"
                : "border-border bg-card hover:border-muted-foreground"
            }`}
            title={layout.name}
          >
            <svg
              viewBox="0 0 60 80"
              width="48"
              height="64"
              className="text-foreground/60"
              style={isSelected ? { color: "oklch(var(--amber))" } : {}}
            >
              <title>{layout.name}</title>
              {layout.elements}
            </svg>
            <span className="text-[9px] text-center leading-tight text-muted-foreground line-clamp-2">
              {layout.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export { LAYOUTS };
