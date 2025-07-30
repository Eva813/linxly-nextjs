import Link from "next/link";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { Mail } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Brand Section */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              PromptBear
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Professional prompt management platform for AI workflows.
            </p>
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                © {currentYear} PromptBear. All rights reserved.
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider">
              Product
            </h4>
            <div className="flex flex-wrap gap-4 mb-4">
              <Link
                href="/prompts"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 text-sm transition-colors"
              >
                Prompt Management
              </Link>
              <Link
                href="/workspace"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 text-sm transition-colors"
              >
                Flow
              </Link>
            </div>
            <div className="flex space-x-4">
              <Link
                href="https://github.com/yourusername/promptbear"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitHubLogoIcon className="w-5 h-5" />
              </Link>
              <Link
                href="mailto:contact@promptbear.com"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                <Mail className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}