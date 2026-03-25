import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Eraser, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const PALETTE = [
  "#000000",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
];

interface SketchCanvasProps {
  initialData?: string;
  onSave: (base64: string) => void;
  onCancel: () => void;
}

export default function SketchCanvas({
  initialData,
  onSave,
  onCancel,
}: SketchCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [tool, setTool] = useState<"brush" | "eraser">("brush");
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState([4]);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (initialData) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = initialData;
    }
  }, [initialData]);

  const getPos = useCallback(
    (
      e: React.MouseEvent | React.TouchEvent,
    ): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      if ("touches" in e) {
        const t = e.touches[0];
        if (!t) return null;
        return {
          x: (t.clientX - rect.left) * scaleX,
          y: (t.clientY - rect.top) * scaleY,
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    [],
  );

  const startDraw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      setDrawing(true);
      const pos = getPos(e);
      lastPos.current = pos;
    },
    [getPos],
  );

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!drawing) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx || !canvas) return;
      const pos = getPos(e);
      if (!pos) return;
      const from = lastPos.current ?? pos;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = tool === "eraser" ? "#1a1a1a" : color;
      ctx.lineWidth = tool === "eraser" ? size[0] * 3 : size[0];
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      lastPos.current = pos;
    },
    [drawing, getPos, tool, color, size],
  );

  const endDraw = useCallback(() => {
    setDrawing(false);
    lastPos.current = null;
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL("image/png"));
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant={tool === "brush" ? "default" : "outline"}
            onClick={() => setTool("brush")}
            className="h-7 px-2 text-xs"
            data-ocid="sketch.brush.toggle"
          >
            Brush
          </Button>
          <Button
            size="sm"
            variant={tool === "eraser" ? "default" : "outline"}
            onClick={() => setTool("eraser")}
            className="h-7 px-2 text-xs"
            data-ocid="sketch.eraser.toggle"
          >
            <Eraser className="w-3 h-3" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setColor(c);
                setTool("brush");
              }}
              className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                background: c,
                borderColor:
                  color === c && tool === "brush"
                    ? "oklch(0.9 0.1 85)"
                    : "transparent",
              }}
              aria-label={c}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 min-w-24">
          <Label className="text-xs whitespace-nowrap">Size</Label>
          <Slider
            value={size}
            onValueChange={setSize}
            min={1}
            max={24}
            step={1}
            className="flex-1"
            data-ocid="sketch.size.slider"
          />
          <span className="text-xs w-5">{size[0]}</span>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={clearCanvas}
          className="h-7 px-2 ml-auto"
          data-ocid="sketch.clear.button"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        className="w-full rounded-lg border border-border cursor-crosshair touch-none"
        style={{ background: "#1a1a1a" }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
        data-ocid="sketch.canvas_target"
      />

      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          onClick={onCancel}
          data-ocid="sketch.cancel_button"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          style={{ background: "oklch(var(--blue-action))", color: "white" }}
          data-ocid="sketch.save_button"
        >
          Save Sketch
        </Button>
      </div>
    </div>
  );
}
