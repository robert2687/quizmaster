import React, { useEffect, useRef } from 'react';

const Confetti: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // FIX: useRef must be initialized. Changed to initialize with null and updated the type.
  const animationFrameId = useRef<number | null>(null);
  const particles = useRef<any[]>([]);

  // Colors matching the app's theme
  const colors = ["#8B5CF6", "#EC4899", "#EF4444", "#F59E0B", "#34D399"]; 

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    const createParticle = () => {
      return {
        x: Math.random() * w,
        y: Math.random() * -h * 0.5, // Start above the screen
        radius: Math.random() * 6 + 4, // Represents the size of the confetti piece
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: Math.random() * 6 - 3, // horizontal velocity
        vy: Math.random() * 5 + 3, // vertical velocity
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2,
      };
    };

    particles.current = Array.from({ length: 250 }, createParticle);

    const draw = () => {
      if (!ctx || !canvas) return;

      // A semi-transparent background creates a trailing effect
      ctx.fillStyle = 'rgba(15, 23, 42, 0.15)'; // slate-900 with alpha
      ctx.fillRect(0, 0, w, h);

      if (particles.current.length === 0) {
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
        }
        return; // Stop animation when no particles are left
      }
      
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        
        p.vy += 0.08; // gravity
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;

        // Remove particles that are off-screen
        if (p.y > h + 20) {
          particles.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x + p.radius, p.y + p.radius);
        ctx.rotate(p.angle);
        ctx.beginPath();
        ctx.fillStyle = p.color;
        // Draw rectangles for a more "confetti-like" feel
        ctx.fillRect(-p.radius, -p.radius / 2, p.radius * 2, p.radius);
        ctx.restore();
      }
      
      animationFrameId.current = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
        w = window.innerWidth;
        h = window.innerHeight;
        if(canvas) {
            canvas.width = w;
            canvas.height = h;
        }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
      aria-hidden="true"
    />
  );
};

export default Confetti;
