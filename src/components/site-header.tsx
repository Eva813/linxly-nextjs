'use client'
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

import { siteConfig } from "@/config/site"
// import { buttonVariants } from "@/components/ui/dialog"
// import { Icons } from "@/components/icons"
import { MainNav } from "@/components/main-nav"
import { FaGithub } from "react-icons/fa";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSession, signOut } from "next-auth/react";

export function SiteHeader() {
  const {  data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const router = useRouter()

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("login");
  };

  // 過濾需要登入的選項
  const filteredNav = siteConfig.mainNav.filter((item) => {
    if (["/snippets", "/workspace"].includes(item.href)) {
      return isLoggedIn; // 僅在登入時顯示
    }
    return true; // 其他選項始終顯示
  });

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-gray-200"
      style={{
        background: 'var(--header-bg)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)' // 為 Safari 瀏覽器添加支持
      }}
    >
      {/* header content */}
      <div className="container flex h-16 items-center space-x-4 max-w-screen-2xl sm:justify-between sm:space-x-0">
        <MainNav items={filteredNav} />
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
            {isLoggedIn ? (
              <Button onClick={handleLogout} className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-10">
                Logout<p>Welcome, {session.user.email || "User"}</p>
              </Button>
            
            ) : (
              <>
                <Link href="/login" className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-10">
                  Login
                </Link>
                <Link href="/sign-up" className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-10">
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}