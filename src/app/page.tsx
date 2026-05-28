import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import type { Game, GameSession } from '@/lib/types'
import { GAME_STATUS_MAP, GAME_STATUS_COLORS } from '@/lib/types'
import { Clock, MapPin, ChevronRight } from 'lucide-react'
import ImagePreview from '@/components/ImagePreview'

export const revalidate = 3600

async function getPlayingGames(): Promise<Game[]> {
  const { data } = await supabase
    .from('games')
    .select('*')
    .eq('status', 'playing')
    .order('updated_at', { ascending: false })
    .limit(3)
  return (data as Game[]) || []
}

async function getRecentSessions(): Promise<GameSession[]> {
  const { data } = await supabase
    .from('game_sessions')
    .select('*, game:games(*)')
    .order('started_at', { ascending: false })
    .limit(10)
  return (data as GameSession[]) || []
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function HomePage() {
  const [playingGames, sessions] = await Promise.all([
    getPlayingGames(),
    getRecentSessions(),
  ])

  return (
    <div className="space-y-24">
      {/* 个人简介 */}
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

      {/* 正在游玩 */}
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
                href={game.steam_url || '#'}
                target={game.steam_url ? '_blank' : undefined}
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
                  {game.platform.length > 0 && (
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

      {/* 最近游玩时间轴 */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">
          最近游玩
        </h2>

        {sessions.length === 0 ? (
          <p className="py-12 text-center text-gray-400">暂无游玩记录</p>
        ) : (
          <div className="relative border-l-2 border-gray-100">
            {sessions.map((session) => (
              <div key={session.id} className="relative pb-8 pl-8 last:pb-0">
                <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-accent-400" />
                <div className="space-y-1">
                  <h3 className="font-semibold text-[#1A1A1A]">
                    {session.game?.title || '未知游戏'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(session.started_at)}
                    </span>
                    {session.game?.platform && session.game.platform.length > 0 && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {session.game.platform.join(' · ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 入口导航卡片 */}
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
