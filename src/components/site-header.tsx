'use client'
import Link from "next/link"
import { useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { siteConfig } from "@/config/site"
import { MainNav } from "@/components/main-nav"
import { FaGithub } from "react-icons/fa"
import { ThemeToggle } from "@/components/theme-toggle"
import { useSession, signOut } from "next-auth/react"
import Image from "next/image"
import { FaUserAlt, FaBell } from "react-icons/fa";
import { LuLogOut } from "react-icons/lu";

export function SiteHeader() {
  const { data: session, status } = useSession()
  const isLoggedIn = status === "authenticated"
  const router = useRouter()
  const [invitations, setInvitations] = useState<{
    folderId: string;
    folderName: string;
    ownerEmail: string;
  }[]>([])
  // 讀取待接受的分享邀請
  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/v1/folders/invitations', {
        headers: { 'x-user-id': session.user.id }
      })
        .then(res => res.json())
        .then(data => setInvitations(data))
        .catch(console.error)
    }
  }, [session])

  const handleLogout = async () => {
    await signOut({ redirect: false })
    
    // 通知 Chrome 擴充功能使用者已登出
    window.postMessage(
      {
        type: 'FROM_SITE_HEADER', // 自訂訊息類型
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
    if (["/snippets", "/workspace"].includes(item.href)) {
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
        <MainNav items={filteredNav} />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            {/* 邀請通知 */}
            {isLoggedIn && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded hover:bg-gray-100 focus:outline-none">
                    <span className="sr-only">Notifications</span>
                    <div className="relative">
                      <FaBell className="w-5 h-5" />
                      {invitations.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                          {invitations.length}
                        </span>
                      )}
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <div className="p-2 text-sm font-medium">通知</div>
                  {invitations.length > 0 ? (
                    invitations.map((inv) => (
                      <div key={inv.folderId} className="p-2 border-b last:border-b-0">
                        <p className="truncate text-sm">
                          {inv.ownerEmail} 分享了資料夾 {inv.folderName}
                        </p>
                        <button
                          className="mt-1 text-xs text-blue-600 hover:underline"
                          onClick={async () => {
                            await fetch(`/api/v1/folders/${inv.folderId}/share/accept`, {
                              method: 'POST',
                              headers: { 'x-user-id': session.user.id }
                            })
                            // 重新整理 sidebar 與資料
                            router.refresh()
                            // 更新通知列表
                            setInvitations((prev) => {
                              const updated = prev.filter(i => i.folderId !== inv.folderId);
                              return updated;
                            })
                          }}
                        >
                          Accept 
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-xs text-gray-500">No new invitations</div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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