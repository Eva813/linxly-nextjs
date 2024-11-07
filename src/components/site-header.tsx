import Link from "next/link"

import { siteConfig } from "@/config/site"
// import { buttonVariants } from "@/components/ui/dialog"
// import { Icons } from "@/components/icons"
import { MainNav } from "@/components/main-nav"
import { cn } from '@/lib/utils';
import { FaGithub } from "react-icons/fa";
import { ThemeToggle } from "@/components/theme-toggle";
export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        background: 'var(--header-bg)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)' // 為 Safari 瀏覽器添加支持
      }}
    >
      {/* header content */}
      <div className="container flex h-16 items-center space-x-4 max-w-screen-2xl sm:justify-between sm:space-x-0">
        <MainNav items={siteConfig.mainNav} />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            <Link
              href={siteConfig.links.github}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-md p-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-10 w-10"
            >
              <div>
                <FaGithub className="w-5 h-5" />
                <span className="sr-only">GitHub</span>
              </div>
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
}
