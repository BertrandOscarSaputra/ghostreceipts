"use client";

import React, { useState } from "react";
import { User } from "@/lib/api";
import { ShieldCheck, UserCircle, Plus, Activity } from "lucide-react";

interface HeaderProps {
  currentUser: User | null;
  users: User[];
  onSelectUser: (user: User) => void;
  onCreateUser: (username: string, wallet?: string) => Promise<void>;
  isBackendHealthy: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  users,
  onSelectUser,
  onCreateUser,
  isBackendHealthy,
}) => {
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newWallet, setNewWallet] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    await onCreateUser(newUsername.trim(), newWallet.trim() || undefined);
    setNewUsername("");
    setNewWallet("");
    setShowNewUserModal(false);
  };

  return (
    <header className="border-b border-white/[0.08] bg-[#07090e]/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-cyan-500/20">
            👻
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">GhostReceipt</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Phase 3
              </span>
            </div>
            <p className="text-xs text-slate-400">Verifiable Informal Agreements</p>
          </div>
        </div>

        {/* Right Controls: Network, Backend Status, User Switcher */}
        <div className="flex items-center space-x-4">
          {/* Network Badge */}
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700/60 text-xs font-mono text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sepolia Testnet</span>
          </div>

          {/* Backend Health indicator */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700/60 text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendHealthy ? "bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" : "bg-rose-500"
              }`}
            />
            <span className={isBackendHealthy ? "text-emerald-400" : "text-rose-400"}>
              {isBackendHealthy ? "Backend Live" : "Offline"}
            </span>
          </div>

          {/* Active User Switcher */}
          <div className="relative flex items-center space-x-2 bg-slate-900/80 p-1.5 rounded-xl border border-white/[0.08]">
            <UserCircle className="w-5 h-5 text-indigo-400 ml-1" />
            <select
              className="bg-transparent text-sm font-medium text-white focus:outline-none cursor-pointer pr-4"
              value={currentUser?.id || ""}
              onChange={(e) => {
                const user = users.find((u) => u.id === e.target.value);
                if (user) onSelectUser(user);
              }}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                  {u.username}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowNewUserModal(true)}
              title="Add New User"
              className="p-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/60 text-indigo-300 border border-indigo-500/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* New User Modal */}
      {showNewUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl border border-white/10">
            <h3 className="text-lg font-bold text-white mb-1">Create User Persona</h3>
            <p className="text-xs text-slate-400 mb-4">
              Add a party (e.g. Freelancer or Client) to simulate agreement workflows.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. charlie_dev"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Wallet Address (Optional)</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={newWallet}
                  onChange={(e) => setNewWallet(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-white/10 text-white text-sm font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewUserModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-cyan-500/20 transition"
                >
                  Create Persona
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
