'use client'

import { useState, useEffect } from 'react'
import AdminLogin from '@/components/AdminLogin'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    const check = document.cookie.includes('admin_token=authenticated')
    setAuthenticated(check)
    setChecking(false)
  }, [])

  const handleLogout = async () => {
    document.cookie = 'admin_token=; path=/; max-age=0'
    setAuthenticated(false)
  }

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#1A1A1A]" />
      </div>
    )
  }

  if (!authenticated) {
    return <AdminLogin />
  }

  const tabs = [
    { href: '/travel/admin', label: '旅行管理' },
    { href: '/albums/admin', label: '相册管理' },
    { href: '/movies/admin', label: '电影管理' },
    { href: '/games/admin', label: '游戏管理' },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-[#1A1A1A] shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
            返回首页
          </Link>
        </div>
        <button
          onClick={handleLogout}
          className="self-end sm:self-auto rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-400 transition-colors hover:text-red-500"
        >
          退出
        </button>
      </div>
      <div className="overflow-x-auto no-scrollbar -mx-6 px-6 sm:mx-0 sm:px-0">
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-max min-w-full sm:w-auto">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-lg px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                pathname === tab.href
                  ? 'bg-white text-[#1A1A1A] shadow-sm'
                  : 'text-gray-500 hover:text-[#1A1A1A]'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
      {children}
    </div>
  )
}
