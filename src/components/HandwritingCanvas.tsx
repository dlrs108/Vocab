import React, { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from 'react';

interface HandwritingCanvasProps {
  width?: number;
  height?: number;
  lineWidth?: number;
  color?: string;
  guideline?: string;
}

export interface HandwritingCanvasHandle {
  clear: () => void;
}

const HandwritingCanvas = forwardRef<HandwritingCanvasHandle, HandwritingCanvasProps>(({
  width = 360,
  height = 120,
  lineWidth = 3,
  color = '#333',
  guideline,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const hasDrawn = useRef(false);

  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    return ctx;
  }, []);

  const drawBackground = useCallback(() => {
    const ctx = getCanvasContext();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw baseline guides (three-line writing guide)
    const topLine = canvas.height * 0.2;
    const midLine = canvas.height * 0.5;
    const bottomLine = canvas.height * 0.8;

    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 1;

    // Top line (for tall letters like b, d, h)
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, topLine);
    ctx.lineTo(canvas.width, topLine);
    ctx.stroke();

    // Middle line (baseline for most letters)
    ctx.strokeStyle = '#d0d0d0';
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(0, midLine);
    ctx.lineTo(canvas.width, midLine);
    ctx.stroke();

    // Bottom line (for descenders like g, p, y)
    ctx.strokeStyle = '#e8e8e8';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, bottomLine);
    ctx.lineTo(canvas.width, bottomLine);
    ctx.stroke();

    ctx.setLineDash([]);

    // Draw guideline text (faded reference)
    if (guideline) {
      ctx.save();
      const fontSize = Math.min(canvas.height * 0.55, 64);
      ctx.font = `${fontSize}px "Courier New", "Consolas", monospace`;
      ctx.fillStyle = '#e8e8e8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(guideline, canvas.width / 2, midLine);
      ctx.restore();
    }
  }, [guideline, getCanvasContext]);

  useImperativeHandle(ref, () => ({
    clear: () => {
      hasDrawn.current = false;
      drawBackground();
    },
  }));

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      if (!touch) return lastPos.current || { x: 0, y: 0 };
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    hasDrawn.current = true;
    lastPos.current = getPos(e);
  }, [getPos]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || !lastPos.current) return;
    const ctx = getCanvasContext();
    if (!ctx) return;

    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
  }, [isDrawing, getPos, color, lineWidth, getCanvasContext]);

  const stopDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(false);
    lastPos.current = null;
  }, []);

  const handleClear = useCallback(() => {
    hasDrawn.current = false;
    drawBackground();
  }, [drawBackground]);

  useEffect(() => {
    drawBackground();
  }, [drawBackground]);

  return (
    <div className="relative inline-block w-full" style={{ maxWidth: width }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border-2 border-gray-300 rounded-lg bg-white cursor-crosshair touch-none w-full"
        style={{ aspectRatio: `${width}/${height}` }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />
      <button
        onClick={handleClear}
        className="absolute top-1.5 right-1.5 bg-white/90 hover:bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded border border-gray-200"
      >
        清除
      </button>
    </div>
  );
});

HandwritingCanvas.displayName = 'HandwritingCanvas';

export default HandwritingCanvas;
