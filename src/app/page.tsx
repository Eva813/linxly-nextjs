import ScrollToFeatures from "@/components/scrollToFeatures";
import HomeFeaturesSection from "@/components/homeFeaturesSection";
import CTASection from "@/components/ctaSection";
import Footer from "@/components/footer";
import { 
  PenTool, 
  Gem,
  Zap, 
  Settings,
  Keyboard,
  Workflow
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
  return (
    <div>
      <ScrollToFeatures>
        <HomeFeaturesSection features={features} />
      </ScrollToFeatures>
      
      <CTASection />
      
      <Footer />
    </div>
  );
}
