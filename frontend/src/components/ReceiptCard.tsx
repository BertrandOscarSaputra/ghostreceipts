"use client";

import React, { useState } from "react";
import {
  AgreementDetailResponse,
  User,
  acceptAgreement,
  rejectAgreement,
  acceptRevision,
  rejectRevision,
  requestCompletion,
  confirmCompletion,
} from "@/lib/api";
import {
  CheckCircle2,
  XCircle,
  GitPullRequest,
  Flag,
  Award,
  Calendar,
  DollarSign,
  User as UserIcon,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Barcode,
  Layers
} from "lucide-react";

interface ReceiptCardProps {
  detail: AgreementDetailResponse;
  currentUser: User | null;
  users: User[];
  onActionComplete: (updated: AgreementDetailResponse) => void;
  onOpenRevisionModal: () => void;
  onToggleDiff: () => void;
  showDiff: boolean;
}

export const ReceiptCard: React.FC<ReceiptCardProps> = ({
  detail,
  currentUser,
  users,
  onActionComplete,
  onOpenRevisionModal,
  onToggleDiff,
  showDiff,
}) => {
  const { agreement, current_version_detail: version, versions, events } = detail;
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isCreator = currentUser?.id === agreement.creator_id;
  const isParticipant = currentUser?.id === agreement.participant_id;
  const isParty = isCreator || isParticipant;

  const creatorUser = users.find((u) => u.id === agreement.creator_id);
  const participantUser = users.find((u) => u.id === agreement.participant_id);

  // Find who proposed the pending revision or completion request
  const revisionProposer = version.created_by;
  const isRevisionProposer = currentUser?.id === revisionProposer;

  const completionEvent = events.find((e) => e.event_type === "CompletionRequested");
  const completionRequester = completionEvent?.actor_id;
  const isCompletionRequester = currentUser?.id === completionRequester;

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "Rp 0";
    return `Rp ${val.toLocaleString("id-ID")}`;
  };

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return "No deadline set";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const executeAction = async (actionName: string, fn: () => Promise<AgreementDetailResponse>) => {
    if (!currentUser) return;
    setActionLoading(actionName);
    setActionError(null);
    try {
      const res = await fn();
      onActionComplete(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Action failed";
      setActionError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return {
          label: "Pending Acceptance",
          style: "bg-amber-500/10 text-amber-300 border-amber-500/30",
          dot: "bg-amber-400",
        };
      case "Active":
        return {
          label: "Active Contract",
          style: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
          dot: "bg-cyan-400",
        };
      case "RevisionPending":
        return {
          label: "Revision Pending",
          style: "bg-purple-500/10 text-purple-300 border-purple-500/30",
          dot: "bg-purple-400",
        };
      case "CompletionPending":
        return {
          label: "Completion Pending",
          style: "bg-amber-500/10 text-amber-300 border-amber-500/30",
          dot: "bg-amber-400",
        };
      case "Completed":
        return {
          label: "Completed & Verified",
          style: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
          dot: "bg-emerald-400",
        };
      case "Rejected":
        return {
          label: "Declined",
          style: "bg-rose-500/10 text-rose-300 border-rose-500/30",
          dot: "bg-rose-400",
        };
      default:
        return {
          label: status,
          style: "bg-slate-800 text-slate-300 border-white/10",
          dot: "bg-slate-400",
        };
    }
  };

  const statusBadge = getStatusBadge(agreement.status);

  return (
    <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative">
      {/* Top jagged receipt header bar */}
      <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 border-b border-white/[0.08]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-2.5">
            <Barcode className="w-6 h-6 text-slate-400" />
            <span className="font-mono text-xs text-slate-400 uppercase tracking-widest">
              GHOST-REC-{agreement.id.substring(0, 8)}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Version Pill */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-white/10 text-xs font-mono text-slate-300">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Version {agreement.current_version}</span>
            </div>

            {/* Status Pill */}
            <div
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border ${statusBadge.style}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusBadge.dot} animate-pulse`} />
              <span>{statusBadge.label}</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
          {version.title}
        </h2>

        {/* Amount & Deadline Banner */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-black/40 border border-white/[0.06]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Agreed Compensation
              </span>
              <span className="text-lg sm:text-xl font-bold font-mono text-amber-300">
                {formatCurrency(version.amount)}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Target Deadline
              </span>
              <span className="text-sm sm:text-base font-semibold font-mono text-cyan-200">
                {formatDate(version.deadline)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Parties Representation */}
      <div className="p-6 border-b border-white/[0.08] bg-slate-950/40">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-3">
          Signatory Counterparties
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Creator */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isCreator
                ? "bg-cyan-950/20 border-cyan-500/30 text-white"
                : "bg-slate-900/40 border-white/[0.05] text-slate-300"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 text-xs font-bold font-mono">
                {creatorUser ? creatorUser.username.substring(0, 2).toUpperCase() : "CR"}
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 block">
                  Creator (Client/Issuer)
                </span>
                <span className="text-sm font-semibold">
                  {creatorUser?.username || "Unknown"}
                  {isCreator && (
                    <span className="ml-2 text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded">
                      You
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Participant */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isParticipant
                ? "bg-indigo-950/20 border-indigo-500/30 text-white"
                : "bg-slate-900/40 border-white/[0.05] text-slate-300"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 text-xs font-bold font-mono">
                {participantUser ? participantUser.username.substring(0, 2).toUpperCase() : "PA"}
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 block">
                  Participant (Worker)
                </span>
                <span className="text-sm font-semibold">
                  {participantUser?.username || "Unknown"}
                  {isParticipant && (
                    <span className="ml-2 text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">
                      You
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scope of Work */}
      <div className="p-6 border-b border-white/[0.08]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Scope of Work & Specification
          </span>
          {versions.length > 1 && (
            <button
              onClick={onToggleDiff}
              className="text-xs font-mono text-purple-400 hover:text-purple-300 flex items-center space-x-1 underline"
            >
              <span>{showDiff ? "Hide What Changed?" : "Inspect What Changed?"}</span>
            </button>
          )}
        </div>
        <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
          {version.description || "(No description provided for this version)"}
        </div>
      </div>

      {/* Perforated Dotted Divider Line */}
      <div className="border-b-2 border-dashed border-white/20 relative my-0.5">
        <div className="absolute -left-3 -top-2.5 w-5 h-5 rounded-full bg-[#07090e]"></div>
        <div className="absolute -right-3 -top-2.5 w-5 h-5 rounded-full bg-[#07090e]"></div>
      </div>

      {/* Lifecycle Action Center */}
      <div className="p-6 bg-slate-950/70">
        {actionError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* State Machine Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status-specific Guidance */}
          <div className="text-xs text-slate-400 font-mono">
            {agreement.status === "Pending" && (
              isParticipant
                ? "You are requested to accept or decline this digital agreement."
                : isCreator
                ? "Waiting for participant to review and sign."
                : "Awaiting counterparty acceptance."
            )}
            {agreement.status === "Active" && (
              isParty
                ? "Agreement is active. You can propose revisions or request completion when work is delivered."
                : "Active agreement."
            )}
            {agreement.status === "RevisionPending" && (
              isRevisionProposer
                ? `Revision v${version.version_number} was proposed by you. Counterparty must accept.`
                : isParty
                ? `Revision v${version.version_number} is awaiting your approval.`
                : "Revision under review."
            )}
            {agreement.status === "CompletionPending" && (
              isCompletionRequester
                ? "Completion requested by you. Waiting for counterparty confirmation."
                : isParty
                ? "Completion requested! Confirm to finalize this agreement."
                : "Completion confirmation pending."
            )}
            {agreement.status === "Completed" && (
              <span className="text-emerald-400 flex items-center space-x-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Agreement finalized and immutably settled on-chain.</span>
              </span>
            )}
            {agreement.status === "Rejected" && (
              <span className="text-rose-400">Agreement was declined.</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* When Pending: Participant can Accept or Reject */}
            {agreement.status === "Pending" && isParticipant && (
              <>
                <button
                  disabled={!!actionLoading}
                  onClick={() =>
                    executeAction("reject", () => rejectAgreement(agreement.id, currentUser!.id))
                  }
                  className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
                >
                  {actionLoading === "reject" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  <span>Decline</span>
                </button>

                <button
                  disabled={!!actionLoading}
                  onClick={() =>
                    executeAction("accept", () => acceptAgreement(agreement.id, currentUser!.id))
                  }
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5 transition disabled:opacity-50"
                >
                  {actionLoading === "accept" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Accept Agreement</span>
                </button>
              </>
            )}

            {/* When Active: Propose Revision or Request Completion */}
            {agreement.status === "Active" && isParty && (
              <>
                <button
                  onClick={onOpenRevisionModal}
                  className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  <GitPullRequest className="w-3.5 h-3.5" />
                  <span>Propose Revision</span>
                </button>

                <button
                  disabled={!!actionLoading}
                  onClick={() =>
                    executeAction("completion", () =>
                      requestCompletion(agreement.id, currentUser!.id)
                    )
                  }
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 flex items-center space-x-1.5 transition disabled:opacity-50"
                >
                  {actionLoading === "completion" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Flag className="w-3.5 h-3.5" />
                  )}
                  <span>Request Completion</span>
                </button>
              </>
            )}

            {/* When RevisionPending: Counterparty can Accept or Reject Revision */}
            {agreement.status === "RevisionPending" && isParty && !isRevisionProposer && (
              <>
                <button
                  disabled={!!actionLoading}
                  onClick={() =>
                    executeAction("rejectRevision", () =>
                      rejectRevision(agreement.id, version.version_number, currentUser!.id)
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
                >
                  {actionLoading === "rejectRevision" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  <span>Decline Revision</span>
                </button>

                <button
                  disabled={!!actionLoading}
                  onClick={() =>
                    executeAction("acceptRevision", () =>
                      acceptRevision(agreement.id, version.version_number, currentUser!.id)
                    )
                  }
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-500/20 flex items-center space-x-1.5 transition disabled:opacity-50"
                >
                  {actionLoading === "acceptRevision" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Ratify Revision v{version.version_number}</span>
                </button>
              </>
            )}

            {/* When CompletionPending: Counterparty can Confirm Completion */}
            {agreement.status === "CompletionPending" && isParty && !isCompletionRequester && (
              <button
                disabled={!!actionLoading}
                onClick={() =>
                  executeAction("confirmCompletion", () =>
                    confirmCompletion(agreement.id, currentUser!.id)
                  )
                }
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5 transition disabled:opacity-50"
              >
                {actionLoading === "confirmCompletion" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Award className="w-3.5 h-3.5" />
                )}
                <span>Confirm & Finalize Completion</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
