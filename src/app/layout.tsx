import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: '个人主页',
    template: '%s | 个人主页',
  },
  description: '我的个人主页 - 记录旅行、电影与游戏',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-content px-6 pt-28 pb-16">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
