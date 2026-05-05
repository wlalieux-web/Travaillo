"use client";

import { useRef, useState, useEffect } from "react";
import { RotateCcw } from "lucide-react";

interface Props {
  onSign: (dataUrl: string) => void;
}

export function QuoteSignaturePad({ onSign }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    setDrawing(true);
    lastPos.current = getPos(e);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing || !lastPos.current) return;
    e.preventDefault();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    setHasSignature(true);
  }

  function endDraw() {
    setDrawing(false);
    lastPos.current = null;
    if (hasSignature) {
      onSign(canvasRef.current!.toDataURL());
    }
  }

  function clear() {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSign("");
  }

  return (
    <div className="space-y-2">
      <div className="relative rounded-xl border border-emerald-900/30 bg-white/[0.03] overflow-hidden">
        <canvas
          ref={canvasRef}
          width={500}
          height={150}
          className="w-full touch-none cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {!hasSignature && (
          <p className="absolute inset-0 flex items-center justify-center text-white/20 text-sm pointer-events-none">
            Signez ici
          </p>
        )}
      </div>
      {hasSignature && (
        <button
          onClick={clear}
          className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition-colors"
        >
          <RotateCcw className="h-3 w-3" /> Effacer
        </button>
      )}
    </div>
  );
}
