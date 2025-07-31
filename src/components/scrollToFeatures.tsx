"use client";

import { useRef, useCallback } from "react";
import HeroSection from "./heroSection";

interface ScrollToFeaturesProps {
  children: React.ReactNode;
}

export default function ScrollToFeatures({ children }: ScrollToFeaturesProps) {
  const featuresRef = useRef<HTMLDivElement>(null);

  const scrollToFeatures = useCallback(() => {
    if (featuresRef.current) {
      const elementTop = featuresRef.current.offsetTop;
      const offset = 60;
      window.scrollTo({
        top: elementTop - offset,
        behavior: 'smooth'
      });
    }
  }, []);

  return (
    <div>
      <HeroSection onScrollToFeatures={scrollToFeatures} />
      <div ref={featuresRef}>
        {children}
      </div>
    </div>
  );
}