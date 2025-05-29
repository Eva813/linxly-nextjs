 'use client'
import { FaBars } from 'react-icons/fa'
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { useContext } from 'react';
import { SidebarContext } from '@/app/ClientRootProvider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { siteConfig } from "@/config/site"
import { MainNav } from "@/components/main-nav"
import { FaGithub } from "react-icons/fa"
import { ThemeToggle } from "@/components/theme-toggle"
import { useSession, signOut } from "next-auth/react"
import Image from "next/image"
import { FaUserAlt } from "react-icons/fa";
import { LuLogOut } from "react-icons/lu";

export function SiteHeader() {
  const { data: session, status } = useSession()
  const isLoggedIn = status === "authenticated"
  const router = useRouter()
  const { toggleSidebar } = useContext(SidebarContext);

  const handleLogout = async () => {
    await signOut({ redirect: false })
    
    // 通知 Chrome 擴充功能使用者已登出
    window.postMessage(
      {
        type: 'FROM_SITE_HEADER',
        action: 'USER_LOGGED_OUT',
        data: {
          status: 'loggedOut',
        },
      },
      window.location.origin
    )

    router.push("/login")
  }

  // 過濾需要登入的選項
  const filteredNav = siteConfig.mainNav.filter((item) => {
    if (["/prompts", "/workspace"].includes(item.href)) {
      return isLoggedIn // 僅在登入時顯示
    }
    return true // 其他選項始終顯示
  })

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-gray-200"
      style={{
        background: 'var(--header-bg)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)' // 為 Safari 瀏覽器添加支持
      }}
    >
      <div className="container flex h-16 items-center space-x-4 max-w-screen-2xl sm:justify-between sm:space-x-0">
        {/* 手機: 顯示開啟側欄按鈕 */}
        <button
          className="sm:hidden p-2 mr-4"
          onClick={toggleSidebar}
          aria-label="open sidebar"
        >
          <FaBars className="w-5 h-5" />
        </button>
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
            {status === "loading" ? (
            // 載入中顯示占位骨架
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse-strong" />
          ) : isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-full h-8 w-8 overflow-hidden border border-gray-500 focus:outline-none focus:ring-0">
                  <FaUserAlt />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <div className="px-4 py-2 text-sm text-gray-700 flex items-center space-x-2">
                    {session.user.image ? (
                      <Image
                      src={session.user.image}
                      alt="User Avatar"
                      width={32}
                      height={32}
                      className="rounded-full"
                      />
                    ) : (
                      <FaUserAlt className="w-4 h-4" />
                    )}
                    <p className="truncate">{session.user.email ?? "User"}</p>
                  </div>
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:bg-gray-100 px-4">
                      <LuLogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-10"
                >
                  Login
                </Link>
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-10"
                >
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