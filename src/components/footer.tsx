import Link from "next/link";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { Mail } from "lucide-react";

const FOOTER_CONFIG = {
  brand: {
    name: "PromptBear",
    description: "Professional prompt management platform for AI workflows.",
  },
  productLinks: [
    { href: "/prompts", label: "Prompt Management" },
    { href: "/board", label: "Flow Editor" },
    { href: "/workspace", label: "Workspace" },
  ],
  socialLinks: [
    {
      href: "https://github.com/Eva813",
      icon: GitHubLogoIcon,
      label: "GitHub",
      external: true,
    },
    {
      href: "mailto:contact@promptbear.com",
      icon: Mail,
      label: "Email",
      external: false,
    },
  ],
} as const;

// 品牌區塊組件
function BrandSection() {
  const currentYear = new Date().getFullYear();
  
  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
        {FOOTER_CONFIG.brand.name}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
        {FOOTER_CONFIG.brand.description}
      </p>
      <div className="text-gray-600 dark:text-gray-400 text-sm">
        © {currentYear} {FOOTER_CONFIG.brand.name}. All rights reserved.
      </div>
    </div>
  );
}

// 產品連結組件
function ProductLinks() {
  return (
    <div className="mb-6">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider">
        Product
      </h4>
      <div className="flex flex-wrap gap-4">
        {FOOTER_CONFIG.productLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 text-sm transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

// 社交連結組件
function SocialLinks() {
  return (
    <div className="flex space-x-4">
      {FOOTER_CONFIG.socialLinks.map((link) => {
        const IconComponent = link.icon;
        const linkProps = link.external
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {};

        return (
          <Link
            key={link.href}
            href={link.href}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            aria-label={link.label}
            {...linkProps}
          >
            <IconComponent className="w-5 h-5" />
          </Link>
        );
      })}
    </div>
  );
}


// 主 Footer 組件
export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <BrandSection />
          <div>
            <ProductLinks />
            <SocialLinks />
          </div>
        </div>
      </div>
    </footer>
  );
}