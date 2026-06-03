"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import ImageUpload from "@/components/ImageUpload";
import type { Game } from "@/lib/types";
import { GAME_STATUS_MAP, GAME_STATUS_COLORS } from "@/lib/types";
import { Plus, Edit, Trash2, X, Star, Calendar } from "lucide-react";
import { fetchSteamCover } from "@/lib/steam";
import type { SteamSearchResult, SteamAppDetails } from "@/lib/steam";
import { DatePicker, ConfigProvider, Pagination } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import locale from "antd/locale/zh_CN";

dayjs.locale("zh-cn");

const PAGE_SIZE = 10;

const emptyGameForm = {
  title: "",
  cover_url: "",
  platform: "",
  status: "want_to_play",
  rating: "0",
  steam_url: "",
  categories: [] as string[],
  review: "",
  play_time: "",
  started_at: "",
  completed_at: "",
};

const platformOptions = ["Steam", "Xbox", "Epic", "PlayStation", "Switch"];
const KNOWN_CATEGORIES = [
  "动作",
  "冒险",
  "魂类",
  "角色扮演",
  "回合制",
  "射击",
  "格斗",
  "竞速",
  "休闲",
  "解谜",
  "生存",
  "模拟",
  "建造",
  "沙盒",
  "卡牌",
  "策略",
  "即时战略",
  "塔防",
  "类 Rogue",
  "潜行",
  "大逃杀",
  "体育",
  "视觉小说",
  "开放世界",
  "多人",
  "合作",
  "对战",
  "竞技",
  "大型多人在线",
  "独立",
  "像素",
  "卡通",
  "科幻",
  "奇幻",
  "赛博朋克",
  "中世纪",
  "战争",
  "历史",
  "恐怖",
  "悬疑",
  "暗黑",
  "剧情丰富",
  "抢先体验",
];

