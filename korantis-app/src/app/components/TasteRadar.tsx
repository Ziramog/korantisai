"use client";

import { useEffect, useRef } from 'react';
import { useCircadian } from '../contexts/CircadianContext';

export default function TasteRadar() {
  const { identityCentroid, currentDrift, dimensionLabels } = useCircadian();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // HiDPI Mobile Screen Optimization (Retina support)
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const rect = canvas.getBoundingClientRect();
    
    // Set actual rendering resolution
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // Scale drawing context to match device pixels
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Adaptive sizing for narrow screen targets (e.g. mobile 320px width)
    const padding = width < 330 ? 30 : 45;
    const radius = Math.min(width, height) / 2 - padding;

    // Clear previous frame
    ctx.clearRect(0, 0, width, height);

    // Draw background concentric grid rings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    const rings = 4;
    for (let i = 1; i <= rings; i++) {
      const r = (radius / rings) * i;
      ctx.beginPath();
      for (let j = 0; j <= 8; j++) {
        const angle = (Math.PI * 2 / 8) * j - Math.PI / 2;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Draw axes & text labels
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i - Math.PI / 2;
      
      // Draw axis lines
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
      ctx.stroke();

      // Render double-sided conceptual labels
      const labelRadius = radius + (width < 330 ? 14 : 20);
      const labelX = centerX + Math.cos(angle) * labelRadius;
      const labelY = centerY + Math.sin(angle) * labelRadius;

      ctx.fillStyle = 'rgba(245, 240, 232, 0.45)';
      ctx.font = width < 330 
        ? 'bold 7px system-ui, -apple-system, sans-serif' 
        : '500 8.5px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const label = dimensionLabels[i].split(' vs. ');
      
      // Fine-tune labels alignment
      if (Math.abs(Math.cos(angle)) < 0.1) {
        // Vertical axes
        ctx.fillText(label[1], labelX, labelY - 5);
        ctx.fillText(label[0], labelX, labelY + 5);
      } else if (Math.cos(angle) > 0) {
        // Right side axes
        ctx.textAlign = 'left';
        ctx.fillText(label[1], labelX + 2, labelY - 5);
        ctx.fillText(label[0], labelX + 2, labelY + 5);
      } else {
        // Left side axes
        ctx.textAlign = 'right';
        ctx.fillText(label[1], labelX - 2, labelY - 5);
        ctx.fillText(label[0], labelX - 2, labelY + 5);
      }
    }

    // Helper: Draw continuous filled vector polygon
    function drawPolygon(vector: number[], color: string, fill: string, lineWidth: number) {
      if (!ctx) return;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i - Math.PI / 2;
        const val = (vector[i] + 1) / 2;
        const r = val * radius;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }

    // Render baseline (translucent white outline)
    drawPolygon(identityCentroid, 'rgba(255, 255, 255, 0.22)', 'rgba(255, 255, 255, 0.02)', 1.2);
    
    // Render session transient (warm gold glow overlay)
    drawPolygon(currentDrift, '#C9A96E', 'rgba(201, 169, 110, 0.15)', 1.8);

    // Draw origin point
    ctx.beginPath();
    ctx.arc(centerX, centerY, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#C9A96E';
    ctx.fill();

  }, [identityCentroid, currentDrift, dimensionLabels]);

  return (
    <div className="w-full flex justify-center py-2 relative">
      <div className="relative p-4 bg-k-surface/20 border border-white/[0.02] rounded-2xl shadow-inner max-w-full">
        {/* Soft atmospheric gradient background filter */}
        <div className="absolute inset-0 pointer-events-none rounded-2xl bg-gradient-to-b from-k-gold-glow/40 to-transparent mix-blend-screen opacity-30"></div>
        <canvas 
          ref={canvasRef} 
          className="w-[270px] h-[270px] sm:w-[320px] sm:h-[320px] md:w-[360px] md:h-[360px] block relative z-10"
        />
      </div>
    </div>
  );
}
