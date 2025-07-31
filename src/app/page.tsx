"use client";

import Link from "next/link";
import { useRef, useCallback } from "react";
import PuzzleIcon from "@/components/icons/PuzzleIcon";
import ManWithPuzzleIcon from "@/components/icons/ManWithPuzzleIcon";
import HomeFeaturesSection from "@/components/homeFeaturesSection";
import CTASection from "@/components/ctaSection";
import Footer from "@/components/footer";
import { 
  PenTool, 
  Gem,
  Zap, 
  Settings,
  Keyboard,
  Workflow,
  ChevronDown
} from "lucide-react";

const features = [
  {
    icon: PenTool,
    title: "Smart Organization",
    description: "Organize prompts with tags, categories, and collections. Find any prompt in seconds with powerful search."
  },
  {
    icon: Gem,
    title: "Team Collaboration",
    description: "Share prompt spaces with team members, supporting invitation links and permission management. Make team collaboration smoother and knowledge sharing easier."
  },
  {
    icon: Settings,
    title: "Parameterized Prompts",
    description: "Create dynamic prompts with custom fields. Supports dropdowns, text inputs, and various parameter types for more flexible and practical prompts."
  },
  {
    icon: Zap,
    title: "Instant Access",
    description: "Browser extension and API access. Use your prompts directly in your favorite AI tools with one click."
  },
  {
    icon: Keyboard,
    title: "Shortcut Support",
    description: "Set shortcuts for frequently used prompts to speed up your workflow. Quickly access and invoke your most important prompts."
  },
  {
    icon: Workflow,
    title: "Visual Flow Editor",
    description: "Drag and drop to build prompt flowcharts, visually manage complex prompt logic. Supports multiple node types and file upload functionality."
  }
];

export default function Home() {
  const featuresRef = useRef<HTMLDivElement>(null);

  const scrollToFeatures = useCallback(() => {
    featuresRef.current?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }, []);

  return (
    <div>
      <section className="bg-white min-h-[calc(100vh-4rem-1px)] flex items-center relative dark:text-gray-100 dark:bg-gray-900 dark:bg-auth-dark-gradient">
        <div className="container mx-auto px-4 text-center flex flex-col md:flex-row items-center md:items-start">
          <div className="md:w-1/2 flex flex-col justify-center h-full">
            <span className="inline-block bg-gray-100 text-gray-800 text-sm font-medium px-3 py-1 rounded-full mb-4 max-w-max text-center mx-auto">
              Don&apos;t hesitate to try it out
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 dark:text-gray-100">
              Organize Your <span className="text-mask">Prompts</span> Like a Pro
            </h1>
            <div className="lines relative w-50 overflow-hidden">
              <div className="animatedLine"></div>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <button className="bg-primary text-white font-semibold px-6 py-3 rounded-lg">
                <Link href="/prompts" className="text-lg font-medium hover:underline">
                  To Prompts Management
                </Link>
              </button>
            </div>
          </div>

          <div className="md:w-1/2 flex justify-center mt-8 md:mt-0 relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 100 100"
              width="200"
              height="200"
              style={{
                display: "block",
                transform: "translateX(70px)",
                marginTop: "-10px",
              }}
            >
              <circle cx="50" cy="50" r="50" fill="#BDCCED" />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 100 100"
              width="60"
              height="60"
              style={{
                display: "block",
                transform: "translateX(5px)",
                marginTop: "250px",
              }}
            >
              <circle cx="50" cy="50" r="50" fill="#98B1E4" />
            </svg>
            <ManWithPuzzleIcon width={380} height={380} aria-hidden="true" />
            <div className="hidden md:block absolute top-[-32px] right-[90px] hover:animate-swing-left" style={{ transform: 'rotate(-15deg)' }}>
              <PuzzleIcon />
            </div>
            <div className="hidden md:block absolute top-[-20px] right-[-10px] hover:animate-swing-right" style={{ transform: 'rotate(5deg)' }}>
              <PuzzleIcon />
            </div>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 100 100"
              width="120"
              height="120"
              style={{
                display: "block",
                transform: "translateX(5px)",
                marginTop: "200px",
              }}
            >
              <circle cx="50" cy="50" r="50" fill="#98B1E4" />
            </svg>
          </div>
        </div>
        
        {/* Scroll Down Arrow Button */}
        <button
          onClick={scrollToFeatures}
          className="absolute bottom-8 left-1/2 -ml-6 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 animate-slow-bounce"
          aria-label="Scroll to features section"
        >
          <ChevronDown className="w-6 h-6 text-primary dark:text-secondary" />
        </button>
      </section>

      <div ref={featuresRef}>
        <HomeFeaturesSection features={features} />
      </div>
      
      <CTASection />
      
      <Footer />
    </div>
  );
}
