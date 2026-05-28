'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import AdminLayout from '@/components/AdminLayout'
import ImageUpload from '@/components/ImageUpload'
import type { Game, GameSession } from '@/lib/types'
import { GAME_STATUS_MAP, GAME_STATUS_COLORS } from '@/lib/types'
import { Plus, Edit, Trash2, X, Star, Clock, Play, Sparkles } from 'lucide-react'
import { fetchSteamCover } from '@/lib/steam'
import type { SteamSearchResult, SteamAppDetails } from '@/lib/steam'

const emptyGameForm = {
  title: '',
  cover_url: '',
  platform: '',
  status: 'want_to_play',
  rating: '0',
  steam_url: '',
  categories: [] as string[],
  review: '',
  play_time: '',
}

const emptySessionForm = {
  game_id: '',
  started_at: '',
  ended_at: '',
}

const platformOptions = ['Steam', 'XBox', 'Epic', 'PlayStation', 'Switch']
const KNOWN_CATEGORIES = ['动作', '冒险', '角色扮演', '策略', '模拟', '体育', '竞速', '格斗', '射击', '休闲', '独立', '大型多人在线']

export default function GameAdminPage() {
  const [games, setGames] = useState<Game[]>([])
  const [sessions, setSessions] = useState<GameSession[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Game | null>(null)
  const [form, setForm] = useState(emptyGameForm)
  const [showForm, setShowForm] = useState(false)
  const [showSessions, setShowSessions] = useState(false)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [sessionForm, setSessionForm] = useState(emptySessionForm)
  const [editingSession, setEditingSession] = useState<GameSession | null>(null)
  const [fetchingCover, setFetchingCover] = useState(false)

  const [searchResults, setSearchResults] = useState<SteamSearchResult[]>([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [searching, setSearching] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const handleSearchInput = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, title: value }))
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    if (!value.trim()) {
      setSearchResults([])
      setShowSearchDropdown(false)
      return
    }
    setSearching(true)
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/steam/search?q=${encodeURIComponent(value)}`)
        const data = await res.json()
        setSearchResults(data.items || [])
        setShowSearchDropdown(data.items?.length > 0)
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 400)
  }, [])

  const handleSelectGame = useCallback(async (item: SteamSearchResult) => {
    setShowSearchDropdown(false)
    setSearchResults([])
    setForm((prev) => ({ ...prev, title: item.name, steam_url: `https://store.steampowered.com/app/${item.appid}` }))

    setFetchingCover(true)
    try {
      const [coverUrl, detailsRes] = await Promise.all([
        fetchSteamCover(`https://store.steampowered.com/app/${item.appid}`),
        fetch(`/api/steam/details?appid=${item.appid}`),
      ])
      let categories: string[] = []
      if (detailsRes.ok) {
        const details: SteamAppDetails = await detailsRes.json()
        categories = details.genres.map((g) => g.description)
      }
      setForm((prev) => ({
        ...prev,
        cover_url: coverUrl || prev.cover_url,
        categories,
      }))
    } catch {
    } finally {
      setFetchingCover(false)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleFetchCover = async () => {
    if (!form.steam_url || fetchingCover) return
    setFetchingCover(true)
    try {
      const coverUrl = await fetchSteamCover(form.steam_url)
      if (coverUrl) {
        setForm({ ...form, cover_url: coverUrl })
      } else {
        alert('未能获取到封面图片，请手动上传')
      }
    } catch {
      alert('获取封面失败，请手动上传')
    } finally {
      setFetchingCover(false)
    }
  }

  const toggleCategory = (cat: string) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }))
  }

  const fetchGames = async () => {
    const res = await fetch('/api/admin/games')
    const data = await res.json()
    if (Array.isArray(data)) setGames(data)
    setLoading(false)
  }

  const fetchSessions = async (gameId?: string) => {
    const url = gameId
      ? `/api/admin/sessions?game_id=${gameId}`
      : '/api/admin/sessions'
    const res = await fetch(url)
    const data = await res.json()
    if (Array.isArray(data)) setSessions(data)
  }

  useEffect(() => {
    fetchGames()
  }, [])

  const handleGameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body: Record<string, unknown> = {
      title: form.title,
      cover_url: form.cover_url || null,
      platform: form.platform ? [form.platform] : [],
      status: form.status,
      rating: parseInt(form.rating) || null,
      steam_url: form.steam_url || null,
      categories: form.categories,
      review: form.review || null,
      play_time: parseInt(form.play_time) || 0,
    }

    const url = '/api/admin/games'
    const method = editing ? 'PUT' : 'POST'
    if (editing) body.id = editing.id

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      setForm(emptyGameForm)
      setEditing(null)
      setShowForm(false)
      fetchGames()
    }
  }

  const handleEdit = (game: Game) => {
    setEditing(game)
    setForm({
      title: game.title,
      cover_url: game.cover_url || '',
      platform: game.platform?.[0] || '',
      status: game.status,
      rating: game.rating?.toString() || '0',
      steam_url: game.steam_url || '',
      categories: game.categories || [],
      review: game.review || '',
      play_time: game.play_time?.toString() || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除吗？')) return
    await fetch('/api/admin/games', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchGames()
  }

  const handleSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body: Record<string, unknown> = {
      game_id: sessionForm.game_id,
      started_at: sessionForm.started_at ? new Date(sessionForm.started_at).toISOString() : new Date().toISOString(),
      ended_at: sessionForm.ended_at ? new Date(sessionForm.ended_at).toISOString() : null,
    }

    const url = '/api/admin/sessions'
    const method = editingSession ? 'PUT' : 'POST'
    if (editingSession) body.id = editingSession.id

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      setSessionForm(emptySessionForm)
      setEditingSession(null)
      if (selectedGame) fetchSessions(selectedGame.id)
    }
  }

  const handleSessionDelete = async (id: string) => {
    if (!confirm('确定要删除吗？')) return
    await fetch('/api/admin/sessions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (selectedGame) fetchSessions(selectedGame.id)
  }

  const openSessions = (game: Game) => {
    setSelectedGame(game)
    setSessionForm({ ...emptySessionForm, game_id: game.id })
    setEditingSession(null)
    fetchSessions(game.id)
    setShowSessions(true)
  }

  const formatPlayTime = (hours: number) => {
    if (!hours || hours === 0) return '-'
    return `${hours}h`
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">游戏管理</h1>
        <button
          onClick={() => { setEditing(null); setForm(emptyGameForm); setShowForm(true) }}
          className="flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80"
        >
          <Plus className="h-4 w-4" />
          新增游戏
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{editing ? '编辑游戏' : '新增游戏'}</h2>
            <button onClick={() => { setShowForm(false); setEditing(null) }} className="text-gray-400 hover:text-[#1A1A1A]">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleGameSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 relative" ref={searchRef}>
                <label className="text-sm font-medium text-gray-600">游戏名称</label>
                <div className="relative">
                  <input
                    value={form.title}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-8 text-sm outline-none focus:border-[#1A1A1A]"
                    required
                    placeholder="输入游戏名称搜索 Steam..."
                  />
                  {searching && (
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#1A1A1A]" />
                    </div>
                  )}
                </div>
                {showSearchDropdown && searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {searchResults.map((item) => (
                      <button
                        key={item.appid}
                        type="button"
                        onClick={() => handleSelectGame(item)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-50"
                      >
                        {item.logo && (
                          <img src={item.logo} alt="" className="h-10 w-10 flex-shrink-0 rounded object-cover" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-[#1A1A1A]">{item.name}</p>
                          <p className="text-xs text-gray-400">App ID: {item.appid}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-600">平台</label>
                <select
                  value={form.platform}
                  onChange={(e) => setForm({ ...form, platform: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]"
                >
                  <option value="">请选择平台</option>
                  {platformOptions.map((platform) => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-600">状态</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]">
                  {Object.entries(GAME_STATUS_MAP).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-600">评分 (1-5)</label>
                <select value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]">
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n === 0 ? '未评分' : '⭐'.repeat(n)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-600">游玩时间（小时）</label>
                <input
                  type="number"
                  value={form.play_time}
                  onChange={(e) => setForm({ ...form, play_time: e.target.value })}
                  placeholder="5"
                  min="0"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-gray-600">Steam 链接</label>
                <div className="flex gap-2">
                  <input value={form.steam_url} onChange={(e) => setForm({ ...form, steam_url: e.target.value })} placeholder="https://store.steampowered.com/app/..." className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]" />
                  <button
                    type="button"
                    onClick={handleFetchCover}
                    disabled={fetchingCover || !form.steam_url}
                    className="flex items-center gap-1.5 rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    {fetchingCover ? '获取中...' : '获取封面'}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">封面图片</label>
              <ImageUpload bucket="game-covers" onUpload={(url) => setForm({ ...form, cover_url: url })} preview={form.cover_url} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">分类标签</label>
              <div className="flex flex-wrap gap-2">
                {KNOWN_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      form.categories.includes(cat)
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {form.categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {form.categories.map((cat) => (
                    <span key={cat} className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2.5 py-0.5 text-xs font-medium text-accent-700">
                      {cat}
                      <button type="button" onClick={() => toggleCategory(cat)} className="text-accent-400 hover:text-accent-600">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">感想总结</label>
              <textarea value={form.review} onChange={(e) => setForm({ ...form, review: e.target.value })} rows={4} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]" placeholder="写下对这款游戏的感想..." />
            </div>

            <button type="submit" className="rounded-lg bg-[#1A1A1A] px-6 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80">
              {editing ? '保存修改' : '创建游戏'}
            </button>
          </form>
        </div>
      )}

      {showSessions && selectedGame && (
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {selectedGame.title} - 游玩记录
            </h2>
            <button onClick={() => setShowSessions(false)} className="text-gray-400 hover:text-[#1A1A1A]">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSessionSubmit} className="mb-6 grid gap-3 sm:grid-cols-3 items-end rounded-lg bg-gray-50 p-4">
            <input type="hidden" value={sessionForm.game_id} />
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">开始时间</label>
              <input type="datetime-local" value={sessionForm.started_at} onChange={(e) => setSessionForm({ ...sessionForm, started_at: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-[#1A1A1A]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">结束时间</label>
              <input type="datetime-local" value={sessionForm.ended_at} onChange={(e) => setSessionForm({ ...sessionForm, ended_at: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-[#1A1A1A]" />
            </div>
            <button type="submit" className="rounded-lg bg-[#1A1A1A] px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-80">
              {editingSession ? '更新' : '添加记录'}
            </button>
          </form>

          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-2">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <Clock className="h-4 w-4 text-gray-300" />
                  <span>{new Date(s.started_at).toLocaleString('zh-CN')}</span>
                  <span className="text-gray-300">→</span>
                  <span>{s.ended_at ? new Date(s.ended_at).toLocaleString('zh-CN') : '进行中'}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingSession(s)
                      setSessionForm({
                        game_id: s.game_id,
                        started_at: s.started_at.slice(0, 16),
                        ended_at: s.ended_at ? s.ended_at.slice(0, 16) : '',
                      })
                    }}
                    className="rounded-lg p-1 text-gray-400 hover:text-[#1A1A1A]"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleSessionDelete(s.id)} className="rounded-lg p-1 text-gray-400 hover:text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-400">暂无游玩记录</p>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#1A1A1A]" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-6 py-3 font-medium text-gray-500">游戏</th>
                <th className="px-6 py-3 font-medium text-gray-500">平台</th>
                <th className="px-6 py-3 font-medium text-gray-500">分类</th>
                <th className="px-6 py-3 font-medium text-gray-500">状态</th>
                <th className="px-6 py-3 font-medium text-gray-500">评分</th>
                <th className="px-6 py-3 font-medium text-gray-500">游玩时间</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {games.map((game) => (
                <tr key={game.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-[#1A1A1A]">{game.title}</td>
                  <td className="px-6 py-3 text-gray-500">{game.platform?.join(', ') || '-'}</td>
                  <td className="px-6 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(game.categories || []).slice(0, 3).map((cat) => (
                        <span key={cat} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                          {cat}
                        </span>
                      ))}
                      {(game.categories || []).length > 3 && (
                        <span className="text-xs text-gray-400">+{game.categories.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${GAME_STATUS_COLORS[game.status]}`}>
                      {GAME_STATUS_MAP[game.status]}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    {game.rating ? (
                      <span className="flex items-center gap-0.5">
                        {Array.from({ length: game.rating }, (_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-accent-400 text-accent-400" />
                        ))}
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-gray-500">{formatPlayTime(game.play_time || 0)}</td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openSessions(game)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#1A1A1A]" title="游玩记录">
                        <Play className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleEdit(game)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#1A1A1A]">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(game.id)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {games.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    暂无游戏记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
