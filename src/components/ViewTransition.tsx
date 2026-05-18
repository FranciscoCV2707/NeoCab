import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { getEasingCSS } from '../utils/easing';
import './ViewTransition.css';

interface ViewTransitionProps {
  children: ReactNode;
  transitionType?: 'slide' | 'fade' | 'scale' | 'flip' | 'glitch';
  duration?: number;
  easing?: string;
  direction?: 'left' | 'right' | 'up' | 'down';
}

export const ViewTransition: React.FC<ViewTransitionProps> = ({
  children,
  transitionType = 'slide',
  duration = 300,
  easing = 'easeOutCubic',
  direction = 'left',
}) => {
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'idle'>('enter');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setAnimationPhase('idle');
    }, duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getAnimationClass = () => {
    if (animationPhase === 'idle') return '';
    switch (transitionType) {
      case 'slide': return `slide-enter ${direction === 'right' ? 'reverse' : ''}`;
      case 'fade': return 'fade-enter';
      case 'scale': return 'scale-enter';
      case 'flip': return 'flip-enter';
      case 'glitch': return 'glitch-enter';
      default: return 'slide-enter';
    }
  };

  const cssEasing = getEasingCSS(easing);

  return (
    <div
      className={`view-transition ${getAnimationClass()}`}
      style={{
        '--transition-duration': `${duration}ms`,
        '--transition-easing': cssEasing,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

export default ViewTransition;
