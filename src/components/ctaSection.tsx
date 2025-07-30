import Link from "next/link";
import { Check, Zap, Globe, LucideIcon } from "lucide-react";

// 類型定義
type ButtonVariant = 'primary' | 'secondary';

interface CTAHeading {
  title: string;
  subtitle: string;
}

interface CTAButton {
  href: string;
  label: string;
  variant: ButtonVariant;
  icon?: string;
}

interface CTABenefit {
  icon: LucideIcon;
  text: string;
  iconColor: string;
}

interface CTAConfig {
  heading: CTAHeading;
  buttons: CTAButton[];
  benefits: CTABenefit[];
}

// 配置數據
const CTA_CONFIG: CTAConfig = {
  heading: {
    title: "Ready to transform your AI workflow?",
    subtitle: "Join 10,000+ AI professionals who've revolutionized their prompt management with promptBear.",
  },
  buttons: [
    {
      href: "/prompts",
      label: "Start Free Trial",
      variant: "primary",
      icon: "→",
    },
    {
      href: "/sign-up", 
      label: "Sign up",
      variant: "secondary",
    },
  ],
  benefits: [
    {
      icon: Check,
      text: "Completely free",
      iconColor: "text-green-400 dark:text-green-300",
    },
    {
      icon: Zap,
      text: "Start instantly", 
      iconColor: "text-yellow-400 dark:text-yellow-300",
    },
    {
      icon: Globe,
      text: "Works anywhere",
      iconColor: "text-blue-300 dark:text-blue-200",
    },
  ],
};

// 標題區塊組件
function CTAHeading() {
  return (
    <div className="mb-12">
      <h2 className="text-4xl md:text-5xl font-bold text-white dark:text-gray-100 mb-6">
        {CTA_CONFIG.heading.title.split(' ').slice(0, 3).join(' ')}
        <br />
        {CTA_CONFIG.heading.title.split(' ').slice(3).join(' ')}
      </h2>
      <p className="text-xl text-blue-100 dark:text-gray-300 max-w-2xl mx-auto">
        {CTA_CONFIG.heading.subtitle}
      </p>
    </div>
  );
}

// 按鈕組件
function CTAButton({ href, label, variant, icon }: CTAButton) {
  const baseClasses = "font-semibold px-8 py-4 rounded-lg transition-colors duration-200 min-w-[200px] text-center";
  
  const variantClasses = {
    primary: "bg-white text-blue-700 dark:bg-gray-100 dark:text-blue-800 hover:bg-blue-50 dark:hover:bg-gray-200 inline-flex items-center gap-2 justify-center",
    secondary: "bg-transparent border-2 border-white dark:border-gray-300 text-white dark:text-gray-100 hover:bg-white/10 dark:hover:bg-gray-800/40",
  };

  return (
    <Link href={href} className={`${baseClasses} ${variantClasses[variant]}`}>
      {label}
      {icon && <span className="text-lg">{icon}</span>}
    </Link>
  );
}

// 按鈕區塊組件
function CTAButtons() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
      {CTA_CONFIG.buttons.map((button) => (
        <CTAButton
          key={button.href}
          href={button.href}
          label={button.label}
          variant={button.variant}
          icon={button.icon}
        />
      ))}
    </div>
  );
}

// 優勢項目組件
interface BenefitItemProps {
  icon: LucideIcon;
  text: string;
  iconColor: string;
}

function BenefitItem({ icon: Icon, text, iconColor }: BenefitItemProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-5 h-5 ${iconColor}`} />
      <span>{text}</span>
    </div>
  );
}

// 優勢區塊組件
function CTABenefits() {
  return (
    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-blue-100 dark:text-gray-300">
      {CTA_CONFIG.benefits.map((benefit, index) => (
        <BenefitItem
          key={index}
          icon={benefit.icon}
          text={benefit.text}
          iconColor={benefit.iconColor}
        />
      ))}
    </div>
  );
}

// 主 CTA 組件
export default function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 text-center">
        <CTAHeading />
        <CTAButtons />
        <CTABenefits />
      </div>
    </section>
  );
}