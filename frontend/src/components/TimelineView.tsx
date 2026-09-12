"use client";

import React, { useState } from "react";
import { AgreementEvent, User } from "@/lib/api";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  RefreshCw,
  GitMerge,
  Flag,
  Award,
  ExternalLink,
  Copy,
  Check,
  Clock,
  User as UserIcon,
  Hash
} from "lucide-react";

interface TimelineViewProps {
  events: AgreementEvent[];
  users: User[];
  currentUserId?: string;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  events,
  users,
  currentUserId,
}) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const copyTxHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.username : `User ${userId.substring(0, 6)}`;
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const getEventBadge = (type: string) => {
    switch (type) {
      case "Created":
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" />,
          color: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
          title: "Agreement Drafted",
        };
      case "Accepted":
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
          color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
          title: "Agreement Activated",
        };
      case "Rejected":
        return {
          icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
          color: "bg-rose-500/10 text-rose-300 border-rose-500/30",
          title: "Agreement Rejected",
        };
      case "RevisionProposed":
        return {
          icon: <RefreshCw className="w-3.5 h-3.5 text-purple-400" />,
          color: "bg-purple-500/10 text-purple-300 border-purple-500/30",
          title: "Revision Proposed",
        };
      case "RevisionAccepted":
        return {
          icon: <GitMerge className="w-3.5 h-3.5 text-emerald-400" />,
          color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
          title: "Revision Ratified",
        };
      case "RevisionRejected":
        return {
          icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
          color: "bg-rose-500/10 text-rose-300 border-rose-500/30",
          title: "Revision Declined",
        };
      case "CompletionRequested":
        return {
          icon: <Flag className="w-3.5 h-3.5 text-amber-400" />,
          color: "bg-amber-500/10 text-amber-300 border-amber-500/30",
          title: "Completion Requested",
        };
      case "Completed":
        return {
          icon: <Award className="w-3.5 h-3.5 text-emerald-400" />,
          color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20",
          title: "Agreement Completed & Verified",
        };
      default:
        return {
          icon: <Clock className="w-3.5 h-3.5 text-slate-400" />,
          color: "bg-slate-800 text-slate-300 border-white/10",
          title: type,
        };
    }
  };

  const truncate = (str: string, lead = 8, tail = 6) => {
    if (!str || str.length <= lead + tail) return str;
    return `${str.substring(0, lead)}...${str.substring(str.length - tail)}`;
  };

  if (!events || events.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6 text-center text-slate-400 text-xs font-mono border border-white/[0.06]">
        No audit events recorded yet.
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl border border-white/[0.08] p-5 shadow-xl">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">
            Immutable Audit Trail & Timeline
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {events.length} {events.length === 1 ? "event" : "events"} recorded
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/[0.08]">
        {events.map((evt) => {
          const badge = getEventBadge(evt.event_type);
          const isMe = evt.actor_id === currentUserId;
          const actorName = getUserName(evt.actor_id);

          return (
            <div key={evt.id} className="relative group">
              {/* Timeline marker icon */}
              <div className="absolute -left-[30px] top-0.5 w-6 h-6 rounded-full bg-slate-900 border border-white/20 flex items-center justify-center group-hover:border-cyan-400 transition-colors">
                {badge.icon}
              </div>

              {/* Event Content card */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${badge.color}`}
                    >
                      {badge.title}
                    </span>
                    <div className="flex items-center space-x-1 text-xs text-slate-300">
                      <UserIcon className="w-3 h-3 text-slate-400" />
                      <span className="font-semibold text-white">{actorName}</span>
                      {isMe && (
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1 rounded">
                          (You)
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400">
                    {formatDate(evt.created_at)}
                  </span>
                </div>

                {/* Metadata details if any */}
                {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                  <div className="mt-2 text-[11px] font-mono text-slate-400 bg-black/40 p-2 rounded-lg border border-white/[0.04]">
                    {Object.entries(evt.metadata).map(([k, v]) => (
                      <div key={k} className="flex items-center space-x-2">
                        <span className="text-slate-500 uppercase">{k}:</span>
                        <span className="text-slate-300">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Blockchain Transaction Hash Anchor */}
                {evt.tx_hash && (
                  <div className="mt-2 flex items-center space-x-2 text-[11px] font-mono">
                    <span className="text-slate-500 flex items-center space-x-1">
                      <Hash className="w-3 h-3 text-cyan-400" />
                      <span>On-Chain Tx:</span>
                    </span>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${evt.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center space-x-1"
                    >
                      <span>{truncate(evt.tx_hash, 10, 8)}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      onClick={() => copyTxHash(evt.tx_hash!)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                      title="Copy transaction hash"
                    >
                      {copiedHash === evt.tx_hash ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
