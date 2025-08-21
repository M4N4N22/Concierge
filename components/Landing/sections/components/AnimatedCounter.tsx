"use client";

import { useEffect, useState } from 'react';

interface AnimatedCounterProps {
  value: string;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

export const AnimatedCounter = ({ 
  value, 
  suffix = '', 
  prefix = '', 
  duration = 2000,
  className = '' 
}: AnimatedCounterProps) => {
  const [displayValue, setDisplayValue] = useState('0');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    const currentElement = document.getElementById(`counter-${value}`);
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [value]);

  useEffect(() => {
    if (!isVisible) return;

    // Extract numeric value from string
    const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (isNaN(numericValue)) {
      setDisplayValue(value);
      return;
    }

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = numericValue * easeOut;
      
      // Format the number based on original format
      if (value.includes('B')) {
        setDisplayValue(currentValue.toFixed(1) + 'B');
      } else if (value.includes('K')) {
        setDisplayValue(currentValue.toFixed(0) + 'K');
      } else if (value.includes('%')) {
        setDisplayValue(currentValue.toFixed(0) + '%');
      } else {
        setDisplayValue(currentValue.toFixed(0));
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, value, duration]);

  return (
    <span 
      id={`counter-${value}`}
      className={`counter-text ${className}`}
    >
      {prefix}{displayValue}{suffix}
    </span>
  );
};