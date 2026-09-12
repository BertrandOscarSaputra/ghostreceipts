"use client";

import React, { useState } from "react";
import { User } from "@/lib/api";
import { ShieldCheck, UserCircle, Plus, LogIn, LogOut, ChevronDown } from "lucide-react";

interface HeaderProps {
  currentUser: User | null;
  users: User[];
  onSelectUser: (user: User) => void;
  onCreateUser: (username: string, wallet?: string) => Promise<void>;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  isBackendHealthy: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  users,
  onSelectUser,
  onCreateUser,
  onOpenAuthModal,
  onLogout,
  isBackendHealthy,
}) => {
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [showSwitchDropdown, setShowSwitchDropdown] = useState(false);
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
                Auth
              </span>
            </div>
            <p className="text-xs text-slate-400">Verifiable Informal Agreements</p>
          </div>
        </div>

        {/* Right Controls: Network, Backend Status, User Switcher / Auth */}
        <div className="flex items-center space-x-3 sm:space-x-4">
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

          {/* Auth Controls */}
          {currentUser ? (
            <div className="relative flex items-center space-x-2 bg-slate-900/90 p-1.5 rounded-xl border border-white/[0.08]">
              {/* Active User Avatar & Name */}
              <div 
                onClick={() => setShowSwitchDropdown(!showSwitchDropdown)}
                className="flex items-center space-x-2 pl-1 pr-2 cursor-pointer hover:opacity-80 transition"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-xs font-mono font-bold text-white shadow-sm">
                  {currentUser.username.substring(0, 2).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <span className="text-xs font-semibold text-white block leading-tight truncate max-w-[100px]">
                    {currentUser.username}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block leading-none">
                    Signed in
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>

              {/* Log Out button */}
              <button
                onClick={onLogout}
                title="Log Out"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>

              {/* Switch persona dropdown */}
              {showSwitchDropdown && (
                <div className="absolute right-0 top-12 w-56 rounded-xl bg-slate-900 border border-white/10 shadow-2xl p-2 z-50">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-2 py-1">
                    Quick Persona Switch (Demo)
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto mt-1">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          onSelectUser(u);
                          setShowSwitchDropdown(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                          u.id === currentUser.id
                            ? "bg-cyan-500/20 text-cyan-300 font-semibold"
                            : "text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <span className="truncate">{u.username}</span>
                        {u.id === currentUser.id && (
                          <span className="text-[10px] font-mono text-cyan-400">Active</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="pt-2 mt-2 border-t border-white/[0.08] flex items-center justify-between px-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSwitchDropdown(false);
                        setShowNewUserModal(true);
                      }}
                      className="text-[11px] text-indigo-400 hover:underline flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Persona</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSwitchDropdown(false);
                        onOpenAuthModal();
                      }}
                      className="text-[11px] text-cyan-400 hover:underline"
                    >
                      Switch Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 flex items-center space-x-1.5 transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
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
