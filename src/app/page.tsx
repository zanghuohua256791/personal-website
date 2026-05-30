'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Game } from '@/lib/types'
import { GAME_STATUS_MAP, GAME_STATUS_COLORS } from '@/lib/types'
import { ChevronRight, Calendar } from 'lucide-react'
import ImagePreview from '@/components/ImagePreview'

function formatYearMonth(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
  })
}

export default function HomePage() {
  const [playingGames, setPlayingGames] = useState<Game[]>([])
  const [allGames, setAllGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/api/games')
      .then((res) => res.json())
      .then((data) => {
        const playing = data.filter((g: Game) => g.status === 'playing').slice(0, 3)
        setPlayingGames(playing)
        setAllGames(data)
      })
      .catch((err) => {
        console.error('Failed to fetch data:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const thisYearGames = allGames.filter((g) => {
    const year = new Date().getFullYear()
    if (g.started_at) {
      const startYear = new Date(g.started_at).getFullYear()
      if (startYear === year) return true
    }
    if (g.completed_at) {
      const completeYear = new Date(g.completed_at).getFullYear()
      if (completeYear === year) return true
    }
    return false
  })

  const gamesByMonth = new Map<string, Game[]>()
  const sortedMonths: string[] = []
  const monthSet = new Set<string>()

  for (const game of thisYearGames) {
    const dates: { date: string; label: string }[] = []
    if (game.started_at) dates.push({ date: game.started_at, label: '开始玩' })
    if (game.completed_at) dates.push({ date: game.completed_at, label: '通关' })
    
    for (const { date } of dates) {
      const monthKey = new Date(date).toISOString().slice(0, 7)
      if (!monthSet.has(monthKey)) {
        monthSet.add(monthKey)
        sortedMonths.push(monthKey)
      }
      
      if (!gamesByMonth.has(monthKey)) {
        gamesByMonth.set(monthKey, [])
      }
      
      const existing = gamesByMonth.get(monthKey)
      if (!existing?.some((g) => g.id === game.id)) {
        existing?.push(game)
      }
    }
  }

  sortedMonths.sort((a, b) => b.localeCompare(a))

  const getGameDisplayDate = (game: Game, month: string) => {
    if (game.completed_at && game.completed_at.startsWith(month)) {
      return { date: game.completed_at, label: '通关' }
    }
    if (game.started_at && game.started_at.startsWith(month)) {
      return { date: game.started_at, label: '开始玩' }
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#1A1A1A]" />
      </div>
    )
  }

  return (
    <div className="space-y-24">
      <section className="space-y-6">
        <div className="flex items-start gap-6">
          <div className="h-20 w-20 flex-shrink-0 rounded-full bg-gradient-to-br from-accent-300 to-accent-500 flex items-center justify-center text-white text-2xl font-bold shadow-sm">
            Me
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-[#1A1A1A] sm:text-5xl">
              你好，我是RoccoLiang
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-gray-500">
              热爱旅行、电影与游戏的开发者。这里记录了我的足迹、看过的故事和玩过的世界。
            </p>
            <div className="flex gap-4 pt-2">
              <Link
                href="https://github.com/zanghuohua256791"
                target="_blank"
                className="rounded-lg bg-[#1A1A1A] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80"
              >
                GitHub
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">
            正在游玩
          </h2>
          <Link
            href="/games"
            className="flex items-center gap-1 text-sm font-medium text-gray-400 transition-colors hover:text-[#1A1A1A]"
          >
            全部游戏 <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {playingGames.length === 0 ? (
          <p className="py-12 text-center text-gray-400">暂无正在游玩的游戏</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {playingGames.map((game) => (
              <Link
              key={game.id}
              href={`/games/${game.id}`}
              className="group overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md"
            >
                <div className="aspect-[16/9] bg-gray-100 overflow-hidden relative">
                  {game.cover_url ? (
                    <ImagePreview
                      src={game.cover_url}
                      alt={game.title}
                      className="h-full w-full"
                      aspectRatio="16/9"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      enablePreview={false}
                      hoverScale
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-300">
                      No Cover
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-[#1A1A1A] group-hover:text-accent-600 transition-colors">
                      {game.title}
                    </h3>
                    <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${GAME_STATUS_COLORS[game.status]}`}>
                      {GAME_STATUS_MAP[game.status]}
                    </span>
                  </div>
                  {game.platform && game.platform.length > 0 && (
                    <p className="mt-2 text-xs text-gray-400">
                      {game.platform.join(' · ')}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {thisYearGames.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">
              {new Date().getFullYear()} 游戏记录
            </h2>
          </div>

          <div className="space-y-8">
            {sortedMonths.map((month) => {
              const monthGames = gamesByMonth.get(month)
              if (!monthGames) return null
              
              return (
                <div key={month} className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#1A1A1A]">
                    {formatYearMonth(month + '-01')}
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {monthGames.map((game) => {
                      const displayDate = getGameDisplayDate(game, month)
                      return (
                        <Link
                          key={game.id}
                          href={`/games/${game.id}`}
                          className="group flex items-start gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md"
                        >
                          <div className="h-12 w-20 flex-shrink-0 rounded-lg bg-gray-100 overflow-hidden">
                            {game.cover_url ? (
                              <ImagePreview
                                src={game.cover_url}
                                alt={game.title}
                                className="h-full w-full"
                                aspectRatio="16/9"
                                sizes="80px"
                                enablePreview={false}
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-gray-300 text-xs">
                                No Cover
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <h4 className="font-medium text-[#1A1A1A] group-hover:text-accent-600 transition-colors truncate">
                              {game.title}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {displayDate?.label || '记录'}
                              </span>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${GAME_STATUS_COLORS[game.status]}`}>
                                {GAME_STATUS_MAP[game.status]}
                              </span>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section className="grid gap-6 sm:grid-cols-3">
        <Link
          href="/travel"
          className="group rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md"
        >
          <div className="mb-3 text-3xl">✈️</div>
          <h3 className="text-lg font-semibold text-[#1A1A1A]">旅行</h3>
          <p className="mt-1 text-sm text-gray-400">走过的路，看过的风景</p>
        </Link>
        <Link
          href="/movies"
          className="group rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md"
        >
          <div className="mb-3 text-3xl">🎬</div>
          <h3 className="text-lg font-semibold text-[#1A1A1A]">电影</h3>
          <p className="mt-1 text-sm text-gray-400">光影之间，故事流连</p>
        </Link>
        <Link
          href="/games"
          className="group rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md"
        >
          <div className="mb-3 text-3xl">🎮</div>
          <h3 className="text-lg font-semibold text-[#1A1A1A]">游戏</h3>
          <p className="mt-1 text-sm text-gray-400">探索世界，体验人生</p>
        </Link>
      </section>
    </div>
  )
}
