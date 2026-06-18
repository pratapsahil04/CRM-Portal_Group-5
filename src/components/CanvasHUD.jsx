import React, { useEffect, useRef, useState } from 'react';

export default function CanvasHUD({ width = 300, height = 300 }) {
  const canvasRef = useRef(null);
  const [speed, setSpeed] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let targetSpeed = 0;
    let currentSpeed = 0;
    let rpm = 0;
    let angle = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      const r = Math.min(width, height) * 0.4;

      // Simulate vehicle speed fluctuation
      if (Math.random() > 0.98) {
        targetSpeed = Math.floor(Math.random() * 80) + 40; // 40 - 120 mph
      }
      currentSpeed += (targetSpeed - currentSpeed) * 0.05;
      rpm = (currentSpeed * 60) + Math.sin(Date.now() / 200) * 150;
      angle += 0.01; // Sweep speed for radar lines

      // Draw dashboard concentric dials
      ctx.strokeStyle = 'rgba(104, 202, 169, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(181, 115, 81, 0.06)';
      ctx.beginPath();
      ctx.arc(cx, cy, r + 20, 0, Math.PI * 2);
      ctx.stroke();

      // Outer dashed compass circle
      ctx.strokeStyle = 'rgba(104, 202, 169, 0.15)';
      ctx.setLineDash([3, 15]);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // Draw RPM meter arc (starts at 3/4 PI, ends at 9/4 PI)
      const startAngle = Math.PI * 0.8;
      const endAngle = Math.PI * 2.2;
      const maxRpm = 8000;
      const currentRpmAngle = startAngle + (endAngle - startAngle) * Math.min(1, rpm / maxRpm);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, r - 10, startAngle, endAngle);
      ctx.stroke();

      // Filled RPM path
      ctx.strokeStyle = currentSpeed > 100 ? '#b57351' : '#68caa9';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, r - 10, startAngle, currentRpmAngle);
      ctx.stroke();

      // Draw Speedometer Digital Readout
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.round(currentSpeed).toString(), cx, cy - 10);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '10px monospace';
      ctx.fillText('MPH', cx, cy + 15);

      ctx.fillStyle = '#68caa9';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('GEAR: D' + (Math.floor(currentSpeed / 25) + 1), cx, cy + 30);

      // Radar rotating line
      ctx.strokeStyle = 'rgba(104, 202, 169, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      ctx.stroke();

      // Decorative outer tick marks
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 12; i++) {
        const theta = (i * Math.PI) / 6;
        const x1 = cx + Math.cos(theta) * (r + 5);
        const y1 = cy + Math.sin(theta) * (r + 5);
        const x2 = cx + Math.cos(theta) * (r + 12);
        const y2 = cy + Math.sin(theta) * (r + 12);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [width, height]);

  return (
    <div className="relative flex items-center justify-center pointer-events-none select-none">
      <canvas ref={canvasRef} width={width} height={height} className="relative z-10" />
      {/* Background neon soft blur glow */}
      <div className="absolute w-48 h-48 rounded-full bg-[#68caa9]/5 filter blur-3xl z-0 pointer-events-none"></div>
    </div>
  );
}
