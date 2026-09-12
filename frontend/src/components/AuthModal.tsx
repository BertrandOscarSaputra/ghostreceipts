"use client";

import React, { useState } from "react";
import { User, login, register } from "@/lib/api";
import {
  X,
  Lock,
  User as UserIcon,
  Mail,
  AlertCircle,
  Loader2,
  Sparkles,
  Zap,
  ArrowRight
} from "lucide-react";

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: User) => void;
  demoUsers?: User[];
  onSelectDemoUser?: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onClose,
  onSuccess,
  demoUsers = [],
  onSelectDemoUser,
}) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [identifier, setIdentifier] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "login") {
        if (!identifier.trim() || !password) {
          setError("Please enter your username/email and password");
          setLoading(false);
          return;
        }
        const res = await login(identifier.trim(), password);
        onSuccess(res.user);
        onClose();
      } else {
        if (!username.trim() || !password) {
          setError("Please fill in all required fields");
          setLoading(false);
          return;
        }
        if (username.trim().length < 3) {
          setError("Username must be at least 3 characters");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters");
          setLoading(false);
          return;
        }
        const res = await register(username.trim(), password, email.trim() || undefined);
        onSuccess(res.user);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (demoUser: User) => {
    if (onSelectDemoUser) {
      onSelectDemoUser(demoUser);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="glass-panel w-full max-w-md rounded-2xl shadow-2xl border border-cyan-500/20 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-sm">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {mode === "login" ? "Sign In to GhostReceipt" : "Create Account"}
              </h3>
              <p className="text-xs text-slate-400">
                Verifiable digital receipts for informal work
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

        {/* Tab switch */}
        <div className="flex border-b border-white/[0.08] bg-slate-950/60 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              mode === "login"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              mode === "register"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            New Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === "login" ? (
            <>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1">
                  Username or Email
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. alice or user@example.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1">
                  Username *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. charlie_dev"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1">
                  Email Address (Optional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    placeholder="charlie@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1">
                  Password (min 6 characters) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center space-x-2 transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>{mode === "login" ? "Sign In" : "Create Account & Sign In"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Access for Judges/Reviewers */}
        {demoUsers.length > 0 && (
          <div className="px-6 py-4 bg-slate-950/80 border-t border-white/[0.08] space-y-2.5">
            <div className="flex items-center space-x-1.5 text-[11px] font-mono text-slate-400">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Demo Access (1-Click for Evaluation):</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoUsers.slice(0, 2).map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleQuickDemoLogin(user)}
                  className="p-2 rounded-xl bg-slate-900 border border-white/10 hover:border-cyan-500/40 text-left transition flex items-center space-x-2"
                >
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                    {user.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-semibold text-white block truncate">
                      {user.username}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Demo Persona
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
