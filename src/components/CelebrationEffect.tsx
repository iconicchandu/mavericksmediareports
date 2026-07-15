import React, { useEffect, useState } from 'react';

interface CelebrationEffectProps {
  isActive: boolean;
  onComplete: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  color: string;
  side: 'left' | 'right';
  size: number;
  createdAt: number;
}

// ─── Typewriter Effect Component ─────────────────────────────────────────────
const TypewriterText: React.FC<{ text: string; speed?: number; delay?: number; onComplete?: () => void }> = ({
  text,
  speed = 70,
  delay = 0,
  onComplete
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let index = 0;
    let timerId: ReturnType<typeof setTimeout>;
    let intervalId: ReturnType<typeof setInterval>;

    timerId = setTimeout(() => {
      intervalId = setInterval(() => {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
        if (index >= text.length) {
          clearInterval(intervalId);
          setShowCursor(false);
          if (onComplete) onComplete();
        }
      }, speed);
    }, delay);

    return () => {
      clearTimeout(timerId);
      clearInterval(intervalId);
    };
  }, [text, speed, delay, onComplete]);

  return (
    <span className="relative inline-block">
      {displayedText}
      {showCursor && (
        <span
          className="animate-pulse border-r-4 border-indigo-600 ml-1 inline-block"
          style={{ height: '1em', verticalAlign: 'middle' }}
        />
      )}
    </span>
  );
};

// ─── Main Celebration Effect Component ────────────────────────────────────────
const CelebrationEffect: React.FC<CelebrationEffectProps> = ({ isActive, onComplete }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      return;
    }

    let particleId = 0;
    const colors = [
      '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1',
      '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF', '#FF4500'
    ];

    // Interval to spawn dense particles continuously (every 40ms)
    const spawnInterval = setInterval(() => {
      const leftCount = Math.floor(Math.random() * 8) + 8;  // 8 to 15 particles
      const rightCount = Math.floor(Math.random() * 8) + 8; // 8 to 15 particles
      const newParticles: Particle[] = [];
      const now = Date.now();

      // Left sprinkler (bottom-left corner)
      for (let i = 0; i < leftCount; i++) {
        newParticles.push({
          id: particleId++,
          x: 2,
          y: 95,
          vx: Math.random() * 55 + 20, // shoots rightwards (20 to 75 vw)
          vy: -(Math.random() * 80 + 50), // shoots upwards (-50 to -130 vh)
          rotation: Math.random() * 360,
          color: colors[Math.floor(Math.random() * colors.length)],
          side: 'left',
          size: Math.random() * 6 + 8, // 8px to 14px (solid, tiny sprinklers)
          createdAt: now,
        });
      }

      // Right sprinkler (bottom-right corner)
      for (let i = 0; i < rightCount; i++) {
        newParticles.push({
          id: particleId++,
          x: 98,
          y: 95,
          vx: -(Math.random() * 55 + 20), // shoots leftwards (-20 to -75 vw)
          vy: -(Math.random() * 80 + 50), // shoots upwards (-50 to -130 vh)
          rotation: Math.random() * 360,
          color: colors[Math.floor(Math.random() * colors.length)],
          side: 'right',
          size: Math.random() * 6 + 8, // 8px to 14px (solid, tiny sprinklers)
          createdAt: now,
        });
      }

      // Add new particles and prune old particles (animation lasts 3s)
      setParticles((prev) => {
        const active = prev.filter((p) => (now - p.createdAt) < 3000);
        return [...active, ...newParticles];
      });
    }, 40);

    // Auto-complete after 7 seconds of continuous spraying to allow reading
    const timer = setTimeout(() => {
      onComplete();
    }, 7000);

    return () => {
      clearInterval(spawnInterval);
      clearTimeout(timer);
    };
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden select-none">
      {/* Celebration message in the center of the screen */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-transparent z-40 pointer-events-none p-4">
        <div
          className="celebration-text-container select-none flex flex-col items-center justify-center p-8 md:p-12 rounded-3xl"
        >
          <div className="text-5xl md:text-6xl mb-4 animate-bounce">🎉🏆🎉</div>
          <h1 className="celebration-text">
            <TypewriterText text="Congratulations!" speed={65} delay={500} />
          </h1>
        </div>
      </div>

      {/* Sprinkler Particles */}
      {particles.map((piece) => (
        <div
          key={piece.id}
          className={piece.side === 'left' ? 'absolute animate-popper-explosion-left' : 'absolute animate-popper-explosion-right'}
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            '--vx': `${piece.vx}vw`,
            '--vy': `${piece.vy}vh`,
            animationDuration: '3s',
          } as React.CSSProperties}
        >
          <div
            style={{
              width: `${piece.size}px`,
              height: `${piece.size}px`,
              backgroundColor: piece.color,
              transform: `rotate(${piece.rotation}deg)`,
              borderRadius: Math.random() > 0.4 ? '50%' : '2px', // mix of solid confetti and circular sprinkler droplets
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)', // subtle flat shadow
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default CelebrationEffect;