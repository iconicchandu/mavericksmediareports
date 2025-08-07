import React, { useEffect, useState } from 'react';

interface CelebrationEffectProps {
  isActive: boolean;
  onComplete: () => void;
}

const CelebrationEffect: React.FC<CelebrationEffectProps> = ({ isActive, onComplete }) => {
  const [balloons, setBalloons] = useState<Array<{ id: number; x: number; delay: number; color: string }>>([]);
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; rotation: number; color: string; delay: number }>>([]);
  const [goldenStars, setGoldenStars] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number; duration: number }>>([]);
  const [leftPopperConfetti, setLeftPopperConfetti] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number; rotation: number; color: string; delay: number }>>([]);
  const [rightPopperConfetti, setRightPopperConfetti] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number; rotation: number; color: string; delay: number }>>([]);

  useEffect(() => {
    if (isActive) {
      // Generate balloons
      const newBalloons = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 2,
        color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'][Math.floor(Math.random() * 7)]
      }));

      // Generate confetti
      const newConfetti = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        rotation: Math.random() * 360,
        color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'][Math.floor(Math.random() * 8)],
        delay: Math.random() * 3
      }));

      // Generate golden stars
      const newGoldenStars = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 20 + 15, // 15-35px
        delay: Math.random() * 2,
        duration: Math.random() * 2 + 2 // 2-4 seconds
      }));

      // Generate left party popper confetti
      const newLeftPopperConfetti = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: 5, // Start from left bottom
        y: 90,
        vx: Math.random() * 60 + 20, // Velocity towards right
        vy: -(Math.random() * 80 + 40), // Velocity upwards
        rotation: Math.random() * 360,
        color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'][Math.floor(Math.random() * 8)],
        delay: Math.random() * 0.5
      }));

      // Generate right party popper confetti
      const newRightPopperConfetti = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: 95, // Start from right bottom
        y: 90,
        vx: -(Math.random() * 60 + 20), // Velocity towards left
        vy: -(Math.random() * 80 + 40), // Velocity upwards
        rotation: Math.random() * 360,
        color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'][Math.floor(Math.random() * 8)],
        delay: Math.random() * 0.5
      }));
      setBalloons(newBalloons);
      setConfetti(newConfetti);
      setGoldenStars(newGoldenStars);
      setLeftPopperConfetti(newLeftPopperConfetti);
      setRightPopperConfetti(newRightPopperConfetti);

      // Auto-complete after 4 seconds
      const timer = setTimeout(() => {
        onComplete();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {/* Celebration message */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 text-white px-8 py-4 rounded-2xl shadow-2xl animate-bounce text-2xl font-bold">
          🎉 Congratulations! MM team! 🎉
        </div>
      </div>

      {/* Golden Stars */}
      {goldenStars.map((star) => (
        <div
          key={`star-${star.id}`}
          className="absolute animate-golden-shine"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            fontSize: `${star.size}px`,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`
          }}
        >
          ⭐
        </div>
      ))}

      {/* Left Party Popper Confetti */}
      {leftPopperConfetti.map((piece) => (
        <div
          key={`left-popper-${piece.id}`}
          className="absolute animate-popper-explosion-left"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            '--vx': `${piece.vx}vw`,
            '--vy': `${piece.vy}vh`,
            animationDelay: `${piece.delay}s`,
            animationDuration: '3s'
          } as React.CSSProperties}
        >
          <div
            className="w-4 h-4 rounded-sm shadow-lg"
            style={{
              backgroundColor: piece.color,
              transform: `rotate(${piece.rotation}deg)`
            }}
          ></div>
        </div>
      ))}

      {/* Right Party Popper Confetti */}
      {rightPopperConfetti.map((piece) => (
        <div
          key={`right-popper-${piece.id}`}
          className="absolute animate-popper-explosion-right"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            '--vx': `${piece.vx}vw`,
            '--vy': `${piece.vy}vh`,
            animationDelay: `${piece.delay}s`,
            animationDuration: '3s'
          } as React.CSSProperties}
        >
          <div
            className="w-4 h-4 rounded-sm shadow-lg"
            style={{
              backgroundColor: piece.color,
              transform: `rotate(${piece.rotation}deg)`
            }}
          ></div>
        </div>
      ))}
      {/* Balloons */}
      {balloons.map((balloon) => (
        <div
          key={balloon.id}
          className="absolute bottom-0 animate-float-up"
          style={{
            left: `${balloon.x}%`,
            animationDelay: `${balloon.delay}s`,
            animationDuration: '4s'
          }}
        >
          <div
            className="w-8 h-10 rounded-full shadow-lg relative"
            style={{ backgroundColor: balloon.color }}
          >
            {/* Balloon string */}
            <div className="absolute top-full left-1/2 w-px h-16 bg-gray-400 transform -translate-x-1/2"></div>
            {/* Balloon highlight */}
            <div className="absolute top-2 left-2 w-2 h-2 bg-white rounded-full opacity-60"></div>
          </div>
        </div>
      ))}

      {/* Confetti */}
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: '3s'
          }}
        >
          <div
            className="w-3 h-3 rounded-sm"
            style={{
              backgroundColor: piece.color,
              transform: `rotate(${piece.rotation}deg)`
            }}
          ></div>
        </div>
      ))}

      {/* Sparkle effects */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-sparkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`
            }}
          >
            ✨
          </div>
        ))}
      </div>
    </div>
  );
};

export default CelebrationEffect;