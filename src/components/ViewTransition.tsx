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
  const [isAnimating, setIsAnimating] = useState(false);
  const [showContent, setShowContent] = useState(true);
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'exit' | 'idle'>('idle');
  const prevChildrenRef = useRef<ReactNode>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    setAnimationPhase('exit');

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setShowContent(false);
      prevChildrenRef.current = children;

      timerRef.current = setTimeout(() => {
        setShowContent(true);
        setAnimationPhase('enter');

        timerRef.current = setTimeout(() => {
          setIsAnimating(false);
          setAnimationPhase('idle');
        }, duration);
      }, 50);
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [children, duration, isAnimating]);

  const getAnimationClass = (phase: 'enter' | 'exit' | 'idle') => {
    if (phase === 'idle') return '';
    const dir = phase === 'exit' ? 'exit' : 'enter';

    switch (transitionType) {
      case 'slide':
        return `slide-${dir} ${direction === 'right' ? 'reverse' : ''}`;
      case 'fade':
        return `fade-${dir}`;
      case 'scale':
        return `scale-${dir}`;
      case 'flip':
        return `flip-${dir}`;
      case 'glitch':
        return `glitch-${dir}`;
      default:
        return `slide-${dir}`;
    }
  };

  const cssEasing = getEasingCSS(easing);

  return (
    <div
      className={`view-transition ${getAnimationClass(animationPhase)}`}
      style={{
        '--transition-duration': `${duration}ms`,
        '--transition-easing': cssEasing,
      } as React.CSSProperties}
    >
      {showContent ? children : null}
    </div>
  );
};

export default ViewTransition;
