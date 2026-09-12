"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AgreementDiff, AgreementVersion, getDiff } from "@/lib/api";
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ArrowRight
} from "lucide-react";

interface WhatChangedDiffProps {
  agreementId: string;
  versions: AgreementVersion[];
  initialFromVersion?: number;
  initialToVersion?: number;
}

export const WhatChangedDiff: React.FC<WhatChangedDiffProps> = ({
  agreementId,
  versions,
  initialFromVersion,
  initialToVersion,
}) => {
  const latestVersion = versions.length > 0 ? versions[versions.length - 1].version_number : 1;
  const previousVersion = latestVersion > 1 ? latestVersion - 1 : 1;

  const [fromVer, setFromVer] = useState<number>(initialFromVersion ?? previousVersion);
  const [toVer, setToVer] = useState<number>(initialToVersion ?? latestVersion);
  const [diff, setDiff] = useState<AgreementDiff | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDiff = useCallback(async () => {
    if (fromVer === toVer) {
      setDiff(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getDiff(agreementId, fromVer, toVer);
      setDiff(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load version difference";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [agreementId, fromVer, toVer]);

  useEffect(() => {
    fetchDiff();
  }, [fetchDiff]);

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "Rp 0";
    return `Rp ${val.toLocaleString("id-ID")}`;
  };

  const formatDate = (val: string | null | undefined) => {
    if (!val) return "No deadline specified";
    try {
      const d = new Date(val);
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return val;
    }
  };

  // Calculate percentage and absolute price diff if applicable
  const calculatePriceDelta = () => {
    if (!diff?.amount) return null;
    const oldVal = diff.amount.old ?? 0;
    const newVal = diff.amount.new ?? 0;
    const delta = newVal - oldVal;
    if (delta === 0) return null;

    const percentage = oldVal > 0 ? Math.round((Math.abs(delta) / oldVal) * 100) : 100;
    return {
      delta,
      deltaFormatted: formatCurrency(Math.abs(delta)),
      percentage,
      isPositive: delta > 0,
    };
  };

  const priceDelta = calculatePriceDelta();

  return (
    <div className="glass-panel rounded-2xl border border-purple-500/20 overflow-hidden shadow-xl shadow-purple-950/20 transition-all">
      {/* Diff Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-purple-950/40 via-slate-900/80 to-indigo-950/40 border-b border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-sm">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Section 22: What Changed? Diff Engine
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Deterministic
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Audit revision changes between contract versions
            </p>
          </div>
        </div>

        {/* Version selectors */}
        <div className="flex items-center space-x-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-white/[0.08] text-xs font-mono">
          <span className="text-slate-400">Comparing</span>
          <select
            value={fromVer}
            onChange={(e) => setFromVer(Number(e.target.value))}
            className="bg-slate-800 text-white rounded px-2 py-1 border border-white/10 focus:outline-none focus:border-purple-400"
          >
            {versions.map((v) => (
              <option key={`from-${v.version_number}`} value={v.version_number}>
                Version {v.version_number}
              </option>
            ))}
          </select>

          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />

          <select
            value={toVer}
            onChange={(e) => setToVer(Number(e.target.value))}
            className="bg-slate-800 text-purple-300 font-semibold rounded px-2 py-1 border border-white/10 focus:outline-none focus:border-purple-400"
          >
            {versions.map((v) => (
              <option key={`to-${v.version_number}`} value={v.version_number}>
                Version {v.version_number}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Diff Body Content */}
      <div className="p-5 space-y-5">
        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-2 text-slate-400">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-mono">Calculating contract delta...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : fromVer === toVer ? (
          <div className="py-8 text-center text-slate-400 text-xs font-mono">
            Select two different versions to compute diff.
          </div>
        ) : !diff?.has_changes ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2 font-mono">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Versions v{fromVer} and v{toVer} are identical in terms, amount, and deadline.</span>
          </div>
        ) : (
          <>
            {/* Trend Badges Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Price Trend Card */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  diff.price_trend === "Increased"
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                    : diff.price_trend === "Decreased"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-slate-900/60 border-white/5 text-slate-400"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-lg bg-black/30">
                    {diff.price_trend === "Increased" ? (
                      <TrendingUp className="w-4 h-4 text-amber-400" />
                    ) : diff.price_trend === "Decreased" ? (
                      <TrendingDown className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <DollarSign className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider opacity-80 block">
                      Price Impact
                    </span>
                    <span className="text-xs font-bold font-mono">
                      {diff.price_trend === "Increased" && priceDelta
                        ? `+${priceDelta.deltaFormatted} (+${priceDelta.percentage}%) Price Increased`
                        : diff.price_trend === "Decreased" && priceDelta
                        ? `-${priceDelta.deltaFormatted} (-${priceDelta.percentage}%) Price Decreased`
                        : "Price Unchanged"}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10">
                  {diff.price_trend}
                </span>
              </div>

              {/* Deadline Trend Card */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  diff.deadline_trend === "Extended"
                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                    : diff.deadline_trend === "Shortened"
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                    : "bg-slate-900/60 border-white/5 text-slate-400"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-lg bg-black/30">
                    <Clock className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider opacity-80 block">
                      Timeline Schedule
                    </span>
                    <span className="text-xs font-bold font-mono">
                      {diff.deadline_trend === "Extended"
                        ? "Deadline Extended"
                        : diff.deadline_trend === "Shortened"
                        ? "Deadline Shortened"
                        : "Deadline Unchanged"}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10">
                  {diff.deadline_trend}
                </span>
              </div>
            </div>

            {/* Field Breakdown Table */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Detailed Field Comparison
              </h4>

              {/* Title diff */}
              {diff.title && (
                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-white/[0.08] space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
                    <FileText className="w-3.5 h-3.5 text-purple-400" />
                    <span>Title Changed</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded-lg bg-rose-950/20 border border-rose-500/20 text-rose-300">
                      <span className="text-[10px] uppercase text-rose-400/70 block">Version {fromVer} (Original)</span>
                      <span className="line-through">{diff.title.old}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-300">
                      <span className="text-[10px] uppercase text-emerald-400/70 block">Version {toVer} (Revised)</span>
                      <span>{diff.title.new}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Amount diff */}
              {diff.amount && (
                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-white/[0.08] space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
                    <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                    <span>Compensation / Total Amount</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded-lg bg-rose-950/20 border border-rose-500/20 text-rose-300">
                      <span className="text-[10px] uppercase text-rose-400/70 block">Version {fromVer}</span>
                      <span className="line-through">{formatCurrency(diff.amount.old)}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 font-bold">
                      <span className="text-[10px] uppercase text-emerald-400/70 block">Version {toVer}</span>
                      <span>{formatCurrency(diff.amount.new)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Deadline diff */}
              {diff.deadline && (
                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-white/[0.08] space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Target Delivery Date</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded-lg bg-rose-950/20 border border-rose-500/20 text-rose-300">
                      <span className="text-[10px] uppercase text-rose-400/70 block">Version {fromVer}</span>
                      <span className="line-through">{formatDate(diff.deadline.old)}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 font-bold">
                      <span className="text-[10px] uppercase text-emerald-400/70 block">Version {toVer}</span>
                      <span>{formatDate(diff.deadline.new)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Description / Scope diff */}
              {diff.description && (
                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-white/[0.08] space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Scope of Work / Description</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20 text-rose-300/90 whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
                      <span className="text-[10px] uppercase text-rose-400 font-bold block mb-1">
                        Version {fromVer} Scope
                      </span>
                      {diff.description.old || "(Empty)"}
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-300/90 whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
                      <span className="text-[10px] uppercase text-emerald-400 font-bold block mb-1">
                        Version {toVer} Scope
                      </span>
                      {diff.description.new || "(Empty)"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
