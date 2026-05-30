"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import type { Game } from "@/lib/types";
import { GAME_STATUS_MAP, GAME_STATUS_COLORS } from "@/lib/types";
import {
  Star,
  ExternalLink,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import ImagePreview from "@/components/ImagePreview";
import * as XLSX from "xlsx";
import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/zh-cn";
import locale from "antd/locale/zh_CN";
import { ConfigProvider } from "antd";

dayjs.locale("zh-cn");

const statusOptions = [
  { value: "all", label: "全部" },
  { value: "want_to_play", label: "想玩" },
  { value: "playing", label: "在玩" },
  { value: "completed", label: "已通关" },
  { value: "dropped", label: "弃坑" },
];

const platformOptions = [
  { value: "all", label: "全部平台" },
  { value: "Steam", label: "Steam" },
  { value: "Epic", label: "Epic" },
  { value: "Xbox", label: "Xbox" },
  { value: "PS5", label: "PS5" },
  { value: "Switch", label: "Switch" },
];

const ITEMS_PER_PAGE = 12;

const formatPlayTime = (hours: number | null) => {
  if (!hours || hours === 0) return null;
  return `${hours}h`;
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("2026");
  const [showTimeline, setShowTimeline] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetch("/api/games")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const sorted = [...data].sort((a, b) => {
            const aCompleted = a.completed_at
              ? new Date(a.completed_at).getTime()
              : 0;
            const bCompleted = b.completed_at
              ? new Date(b.completed_at).getTime()
              : 0;
            return (
              bCompleted - aCompleted ||
              new Date(b.updated_at).getTime() -
                new Date(a.updated_at).getTime()
            );
          });
          setGames(sorted);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = games.filter((g) => {
    if (statusFilter !== "all" && g.status !== statusFilter) return false;
    if (platformFilter !== "all" && !g.platform?.includes(platformFilter))
      return false;
    if (yearFilter !== "all") {
      const startedMatch = g.started_at?.startsWith(yearFilter);
      const completedMatch = g.completed_at?.startsWith(yearFilter);
      if (!startedMatch && !completedMatch) return false;
    }
    if (monthFilter !== "all") {
      const fullMonthFilter = `${yearFilter}-${monthFilter}`;
      const startedMatch = g.started_at?.startsWith(fullMonthFilter);
      const completedMatch = g.completed_at?.startsWith(fullMonthFilter);
      if (!startedMatch && !completedMatch) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedGames = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, platformFilter, monthFilter, yearFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 导出游戏列表到Excel
  const exportToExcel = () => {
    const exportData = filtered.map((game) => ({
      "游戏名称": game.title,
      "状态": GAME_STATUS_MAP[game.status],
      "平台": game.platform?.join("、") || "",
      "评分": game.rating ? "⭐".repeat(game.rating) : "",
      "游玩时间": game.play_time ? `${game.play_time}h` : "",
      "开始时间": game.started_at ? formatDate(game.started_at) : "",
      "通关时间": game.completed_at ? formatDate(game.completed_at) : "",
      "分类": game.categories?.join("、") || "",
      "感想": game.review || "",
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "游戏列表");
    
    // 调整列宽
    worksheet["!cols"] = [
      { wch: 30 }, // 游戏名称
      { wch: 10 }, // 状态
      { wch: 15 }, // 平台
      { wch: 10 }, // 评分
      { wch: 10 }, // 游玩时间
      { wch: 12 }, // 开始时间
      { wch: 12 }, // 通关时间
      { wch: 25 }, // 分类
      { wch: 50 }, // 感想
    ];
    
    XLSX.writeFile(workbook, `游戏列表_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const timelineData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const playedThisYear = games.filter((g) => {
      if (g.started_at) {
        const year = new Date(g.started_at).getFullYear();
        return year === currentYear;
      }
      if (g.completed_at) {
        const year = new Date(g.completed_at).getFullYear();
        return year === currentYear;
      }
      return false;
    });

    const grouped: Record<string, Game[]> = {};
    playedThisYear.forEach((game) => {
      const date = game.completed_at || game.started_at;
      if (date) {
        const month = new Date(date).toLocaleDateString("zh-CN", {
          year: "numeric",
          month: "long",
        });
        if (!grouped[month]) grouped[month] = [];
        grouped[month].push(game);
      }
    });

    const sortedMonths = Object.keys(grouped).sort((a, b) => {
      const dateA = new Date(a.replace("月", "/1"));
      const dateB = new Date(b.replace("月", "/1"));
      return dateB.getTime() - dateA.getTime();
    });

    return { grouped, sortedMonths, count: playedThisYear.length };
  }, [games]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < rating ? "fill-accent-400 text-accent-400" : "text-gray-200"}`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold tracking-tight text-[#1A1A1A]">游戏</h1>
      <p className="text-lg text-gray-500">探索世界，体验人生</p>

      {timelineData.count > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md">
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className="flex w-full items-center justify-between"
          >
            <div>
              <h2 className="text-xl font-semibold text-[#1A1A1A]">
                {new Date().getFullYear()}年游戏时间轴
              </h2>
              <p className="text-sm text-gray-500">
                今年玩了 {timelineData.count} 款游戏
              </p>
            </div>
            {showTimeline ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>

          {showTimeline && (
            <div className="mt-4 space-y-6">
              {timelineData.sortedMonths.map((month) => (
                <div key={month}>
                  <div className="mb-3 flex items-center gap-3">
                    <div className="h-px flex-1 bg-gray-300" />
                    <span className="text-sm font-medium text-gray-600">
                      {month}
                    </span>
                    <div className="h-px flex-1 bg-gray-300" />
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {timelineData.grouped[month].map((game) => (
                      <div
                        key={game.id}
                        className="flex-shrink-0 w-24 overflow-hidden rounded-lg bg-gray-100"
                      >
                        {game.cover_url ? (
                          <div className="aspect-[4/3] overflow-hidden">
                            <ImagePreview
                              src={game.cover_url}
                              alt={game.title}
                              className="h-full w-full"
                              aspectRatio="4/3"
                              enablePreview={false}
                            />
                          </div>
                        ) : (
                          <div className="flex h-16 items-center justify-center text-2xl">
                            🎮
                          </div>
                        )}
                        <p className="truncate px-2 py-1.5 text-xs font-medium text-[#1A1A1A]">
                          {game.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="space-y-4 pt-4">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  statusFilter === opt.value
                    ? "bg-[#1A1A1A] text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80"
          >
            <Download className="h-4 w-4" />
            导出Excel
          </button>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {platformOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPlatformFilter(opt.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  platformFilter === opt.value
                    ? "bg-[#1A1A1A] text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <ConfigProvider locale={locale}>
              <DatePicker
                picker="year"
                value={dayjs(yearFilter)}
                onChange={(date) => setYearFilter(date ? date.format("YYYY") : "2026")}
                className="rounded-lg"
                placeholder="选择年份"
                allowClear={false}
              />
            </ConfigProvider>
          </div>
          
          <div className="flex items-center gap-2">
            <ConfigProvider locale={locale}>
              <DatePicker
                picker="month"
                value={monthFilter === "all" ? null : dayjs(`${yearFilter}-${monthFilter}`)}
                onChange={(date) => setMonthFilter(date ? date.format("MM") : "all")}
                className="rounded-lg"
                placeholder="选择月份"
                format="MM"
              />
            </ConfigProvider>
            {monthFilter !== "all" && (
              <button
                onClick={() => setMonthFilter("all")}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                清除
              </button>
            )}
          </div>
        </div>
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
        <>
          <div className="grid gap-6 pt-4 sm:grid-cols-2 lg:grid-cols-4">
            {paginatedGames.map((game, index) => (
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
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    enablePreview={false}
                    hoverScale
                    priority={index < 4}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-300 text-3xl">
                    🎮
                  </div>
                )}
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-[#1A1A1A] line-clamp-1">
                    {game.title}
                  </h3>
                  <span
                    className={`flex-shrink-0 font-medium rounded-full  px-2 py-0.5 text-xs ${GAME_STATUS_COLORS[game.status]}`}
                  >
                    {GAME_STATUS_MAP[game.status]}
                  </span>
                </div>
                {game.platform && game.platform.length > 0 && (
                  <p className="text-xs text-gray-400">
                    {game.platform.join(" · ")}
                  </p>
                )}
                {game.categories && game.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {game.categories.map((cat) => (
                      <span
                        key={cat}
                        className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
                {(game.started_at || game.completed_at) && (
                  <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                    {game.started_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(game.started_at)} 开始
                      </span>
                    )}
                    {game.completed_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(game.completed_at)} 通关
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  {game.rating && (
                    <div className="flex items-center gap-0.5">
                      {renderStars(game.rating)}
                    </div>
                  )}
                  {formatPlayTime(game.play_time) && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      {formatPlayTime(game.play_time)}
                    </div>
                  )}
                </div>
                {game.review && (
                  <p className="text-xs text-gray-400 line-clamp-2">
                    {game.review}
                  </p>
                )}
              </div>
            </Link>
          ))}
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                <ChevronLeft className="h-4 w-4" />
                上一页
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? "bg-[#1A1A1A] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                下一页
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
          
          <p className="text-center text-sm text-gray-400 pt-4">
            共 {filtered.length} 款游戏，显示 {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} 款
          </p>
        </>
      )}
    </div>
  );
}
