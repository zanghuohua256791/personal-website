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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-[#1A1A1A]"
          >
            <ChevronLeft className="h-4 w-4" />
            返回首页
          </Link>
          <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
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
        <button
          onClick={handleLogout}
          className="rounded-lg px-4 py-2 text-sm text-gray-400 transition-colors hover:text-red-500"
        >
          退出
        </button>
      </div>
      {children}
    </div>
  )
}
