import React, { useEffect, useRef, useState } from 'react';
import './HyperSpinWheel.css';

export interface WheelItem {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

interface HyperSpinWheelProps {
  items: WheelItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onConfirm: (item: WheelItem) => void;
  onRotate?: (angle: number) => void;
  radius?: number;
  itemSize?: number;
  rotationSpeed?: number; // ms per rotation
  showLabels?: boolean;
  animated?: boolean;
}

/**
 * HyperSpin-style wheel component for arcade cabinet UI
 * Features:
 * - Smooth rotation animation
 * - Keyboard/gamepad navigation
 * - Visual selection highlight
 * - Customizable colors and sizing
 */
export const HyperSpinWheel: React.FC<HyperSpinWheelProps> = ({
  items,
  selectedIndex,
  onSelect,
  onConfirm,
  onRotate,
  radius = 150,
  itemSize = 40,
  rotationSpeed = 300,
  showLabels = true,
  animated = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number | null>(null);

  const itemAngle = items.length > 0 ? 360 / items.length : 0;

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          selectPrevious();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          selectNext();
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          confirmSelection();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedIndex, items]);

  const selectNext = () => {
    const nextIndex = (selectedIndex + 1) % items.length;
    onSelect(nextIndex);
    rotateWheel(nextIndex);
  };

  const selectPrevious = () => {
    const prevIndex = (selectedIndex - 1 + items.length) % items.length;
    onSelect(prevIndex);
    rotateWheel(prevIndex);
  };

  const confirmSelection = () => {
    if (items[selectedIndex]) {
      onConfirm(items[selectedIndex]);
    }
  };

  const rotateWheel = (index: number) => {
    if (!animated) return;

    setIsAnimating(true);
    const targetRotation = -(index * itemAngle);
    const diff = targetRotation - rotation;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / rotationSpeed, 1);

      // Easing function: easeOutCubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const newRotation = rotation + diff * easeProgress;

      setRotation(newRotation);
      onRotate?.(newRotation);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  // Render wheel on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const centerX = w / 2;
    const centerY = h / 2;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    // Draw wheel items
    if (items.length > 0) {
      items.forEach((item, index) => {
        const angle = (index * itemAngle + rotation) * (Math.PI / 180);
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        // Draw item circle
        const isSelected = index === selectedIndex;
        ctx.fillStyle = isSelected ? '#FF6400' : '#404040'; // Arcade orange vs cabinet gray
        ctx.beginPath();
        ctx.arc(x, y, isSelected ? itemSize : itemSize - 5, 0, Math.PI * 2);
        ctx.fill();

        // Draw border
        ctx.strokeStyle = isSelected ? '#FFFF00' : '#808080'; // Yellow border for selected
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();

        // Draw label
        if (showLabels) {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.name.substring(0, 8), x, y);
        }
      });
    }

    // Draw center indicator
    ctx.fillStyle = '#FFFF00'; // Arcade yellow
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [rotation, selectedIndex, items, radius, itemSize, itemAngle, showLabels]);

  return (
    <div className="hyperspin-wheel-container">
      <canvas
        ref={canvasRef}
        width={600}
        height={600}
        className="hyperspin-canvas"
      />
      <div className="wheel-info">
        {items[selectedIndex] && (
          <>
            <h2 className="wheel-title">{items[selectedIndex].name}</h2>
            <div className="wheel-stats">
              <span>{selectedIndex + 1} / {items.length}</span>
            </div>
          </>
        )}
        <div className="wheel-controls">
          <p className="control-hint">← → Navigate | ENTER Confirm</p>
        </div>
      </div>
    </div>
  );
};

export default HyperSpinWheel;
