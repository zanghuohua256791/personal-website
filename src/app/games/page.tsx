'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Game } from '@/lib/types'
import { GAME_STATUS_MAP, GAME_STATUS_COLORS } from '@/lib/types'
import { Star, ExternalLink } from 'lucide-react'

const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'want_to_play', label: '想玩' },
  { value: 'playing', label: '在玩' },
  { value: 'completed', label: '已通关' },
  { value: 'dropped', label: '弃坑' },
]

const platformOptions = [
  { value: 'all', label: '全部平台' },
  { value: 'Steam', label: 'Steam' },
  { value: 'PS5', label: 'PS5' },
  { value: 'Switch', label: 'Switch' },
  { value: 'Xbox', label: 'Xbox' },
  { value: 'PC', label: 'PC' },
]

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')

  useEffect(() => {
    fetch('/api/games')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setGames(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = games.filter((g) => {
    if (statusFilter !== 'all' && g.status !== statusFilter) return false
    if (platformFilter !== 'all' && !g.platform?.includes(platformFilter)) return false
    return true
  })

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < rating ? 'fill-accent-400 text-accent-400' : 'text-gray-200'}`}
      />
    ))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold tracking-tight text-[#1A1A1A]">游戏</h1>
      <p className="text-lg text-gray-500">探索世界，体验人生</p>

      <div className="flex flex-wrap items-center gap-2 pt-4">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === opt.value
                ? 'bg-[#1A1A1A] text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <span className="mx-2 text-gray-200">|</span>
        {platformOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPlatformFilter(opt.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              platformFilter === opt.value
                ? 'bg-[#1A1A1A] text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#1A1A1A]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-gray-400">还没有游戏记录 🎮</p>
        </div>
      ) : (
        <div className="grid gap-6 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((game) => (
            <div
              key={game.id}
              className="group overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md"
            >
              <div className="aspect-[16/9] bg-gray-100 overflow-hidden relative">
                {game.cover_url ? (
                  <img
                    src={game.cover_url}
                    alt={game.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-300 text-3xl">
                    🎮
                  </div>
                )}
                <span className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-medium ${GAME_STATUS_COLORS[game.status]}`}>
                  {GAME_STATUS_MAP[game.status]}
                </span>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-[#1A1A1A] line-clamp-1">
                    {game.title}
                  </h3>
                  {game.steam_url && (
                    <Link
                      href={game.steam_url}
                      target="_blank"
                      className="flex-shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#1A1A1A]"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
                {game.platform && game.platform.length > 0 && (
                  <p className="text-xs text-gray-400">{game.platform.join(' · ')}</p>
                )}
                {game.rating && (
                  <div className="flex items-center gap-0.5">
                    {renderStars(game.rating)}
                  </div>
                )}
                {game.notes && (
                  <p className="text-xs text-gray-400 line-clamp-2">{game.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
