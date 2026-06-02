'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: '首页' },
  { href: '/travel', label: '旅行' },
  { href: '/albums', label: '相册' },
  { href: '/movies', label: '电影' },
  { href: '/games', label: '游戏' },
]

export default function Navbar() {
  const pathname = usePathname()
  const isAdmin = pathname.includes('/admin')

  if (isAdmin) return null

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav className="mx-auto max-w-content px-6 py-4">
        <div className="flex items-center justify-between rounded-2xl bg-white/70 backdrop-blur-xl px-6 py-3 shadow-sm ring-1 ring-black/5">
          <Link href="/" className="text-lg font-bold tracking-tight text-[#1A1A1A]">
            Home
          </Link>
          <div className="flex items-center gap-0 sm:gap-1 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-black/5 text-[#1A1A1A]'
                      : 'text-gray-500 hover:text-[#1A1A1A] hover:bg-black/5'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </header>
  )
}
