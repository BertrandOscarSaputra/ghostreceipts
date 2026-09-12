"use client";

import React, { useState } from "react";
import { User, createAgreement, AgreementDetailResponse } from "@/lib/api";
import { X, FilePlus2, DollarSign, Calendar, Users, AlertCircle, Loader2 } from "lucide-react";

interface CreateAgreementModalProps {
  currentUser: User;
  users: User[];
  onClose: () => void;
  onSuccess: (newAgreement: AgreementDetailResponse) => void;
}

export const CreateAgreementModal: React.FC<CreateAgreementModalProps> = ({
  currentUser,
  users,
  onClose,
  onSuccess,
}) => {
  const potentialCounterparties = users.filter((u) => u.id !== currentUser.id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<string>("15000000");
  const [deadline, setDeadline] = useState("");
  const [participantId, setParticipantId] = useState(
    potentialCounterparties.length > 0 ? potentialCounterparties[0].id : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!participantId) {
      setError("Please select a counterparty");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const parsedAmount = amount ? parseFloat(amount) : undefined;
      const res = await createAgreement({
        creator_id: currentUser.id,
        participant_id: participantId,
        title: title.trim(),
        description: description.trim() || undefined,
        amount: parsedAmount,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
      });
      onSuccess(res);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create agreement";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="glass-panel w-full max-w-xl rounded-2xl shadow-2xl border border-cyan-500/20 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-indigo-950/40 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
              <FilePlus2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Draft New Digital Receipt
              </h3>
              <p className="text-xs text-slate-400">
                Created by <span className="text-cyan-400 font-semibold">{currentUser.username}</span>
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
              Agreement Title / Project *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Full-Stack MVP Web App Development"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 placeholder:text-slate-600 transition"
            />
          </div>

          {/* Counterparty selector */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1 flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Counterparty (Participant) *</span>
            </label>
            {potentialCounterparties.length === 0 ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                No other user personas found. Please create a counterparty persona first using the + button in the header.
              </div>
            ) : (
              <select
                value={participantId}
                onChange={(e) => setParticipantId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-400 cursor-pointer"
              >
                {potentialCounterparties.map((u) => (
                  <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                    {u.username} ({u.wallet_address ? `${u.wallet_address.substring(0, 10)}...` : "Off-chain ID"})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Amount & Deadline Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1 flex items-center space-x-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                <span>Amount (IDR Rp)</span>
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                placeholder="15000000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-amber-400 placeholder:text-slate-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>Target Deadline</span>
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
              Scope of Work & Terms
            </label>
            <textarea
              rows={4}
              placeholder="Detail deliverables, milestones, payment terms, revisions, and responsibilities..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white text-xs leading-relaxed focus:outline-none focus:border-cyan-400 placeholder:text-slate-600 font-mono transition"
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
              disabled={loading || potentialCounterparties.length === 0}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Issuing Digital Receipt...</span>
                </>
              ) : (
                <span>Issue Digital Receipt</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
