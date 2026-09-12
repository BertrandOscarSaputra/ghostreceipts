"use client";

import React, { useState } from "react";
import { User, AgreementVersion, proposeRevision, AgreementDetailResponse } from "@/lib/api";
import { X, GitPullRequest, DollarSign, Calendar, AlertCircle, Loader2, Info } from "lucide-react";

interface ProposeRevisionModalProps {
  agreementId: string;
  currentVersion: AgreementVersion;
  currentUser: User;
  onClose: () => void;
  onSuccess: (updated: AgreementDetailResponse) => void;
}

export const ProposeRevisionModal: React.FC<ProposeRevisionModalProps> = ({
  agreementId,
  currentVersion,
  currentUser,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState(currentVersion.title);
  const [description, setDescription] = useState(currentVersion.description || "");
  const [amount, setAmount] = useState<string>(
    currentVersion.amount !== undefined && currentVersion.amount !== null
      ? currentVersion.amount.toString()
      : ""
  );
  const [deadline, setDeadline] = useState(
    currentVersion.deadline ? currentVersion.deadline.split("T")[0] : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const parsedAmount = amount ? parseFloat(amount) : undefined;
      const res = await proposeRevision(agreementId, {
        actor_id: currentUser.id,
        title: title.trim(),
        description: description.trim() || undefined,
        amount: parsedAmount,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
      });
      onSuccess(res);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to propose revision";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="glass-panel w-full max-w-xl rounded-2xl shadow-2xl border border-purple-500/20 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-indigo-950/40 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <GitPullRequest className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Propose Revision (Version {currentVersion.version_number + 1})
              </h3>
              <p className="text-xs text-slate-400">
                Proposer: <span className="text-purple-300 font-semibold">{currentUser.username}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Banner */}
        <div className="mx-6 mt-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-start space-x-2.5 text-xs text-purple-200/90 leading-relaxed">
          <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-purple-300">Mutual Consent Protocol: </span>
            Submitting this revision will lock the contract in{" "}
            <span className="font-mono text-purple-200 font-semibold">RevisionPending</span> state.
            Under smart contract invariant rules, you cannot approve your own proposal; the counterparty must review and sign off.
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1">
              Revised Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-400 transition"
            />
          </div>

          {/* Amount & Deadline Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1 flex items-center space-x-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                <span>Revised Amount (IDR Rp)</span>
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-amber-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>Revised Deadline</span>
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-cyan-400 cursor-pointer transition"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1">
              Revised Scope of Work & Rationale
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white text-xs leading-relaxed focus:outline-none focus:border-purple-400 font-mono transition"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting Proposal...</span>
                </>
              ) : (
                <span>Submit Version {currentVersion.version_number + 1} Proposal</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
