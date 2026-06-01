'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronLeft, Clock, Calendar, ExternalLink, Star } from 'lucide-react'
import ImagePreview from '@/components/ImagePreview'
import type { Game } from '@/lib/types'
import { GAME_STATUS_MAP, GAME_STATUS_COLORS } from '@/lib/types'

const formatPlayTime = (hours: number | null) => {
  if (!hours || hours === 0) return null
  return `${hours}小时`
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return null
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
  })
}

const renderStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`h-5 w-5 ${
        i < rating ? 'fill-accent-500 text-accent-500' : 'text-gray-300'
      }`}
    />
  ))
}

export default function GameDetailPage() {
  const params = useParams()
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const res = await fetch(`/api/games?id=${params.id}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setGame(data)
      } catch (error) {
        console.error('Error fetching game:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchGame()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#1A1A1A]" />
      </div>
    )
  }

  if (!game) {
    return (
      <div className="py-24 text-center">
        <p className="text-gray-400">游戏未找到</p>
        <Link href="/games" className="mt-4 inline-flex items-center gap-2 text-[#1A1A1A] hover:underline">
          <ChevronLeft className="h-4 w-4" />
          返回游戏列表
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Link
        href="/games"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-[#1A1A1A]"
      >
        <ChevronLeft className="h-4 w-4" />
        返回游戏列表
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="aspect-[16/9] overflow-hidden rounded-xl bg-gray-100 shadow-sm ring-1 ring-black/5">
            {game.cover_url ? (
              <ImagePreview
                src={game.cover_url}
                alt={game.title}
                className="h-full w-full"
                aspectRatio="16/9"
                sizes="(max-width: 1024px) 100vw, 33vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-300 text-6xl">
                🎮
              </div>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {game.steam_url && (
              <a
                href={game.steam_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg bg-[#1A1A1A] px-4 py-2 text-sm font-medium text-white hover:opacity-80"
              >
                <ExternalLink className="h-4 w-4" />
                打开 Steam 商店
              </a>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold text-[#1A1A1A]">{game.title}</h1>
              <span
                className={`flex-shrink-0 rounded-full px-3 py-1 text-sm font-medium ${GAME_STATUS_COLORS[game.status]}`}
              >
                {GAME_STATUS_MAP[game.status]}
              </span>
            </div>

            {game.rating && (
              <div className="mt-3 flex items-center gap-2">
                {renderStars(game.rating)}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {game.platform && game.platform.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">平台</p>
                <p className="text-[#1A1A1A]">{game.platform.join(' · ')}</p>
              </div>
            )}

            {game.play_time && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  游玩时间
                </p>
                <p className="text-[#1A1A1A]">{formatPlayTime(game.play_time)}</p>
              </div>
            )}

            {game.started_at && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  开始游玩
                </p>
                <p className="text-[#1A1A1A]">{formatDate(game.started_at)}</p>
              </div>
            )}

            {game.completed_at && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  通关日期
                </p>
                <p className="text-[#1A1A1A]">{formatDate(game.completed_at)}</p>
              </div>
            )}
          </div>

          {game.categories && game.categories.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">分类标签</p>
              <div className="flex flex-wrap gap-1.5">
                {game.categories.map((cat) => (
                  <span
                    key={cat}
                    className="rounded-full bg-gray-100 px-2.5 py-1 text-sm text-gray-600"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {game.review && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">感想总结</p>
              <div className="rounded-xl bg-gray-50 p-4 text-[#1A1A1A] whitespace-pre-wrap">
                {game.review}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}