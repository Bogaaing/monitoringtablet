"use client";

import React, { useState, useEffect, useMemo } from "react";
import { inspectionsService, Inspection } from "@/services/inspections.service";
import { authService } from "@/services/auth.service";
import { User } from "@/types";
import {
  Search,
  SlidersHorizontal,
  Tablet as TabletIcon,
  MapPin,
  Clock,
  ChevronRight,
  Check,
  X,
  RotateCcw,
  SearchX,
  Battery,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

// Mock Fallback Data strictly matching user specification
const FALLBACK_INSPECTIONS: Inspection[] = [
  {
    id: "ins-tb11-today",
    period_id: "period-aug-2026",
    tablet_id: "tab-11",
    pic_id: "pic-1",
    status: "pending",
    tablet_condition: "good",
    battery_pct: 92,
    notes: "Unit berfungsi normal, layar bersih tanpa goresan, scanner barcode responsif.",
    submitted_at: "2026-08-21T16:06:00Z",
    created_at: "2026-08-21T16:06:00Z",
    tablet: {
      id: "tab-11",
      qr_code: "TB 11",
      brand: "Exproof",
      model: "P9000",
      serial_number: "3559.2810.1241.291",
      location_id: "loc-politur",
      condition: "good",
      status: "active",
      location: {
        id: "loc-politur",
        name: "Politur",
      },
    },
    photos: [
      {
        id: "ph-1",
        inspection_id: "ins-tb11-today",
        photo_url: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=60",
        photo_type: "front",
        created_at: "2026-08-21T16:06:00Z",
      },
      {
        id: "ph-2",
        inspection_id: "ins-tb11-today",
        photo_url: "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&auto=format&fit=crop&q=60",
        photo_type: "back",
        created_at: "2026-08-21T16:06:00Z",
      },
    ],
  },
  {
    id: "ins-tb10-yesterday",
    period_id: "period-aug-2026",
    tablet_id: "tab-10",
    pic_id: "pic-1",
    status: "pending",
    tablet_condition: "good",
    battery_pct: 88,
    notes: "Inspeksi rutin area politur. Kondisi casing utuh, port charger bersih.",
    submitted_at: "2026-08-20T11:41:00Z",
    created_at: "2026-08-20T11:41:00Z",
    tablet: {
      id: "tab-10",
      qr_code: "TB 10",
      brand: "Exproof",
      model: "P9000",
      serial_number: "3559.2810.1241.290",
      location_id: "loc-politur",
      condition: "good",
      status: "active",
      location: {
        id: "loc-politur",
        name: "Politur",
      },
    },
    photos: [
      {
        id: "ph-3",
        inspection_id: "ins-tb10-yesterday",
        photo_url: "https://images.unsplash.com/photo-1589739900243-4b52cd9b104e?w=800&auto=format&fit=crop&q=60",
        photo_type: "front",
        created_at: "2026-08-20T11:41:00Z",
      },
    ],
  },
  {
    id: "ins-tb04-aug4",
    period_id: "period-aug-2026",
    tablet_id: "tab-04",
    pic_id: "pic-1",
    status: "approved",
    tablet_condition: "good",
    battery_pct: 95,
    notes: "Semua fungsi hardware & software telah diverifikasi layak operasi.",
    submitted_at: "2026-08-04T10:46:00Z",
    created_at: "2026-08-04T10:46:00Z",
    tablet: {
      id: "tab-04",
      qr_code: "TB 04",
      brand: "Exproof",
      model: "P9000",
      serial_number: "3559.2810.1241.284",
      location_id: "loc-politur",
      condition: "good",
      status: "active",
      location: {
        id: "loc-politur",
        name: "Politur",
      },
    },
    photos: [
      {
        id: "ph-4",
        inspection_id: "ins-tb04-aug4",
        photo_url: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=60",
        photo_type: "front",
        created_at: "2026-08-04T10:46:00Z",
      },
    ],
  },
  {
    id: "ins-tb14-aug4",
    period_id: "period-aug-2026",
    tablet_id: "tab-14",
    pic_id: "pic-1",
    status: "pending",
    tablet_condition: "good",
    battery_pct: 84,
    notes: "Menunggu approval manager untuk jadwal rotasi unit.",
    submitted_at: "2026-08-04T10:41:00Z",
    created_at: "2026-08-04T10:41:00Z",
    tablet: {
      id: "tab-14",
      qr_code: "TB 14",
      brand: "Exproof",
      model: "P9000",
      serial_number: "3559.2810.1241.294",
      location_id: "loc-politur",
      condition: "good",
      status: "active",
      location: {
        id: "loc-politur",
        name: "Politur",
      },
    },
  },
  {
    id: "ins-tb07-aug4",
    period_id: "period-aug-2026",
    tablet_id: "tab-07",
    pic_id: "pic-1",
    status: "rejected",
    tablet_condition: "minor_damage",
    battery_pct: 45,
    rejection_reason: "Foto fisik layar tablet buram dan baterai di bawah standar minimum operasi (min 60%). Harap isi daya dan foto ulang.",
    notes: "Layar ada sedikit goresan halus di pojok kanan atas.",
    submitted_at: "2026-08-04T09:15:00Z",
    created_at: "2026-08-04T09:15:00Z",
    tablet: {
      id: "tab-07",
      qr_code: "TB 07",
      brand: "Exproof",
      model: "P9000",
      serial_number: "3559.2810.1241.287",
      location_id: "loc-politur",
      condition: "minor_damage",
      status: "active",
      location: {
        id: "loc-politur",
        name: "Politur",
      },
    },
  },
];

type FilterType = "all" | "pending" | "approved" | "rejected" | "processing";

export default function PicInspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    authService.getCurrentProfile().then((u) => setCurrentUser(u));
  }, []);

  const fetchInspections = async () => {
    setLoading(true);
    try {
      const userLocId = currentUser?.location_id || currentUser?.location?.id;
      const userLocName = currentUser?.location?.name?.trim().toLowerCase();

      const res = await inspectionsService.getInspections({
        limit: 100,
      });

      let rawData: Inspection[] = [];
      if (res.data && res.data.length > 0) {
        rawData = res.data;
      } else {
        rawData = FALLBACK_INSPECTIONS;
      }

      // Filter inspections matching user's assigned location
      if (userLocId || userLocName) {
        const filteredByLocation = rawData.filter((ins) => {
          const tabLocId = ins.tablet?.location_id || ins.tablet?.location?.id;
          const tabLocName = ins.tablet?.location?.name?.trim().toLowerCase();

          const matchId = userLocId && tabLocId && userLocId === tabLocId;
          const matchName = userLocName && tabLocName && userLocName === tabLocName;
          const matchPic = ins.pic_id && currentUser?.id && ins.pic_id === currentUser.id;

          return Boolean(matchId || matchName || matchPic);
        });
        setInspections(filteredByLocation);
      } else {
        setInspections(rawData);
      }
    } catch (e) {
      console.warn("Using fallback inspections dataset:", e);
      setInspections(FALLBACK_INSPECTIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, [currentUser]);

  // ─── Filter & Search Logic (Location + Status + Search) ───────────────────
  const filteredList = useMemo(() => {
    const userLocId = currentUser?.location_id || currentUser?.location?.id;
    const userLocName = currentUser?.location?.name?.trim().toLowerCase();

    return inspections.filter((ins) => {
      // 0. Location Filter based on logged-in user
      if (userLocId || userLocName) {
        const tabLocId = ins.tablet?.location_id || ins.tablet?.location?.id;
        const tabLocName = ins.tablet?.location?.name?.trim().toLowerCase();

        const matchId = userLocId && tabLocId && userLocId === tabLocId;
        const matchName = userLocName && tabLocName && userLocName === tabLocName;
        const matchPic = ins.pic_id && currentUser?.id && ins.pic_id === currentUser.id;

        if (!matchId && !matchName && !matchPic) {
          return false;
        }
      }

      // 1. Status Filter
      if (selectedFilter !== "all") {
        if (selectedFilter === "pending" && ins.status !== "pending" && ins.status !== "submitted") {
          return false;
        }
        if (selectedFilter === "approved" && ins.status !== "approved" && ins.status !== "completed") {
          return false;
        }
        if (selectedFilter === "rejected" && ins.status !== "rejected") {
          return false;
        }
        if (selectedFilter === "processing" && ins.status !== "in_progress" && ins.status !== "processing") {
          return false;
        }
      }

      // 2. Search query matching
      if (!search.trim()) return true;
      const s = search.toLowerCase().trim();
      const qrCode = ins.tablet?.qr_code?.toLowerCase() || "";
      const model = ins.tablet?.model?.toLowerCase() || "";
      const brand = ins.tablet?.brand?.toLowerCase() || "";
      const loc = ins.tablet?.location?.name?.toLowerCase() || "";
      const sn = ins.tablet?.serial_number?.toLowerCase() || "";

      return (
        qrCode.includes(s) ||
        model.includes(s) ||
        brand.includes(s) ||
        loc.includes(s) ||
        sn.includes(s)
      );
    });
  }, [inspections, selectedFilter, search, currentUser]);

  // ─── Group by Date Helper ─────────────────────────────────────────────────
  const groupedInspections = useMemo(() => {
    const groups: { [key: string]: Inspection[] } = {};

    filteredList.forEach((item) => {
      const dateStr = item.submitted_at || item.created_at || new Date().toISOString();
      const d = new Date(dateStr);
      const now = new Date();

      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday =
        d.getDate() === yesterday.getDate() &&
        d.getMonth() === yesterday.getMonth() &&
        d.getFullYear() === yesterday.getFullYear();

      let groupKey = "";
      if (isToday) {
        groupKey = "HARI INI";
      } else if (isYesterday) {
        groupKey = "KEMARIN";
      } else {
        const monthNames = [
          "AGUSTUS", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
          "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
        ];
        groupKey = `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });

    return groups;
  }, [filteredList]);

  // ─── Date Formatter Helper for Card Line ──────────────────────────────────
  const formatCardTime = (dateStr?: string) => {
    if (!dateStr) return "Hari ini • 16.06";
    const d = new Date(dateStr);
    const now = new Date();

    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    const time = `${hh}.${mm}`;

    if (isToday) {
      return `Hari ini • ${time}`;
    }
    if (isYesterday) {
      return `Kemarin • ${time}`;
    }

    const monthsShort = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return `${d.getDate()} ${monthsShort[d.getMonth()]} ${d.getFullYear()} • ${time}`;
  };

  // ─── Status Badge Renderer ────────────────────────────────────────────────
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
      case "submitted":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FEF3C7] text-[#B45309] text-[11px] font-bold border border-amber-200/60 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Pending Review</span>
          </span>
        );
      case "approved":
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#D1FAE5] text-[#047857] text-[11px] font-bold border border-emerald-200/60 shadow-2xs">
            <Check className="w-3.5 h-3.5 text-[#059669] stroke-[2.5]" />
            <span>Selesai</span>
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FFE4E6] text-[#BE123C] text-[11px] font-bold border border-rose-200/60 shadow-2xs">
            <X className="w-3.5 h-3.5 text-[#E11D48] stroke-[2.5]" />
            <span>Ditolak</span>
          </span>
        );
      case "in_progress":
      case "processing":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#DBEAFE] text-[#1D4ED8] text-[11px] font-bold border border-blue-200/60 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-ping" />
            <span>Diproses</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in pb-12 select-none">
      {/* ─── Page Header with Filter/Sliders Button ───────────────────────── */}
      <div className="flex items-center justify-between pt-1 px-1">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">
            Riwayat
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Lihat seluruh aktivitas inspeksi tablet
          </p>
        </div>

        <button
          onClick={() => setShowFilterDrawer(true)}
          className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center text-[#4F46E5] dark:text-indigo-400 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700/50 active:scale-95 transition-all"
          title="Filter Opsi"
        >
          <SlidersHorizontal className="w-4 h-4 stroke-[2.2]" />
        </button>
      </div>

      {/* ─── Search Bar ───────────────────────────────────────────────────── */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4 stroke-[2.2]" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari kode tablet, nama tablet..."
          className="w-full h-11 pl-10 pr-9 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-[#4F46E5] shadow-2xs transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ─── Filter Chips (Pill Shaped) ───────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
        {/* Semua */}
        <button
          onClick={() => setSelectedFilter("all")}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 active:scale-95 ${
            selectedFilter === "all"
              ? "bg-[#3842E2] text-white shadow-sm shadow-indigo-500/25"
              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50"
          }`}
        >
          Semua
        </button>

        {/* Pending */}
        <button
          onClick={() => setSelectedFilter("pending")}
          className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 active:scale-95 ${
            selectedFilter === "pending"
              ? "bg-[#3842E2] text-white shadow-sm shadow-indigo-500/25"
              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${selectedFilter === "pending" ? "bg-amber-300" : "bg-[#F59E0B]"}`} />
          <span>Pending</span>
        </button>

        {/* Selesai */}
        <button
          onClick={() => setSelectedFilter("approved")}
          className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 active:scale-95 ${
            selectedFilter === "approved"
              ? "bg-[#3842E2] text-white shadow-sm shadow-indigo-500/25"
              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${selectedFilter === "approved" ? "bg-emerald-300" : "bg-[#10B981]"}`} />
          <span>Selesai</span>
        </button>

        {/* Ditolak */}
        <button
          onClick={() => setSelectedFilter("rejected")}
          className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 active:scale-95 ${
            selectedFilter === "rejected"
              ? "bg-[#3842E2] text-white shadow-sm shadow-indigo-500/25"
              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${selectedFilter === "rejected" ? "bg-rose-300" : "bg-[#EF4444]"}`} />
          <span>Ditolak</span>
        </button>

        {/* Diproses */}
        <button
          onClick={() => setSelectedFilter("processing")}
          className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 active:scale-95 ${
            selectedFilter === "processing"
              ? "bg-[#3842E2] text-white shadow-sm shadow-indigo-500/25"
              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${selectedFilter === "processing" ? "bg-blue-300" : "bg-[#3B82F6]"}`} />
          <span>Diproses</span>
        </button>
      </div>

      {/* ─── Inspection Cards Grouped by Date ─────────────────────────────── */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">
          Memuat riwayat aktivitas...
        </div>
      ) : Object.keys(groupedInspections).length === 0 ? (
        <div className="py-16 px-4 bg-white dark:bg-slate-800/80 rounded-3xl border border-slate-100 dark:border-slate-800 text-center flex flex-col items-center justify-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] flex items-center justify-center">
            <SearchX className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Tidak ada riwayat inspeksi
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
            Coba sesuaikan kata kunci pencarian atau ganti filter status di atas.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedFilter("all");
            }}
            className="px-4 py-2 bg-[#4F46E5] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-indigo-700"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(groupedInspections).map(([groupTitle, items]) => (
            <div key={groupTitle} className="space-y-2.5">
              {/* Group Section Header */}
              <h2 className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 tracking-wider uppercase px-1">
                {groupTitle}
              </h2>

              {/* Cards in this Group */}
              <div className="space-y-3">
                {items.map((ins) => {
                  const tablet = ins.tablet;
                  const modelName = tablet?.model || "P9000";
                  const brandName = tablet?.brand || "Exproof";
                  const locName = tablet?.location?.name || "Politur";
                  const timeFormatted = formatCardTime(ins.submitted_at);

                  return (
                    <div
                      key={ins.id}
                      onClick={() => setSelectedInspection(ins)}
                      className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]"
                    >
                      {/* Left: Soft Purple Tablet Icon Box */}
                      <div className="w-13 h-13 rounded-2xl bg-[#EEF2FF] dark:bg-indigo-950/60 text-[#3842E2] dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100/60 dark:border-indigo-900/40">
                        <TabletIcon className="w-6 h-6 stroke-[1.8]" />
                      </div>

                      {/* Main Middle Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        {/* Top: QR Code & Status Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-lg font-black text-[#3842E2] dark:text-indigo-400 leading-tight truncate">
                            {tablet?.qr_code || "TB 01"}
                          </span>
                          <div className="shrink-0">
                            {renderStatusBadge(ins.status)}
                          </div>
                        </div>

                        {/* Secondary Model • Brand */}
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-snug">
                          {modelName} • {brandName}
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-[#3842E2] shrink-0" />
                          <span className="truncate">{locName}</span>
                        </div>

                        {/* Inspection Time */}
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                          <Clock className="w-3.5 h-3.5 text-[#3842E2] shrink-0" />
                          <span>{timeFormatted}</span>
                        </div>
                      </div>

                      {/* Right: Chevron Arrow */}
                      <div className="text-slate-400 dark:text-slate-500 shrink-0 pl-0.5">
                        <ChevronRight className="w-5 h-5 stroke-[2]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Detail Inspection Bottom Sheet Modal ─────────────────────────── */}
      {selectedInspection && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-5 space-y-4 relative max-h-[88vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            {/* Modal Handle Bar */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto sm:hidden" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 pt-1">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-[#4F46E5] flex items-center justify-center">
                  <TabletIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100 leading-tight">
                    {selectedInspection.tablet?.qr_code}
                  </h3>
                  <p className="text-[11px] text-slate-500">Detail Hasil Inspeksi</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInspection(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status & Quick Info */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Status Review
                </span>
                <div className="mt-1">
                  {renderStatusBadge(selectedInspection.status)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Baterai
                </span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1 mt-1">
                  <Battery className="w-4 h-4" />
                  <span>{selectedInspection.battery_pct || 85}%</span>
                </span>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60 space-y-0.5">
                <span className="text-slate-400 text-[10px] font-medium">Model / Merk</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedInspection.tablet?.model || "P9000"} ({selectedInspection.tablet?.brand || "Exproof"})
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60 space-y-0.5">
                <span className="text-slate-400 text-[10px] font-medium">Serial Number</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
                  {selectedInspection.tablet?.serial_number || "3559.2810.1241.290"}
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60 space-y-0.5">
                <span className="text-slate-400 text-[10px] font-medium">Lokasi Penugasan</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#4F46E5]" />
                  <span>{selectedInspection.tablet?.location?.name || "Politur"}</span>
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60 space-y-0.5">
                <span className="text-slate-400 text-[10px] font-medium">Waktu Kirim</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {formatCardTime(selectedInspection.submitted_at)}
                </p>
              </div>
            </div>

            {/* Condition badge */}
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Kondisi Fisik Tablet:</span>
              <span className={`font-bold px-2 py-0.5 rounded-md uppercase text-[11px] ${
                selectedInspection.tablet_condition === "good"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
              }`}>
                {selectedInspection.tablet_condition === "good" ? "Layak Pakai / Baik" : "Ada Kendala / Rusak"}
              </span>
            </div>

            {/* Rejection Note */}
            {selectedInspection.rejection_reason && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Alasan Penolakan Manager:</span>
                </div>
                <p className="italic pl-5">"{selectedInspection.rejection_reason}"</p>
              </div>
            )}

            {/* PIC Notes */}
            {selectedInspection.notes && (
              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-[#4F46E5]" />
                  <span>Catatan PIC:</span>
                </span>
                <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-xs">
                  {selectedInspection.notes}
                </p>
              </div>
            )}

            {/* Photo Gallery */}
            {selectedInspection.photos && selectedInspection.photos.length > 0 && (
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Dokumentasi Foto Fisik ({selectedInspection.photos.length}):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {selectedInspection.photos.map((ph) => (
                    <div
                      key={ph.id}
                      onClick={() => setActivePhotoUrl(ph.photo_url)}
                      className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer group hover:scale-[1.02] transition-transform"
                    >
                      <img src={ph.photo_url} alt="Foto Inspeksi" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1.5 left-1.5 bg-slate-950/80 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                        {ph.photo_type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="pt-2">
              <button
                onClick={() => setSelectedInspection(null)}
                className="w-full py-3 bg-[#4F46E5] hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-xs transition-colors"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Lightbox Photo Viewer ────────────────────────────────────────── */}
      {activePhotoUrl && (
        <div
          onClick={() => setActivePhotoUrl(null)}
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
        >
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            <img
              src={activePhotoUrl}
              alt="Foto Inspeksi Full"
              className="max-w-[92vw] max-h-[85vh] w-auto h-auto object-contain rounded-2xl shadow-2xl border border-white/20"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActivePhotoUrl(null);
              }}
              className="absolute -top-12 right-0 p-2 bg-slate-900/80 text-white rounded-full hover:bg-slate-800 border border-white/20 shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Quick Filter Drawer Modal ────────────────────────────────────── */}
      {showFilterDrawer && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Filter Riwayat Inspeksi
              </h3>
              <button
                onClick={() => setShowFilterDrawer(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                Status Review
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "all", label: "Semua Status" },
                  { id: "pending", label: "Pending Review" },
                  { id: "approved", label: "Selesai (Disetujui)" },
                  { id: "rejected", label: "Ditolak Manager" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedFilter(item.id as FilterType);
                    }}
                    className={`p-2.5 rounded-xl border text-left font-semibold text-xs transition-all ${
                      selectedFilter === item.id
                        ? "bg-indigo-50 border-[#4F46E5] text-[#4F46E5] font-bold"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedFilter("all");
                  setSearch("");
                  setShowFilterDrawer(false);
                }}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Reset
              </button>
              <button
                onClick={() => setShowFilterDrawer(false)}
                className="flex-1 py-2.5 bg-[#4F46E5] text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