export default function GameAdminPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Game | null>(null);
  const [form, setForm] = useState(emptyGameForm);
  const [showForm, setShowForm] = useState(false);
  const [yearFilter, setYearFilter] = useState(dayjs().year());
  const [currentPage, setCurrentPage] = useState(1);

  const [searchResults, setSearchResults] = useState<SteamSearchResult[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const filteredGames = games.filter((game) => {
    if (yearFilter === 0) return true;
    const startedYear = game.started_at
      ? new Date(game.started_at).getFullYear()
      : null;
    const completedYear = game.completed_at
      ? new Date(game.completed_at).getFullYear()
      : null;
    return startedYear === yearFilter || completedYear === yearFilter;
  });

  const paginatedGames = filteredGames.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleSearchInput = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, title: value }));
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!value.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    setSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/steam/search?q=${encodeURIComponent(value)}`,
        );
        const data = await res.json();
        setSearchResults(data.items || []);
        setShowSearchDropdown(data.items?.length > 0);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, []);

  const handleSelectGame = useCallback(async (item: SteamSearchResult) => {
    setShowSearchDropdown(false);
    setSearchResults([]);
    setForm((prev) => ({
      ...prev,
      title: item.name,
      steam_url: `https://store.steampowered.com/app/${item.appid}`,
    }));

    try {
      const [coverUrl, detailsRes] = await Promise.all([
        fetchSteamCover(`https://store.steampowered.com/app/${item.appid}`),
        fetch(`/api/steam/details?appid=${item.appid}`),
      ]);
      let categories: string[] = [];
      if (detailsRes.ok) {
        const details: SteamAppDetails = await detailsRes.json();
        categories = details.genres.map((g) => g.description);
      }
      setForm((prev) => ({
        ...prev,
        cover_url: coverUrl || prev.cover_url,
        categories,
      }));
    } catch {}
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleCategory = (cat: string) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const fetchGames = async () => {
    const res = await fetch("/api/admin/games?sort=completed");
    const data = await res.json();
    if (Array.isArray(data)) setGames(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const handleGameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      started_at: form.started_at || null,
      completed_at: form.completed_at || null,
    };

    const url = "/api/admin/games";
    const method = editing ? "PUT" : "POST";
    if (editing) body.id = editing.id;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setForm(emptyGameForm);
      setEditing(null);
      setShowForm(false);
      fetchGames();
    }
  };

  const formatDateForInput = (dateStr: string | null): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  const handleEdit = (game: Game) => {
    setEditing(game);
    setForm({
      title: game.title,
      cover_url: game.cover_url || "",
      platform: game.platform?.[0] || "",
      status: game.status,
      rating: game.rating?.toString() || "0",
      steam_url: game.steam_url || "",
      categories: game.categories || [],
      review: game.review || "",
      play_time: game.play_time?.toString() || "",
      started_at: formatDateForInput(game.started_at),
      completed_at: formatDateForInput(game.completed_at),
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除吗？")) return;
    await fetch("/api/admin/games", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchGames();
  };

  const formatPlayTime = (hours: number) => {
    if (!hours || hours === 0) return "-";
    return `${hours}h`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}`;
  };

  return (
    <AdminLayout>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-xl lg:text-2xl font-bold text-[#1A1A1A]">
          游戏管理
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-sm text-gray-500">年份筛选:</span>
            <ConfigProvider locale={locale}>
              <DatePicker
                picker="year"
                value={yearFilter ? dayjs(yearFilter.toString()) : null}
                onChange={(date) => {
                  setYearFilter(date ? date.year() : dayjs().year());
                  setCurrentPage(1);
                }}
                className="w-32"
                allowClear
                placeholder="全部年份"
              />
            </ConfigProvider>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setForm(emptyGameForm);
              setShowForm(true);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80"
          >
            <Plus className="h-4 w-4" />
            新增
          </button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {editing ? "编辑游戏" : "新增游戏"}
            </h2>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
              }}
              className="text-gray-400 hover:text-[#1A1A1A]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleGameSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5 relative" ref={searchRef}>
                <label className="text-sm font-medium text-gray-600">
                  游戏名称
                </label>
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
                          <img
                            src={item.logo}
                            alt=""
                            className="h-10 w-10 flex-shrink-0 rounded object-cover"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-[#1A1A1A]">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            App ID: {item.appid}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-600">
                  平台
                </label>
                <select
                  value={form.platform}
                  onChange={(e) =>
                    setForm({ ...form, platform: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]"
                >
                  <option value="">请选择平台</option>
                  {platformOptions.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-600">
                  状态
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]"
                >
                  {Object.entries(GAME_STATUS_MAP).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-600">
                  评分 (1-5)
                </label>
                <select
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]"
                >
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n === 0 ? "未评分" : "⭐".repeat(n)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-600">
                  游玩时间（小时）
                </label>
                <input
                  type="number"
                  value={form.play_time}
                  onChange={(e) =>
                    setForm({ ...form, play_time: e.target.value })
                  }
                  placeholder="5"
                  min="0"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-600">
                  开始玩日期
                </label>
                <ConfigProvider locale={locale}>
                  <DatePicker
                    picker="month"
                    value={form.started_at ? dayjs(form.started_at) : null}
                    onChange={(date) =>
                      setForm({
                        ...form,
                        started_at: date ? date.format("YYYY-MM") : "",
                      })
                    }
                    className="w-full"
                  />
                </ConfigProvider>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-600">
                  通关日期
                </label>
                <ConfigProvider locale={locale}>
                  <DatePicker
                    picker="month"
                    value={form.completed_at ? dayjs(form.completed_at) : null}
                    onChange={(date) =>
                      setForm({
                        ...form,
                        completed_at: date ? date.format("YYYY-MM") : "",
                      })
                    }
                    className="w-full"
                  />
                </ConfigProvider>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-gray-600">
                  Steam 链接
                </label>
                <div className="flex gap-2">
                  <input
                    value={form.steam_url}
                    onChange={(e) =>
                      setForm({ ...form, steam_url: e.target.value })
                    }
                    placeholder="https://store.steampowered.com/app/..."
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">
                封面图片
              </label>
              <ImageUpload
                bucket="game-covers"
                onUpload={(url) => setForm({ ...form, cover_url: url })}
                preview={form.cover_url}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">
                分类标签
              </label>
              <div className="flex flex-wrap gap-2">
                {KNOWN_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      form.categories.includes(cat)
                        ? "bg-[#1A1A1A] text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {form.categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {form.categories.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2.5 py-0.5 text-xs font-medium text-accent-700"
                    >
                      {cat}
                      <button
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className="text-accent-400 hover:text-accent-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">
                感想总结
              </label>
              <textarea
                value={form.review}
                onChange={(e) => setForm({ ...form, review: e.target.value })}
                rows={4}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]"
                placeholder="写下对这款游戏的感想..."
              />
            </div>

            <button
              type="submit"
              className="rounded-lg bg-[#1A1A1A] px-6 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80"
            >
              {editing ? "保存修改" : "创建游戏"}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#1A1A1A]" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-3 sm:px-6 py-3 font-medium text-gray-500 whitespace-nowrap">
                    游戏
                  </th>
                  <th className="hidden sm:table-cell px-3 sm:px-6 py-3 font-medium text-gray-500 whitespace-nowrap">
                    平台
                  </th>
                  <th className="hidden md:table-cell px-3 sm:px-6 py-3 font-medium text-gray-500 whitespace-nowrap min-w-[200px]">
                    分类
                  </th>
                  <th className="px-3 sm:px-6 py-3 font-medium text-gray-500 whitespace-nowrap">
                    状态
                  </th>
                  <th className="px-3 sm:px-6 py-3 font-medium text-gray-500 whitespace-nowrap">
                    评分
                  </th>
                  <th className="px-3 sm:px-6 py-3 font-medium text-gray-500 whitespace-nowrap">
                    游玩时间
                  </th>
                  <th className="hidden md:table-cell px-3 sm:px-6 py-3 font-medium text-gray-500 whitespace-nowrap">
                    开始日期
                  </th>
                  <th className="hidden md:table-cell px-3 sm:px-6 py-3 font-medium text-gray-500 whitespace-nowrap">
                    通关日期
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-right font-medium text-gray-500 whitespace-nowrap">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedGames.map((game) => (
                  <tr key={game.id} className="hover:bg-gray-50">
                    <td
                      className="px-3 sm:px-6 py-3 font-medium text-[#1A1A1A] whitespace-nowrap max-w-[120px] sm:max-w-none truncate"
                      title={game.title}
                    >
                      {game.title}
                    </td>
                    <td className="hidden sm:table-cell px-3 sm:px-6 py-3 text-gray-500 whitespace-nowrap">
                      {game.platform?.join(", ") || "-"}
                    </td>
                    <td className="hidden md:table-cell px-3 sm:px-6 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(game.categories || []).slice(0, 3).map((cat) => (
                          <span
                            key={cat}
                            className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
                          >
                            {cat}
                          </span>
                        ))}
                        {(game.categories || []).length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{game.categories.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${GAME_STATUS_COLORS[game.status]}`}
                      >
                        {GAME_STATUS_MAP[game.status]}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                      {game.rating ? (
                        <span className="flex items-center gap-0.5">
                          {Array.from({ length: game.rating }, (_, i) => (
                            <Star
                              key={i}
                              className="h-3.5 w-3.5 fill-accent-400 text-accent-400"
                            />
                          ))}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 text-gray-500 whitespace-nowrap">
                      {formatPlayTime(game.play_time || 0)}
                    </td>
                    <td className="hidden md:table-cell px-3 sm:px-6 py-3 text-gray-500 whitespace-nowrap">
                      {game.started_at ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(game.started_at)}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="hidden md:table-cell px-3 sm:px-6 py-3 text-gray-500 whitespace-nowrap">
                      {game.completed_at ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(game.completed_at)}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(game)}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#1A1A1A]"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(game.id)}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredGames.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-3 sm:px-6 py-12 text-center text-gray-400"
                    >
                      还没有游戏记录 🎮
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredGames.length > 0 && (
            <div className="mt-4 flex justify-center">
              <Pagination
                current={currentPage}
                pageSize={PAGE_SIZE}
                total={filteredGames.length}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
                showQuickJumper={false}
              />
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
