"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import {
  User,
  AgreementSummary,
  AgreementDetailResponse,
  OnChainStatusResponse,
  getUsers,
  createUser,
  getAgreements,
  getAgreement,
  getOnChainStatus,
  checkHealth,
  getStoredUser,
  getStoredToken,
  clearSession,
  getMe,
} from "@/lib/api";
import { Header } from "@/components/Header";
import { ReceiptCard } from "@/components/ReceiptCard";
import { WhatChangedDiff } from "@/components/WhatChangedDiff";
import { TimelineView } from "@/components/TimelineView";
import { OnChainBadge } from "@/components/OnChainBadge";
import { CreateAgreementModal } from "@/components/CreateAgreementModal";
import { ProposeRevisionModal } from "@/components/ProposeRevisionModal";
import { AuthModal } from "@/components/AuthModal";
import {
  Plus,
  Search,
  RefreshCw,
  FileText,
  Clock,
  Sparkles,
  Layers,
  DollarSign,
  ChevronRight,
  Shield,
  Filter,
  LogIn
} from "lucide-react";

export default function Home() {
  const [, startTransition] = useTransition();

  // Application Data States
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [agreements, setAgreements] = useState<AgreementSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AgreementDetailResponse | null>(null);
  const [onChain, setOnChain] = useState<OnChainStatusResponse | null>(null);

  // UI States
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showRevisionModal, setShowRevisionModal] = useState<boolean>(false);
  const [showDiff, setShowDiff] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Loading & Health States
  const [backendHealthy, setBackendHealthy] = useState<boolean>(true);
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  // Initial Load: Health check, Session restoration, Users, Agreements
  const initApp = useCallback(async () => {
    try {
      const healthy = await checkHealth();
      setBackendHealthy(healthy);

      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);

      // Check stored session
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();

      if (storedToken && storedUser) {
        try {
          const freshUser = await getMe(storedToken);
          setCurrentUser(freshUser);
        } catch {
          setCurrentUser(storedUser);
        }
      } else if (fetchedUsers.length > 0 && !currentUser) {
        // Default to first user for easy exploration if no auth saved
        const alice = fetchedUsers.find((u) => u.username.toLowerCase().includes("alice"));
        setCurrentUser(alice || fetchedUsers[0]);
      }

      const fetchedAgreements = await getAgreements();
      setAgreements(fetchedAgreements);

      if (fetchedAgreements.length > 0 && !selectedId) {
        setSelectedId(fetchedAgreements[0].id);
      }
    } catch (err) {
      console.error("Initialization error:", err);
      setBackendHealthy(false);
    }
  }, [currentUser, selectedId]);

  useEffect(() => {
    initApp();
  }, [initApp]);

  // Load Agreement Details when selected
  const loadDetail = useCallback(async (id: string) => {
    setLoadingDetail(true);
    try {
      const data = await getAgreement(id);
      setDetail(data);

      if (data.versions.length > 1 || data.agreement.status === "RevisionPending") {
        setShowDiff(true);
      } else {
        setShowDiff(false);
      }

      try {
        const onChainData = await getOnChainStatus(id);
        setOnChain(onChainData);
      } catch (e) {
        console.warn("Could not fetch on-chain status:", e);
        setOnChain(null);
      }
    } catch (err) {
      console.error("Error loading agreement detail:", err);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadDetail(selectedId);
    }
  }, [selectedId, loadDetail]);

  // Refresh lists & detail
  const handleRefresh = async () => {
    setLoadingList(true);
    try {
      const fetched = await getAgreements();
      setAgreements(fetched);
      if (selectedId) {
        await loadDetail(selectedId);
      }
    } finally {
      setLoadingList(false);
    }
  };

  // Create User Persona handler
  const handleCreateUser = async (username: string, wallet?: string) => {
    const newUser = await createUser(username, wallet);
    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
  };

  // Handle Logout
  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
  };

  // Filter agreements by status and search query
  const filteredAgreements = agreements.filter((ag) => {
    const matchesFilter =
      statusFilter === "ALL" || ag.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      searchQuery.trim() === "" ||
      ag.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ag.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return "Rp 0";
    return `Rp ${val.toLocaleString("id-ID")}`;
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* Top Navigation Header */}
      <Header
        currentUser={currentUser}
        users={users}
        onSelectUser={(u) => {
          startTransition(() => {
            setCurrentUser(u);
          });
        }}
        onCreateUser={handleCreateUser}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        isBackendHealthy={backendHealthy}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Sidebar & Agreements List (5 cols) */}
          <section className="lg:col-span-5 space-y-4">
            {/* Action Card: Draft Agreement CTA */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/20 shadow-lg shadow-cyan-950/10 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Informal Agreements
                </h2>
                <p className="text-xs text-slate-400">
                  Deterministic states & immutable receipts
                </p>
              </div>
              <button
                onClick={() => {
                  if (!currentUser) {
                    setShowAuthModal(true);
                  } else {
                    setShowCreateModal(true);
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 flex items-center space-x-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Receipt</span>
              </button>
            </div>

            {/* Search and Filters Bar */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search agreements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[11px] font-mono scrollbar-none">
                {["ALL", "Pending", "Active", "RevisionPending", "Completed"].map((filter) => {
                  const active = statusFilter === filter;
                  return (
                    <button
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition ${
                        active
                          ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-semibold"
                          : "bg-slate-900/60 border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {filter === "RevisionPending" ? "Revision" : filter}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Agreements List */}
            <div className="space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {filteredAgreements.length === 0 ? (
                <div className="glass-panel rounded-2xl p-8 text-center border border-white/[0.06]">
                  <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-mono">
                    No matching agreements found.
                  </p>
                  <button
                    onClick={() => {
                      if (!currentUser) setShowAuthModal(true);
                      else setShowCreateModal(true);
                    }}
                    className="mt-3 text-xs text-cyan-400 hover:underline font-semibold"
                  >
                    Draft your first agreement →
                  </button>
                </div>
              ) : (
                filteredAgreements.map((ag) => {
                  const isSelected = ag.id === selectedId;
                  const isCreator = currentUser?.id === ag.creator_id;
                  const isParticipant = currentUser?.id === ag.participant_id;

                  return (
                    <div
                      key={ag.id}
                      onClick={() => setSelectedId(ag.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-slate-800/90 border-cyan-500/50 shadow-lg shadow-cyan-950/30 ring-1 ring-cyan-500/20"
                          : "glass-panel-hover glass-panel border-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="text-sm font-semibold text-white truncate max-w-[240px]">
                          {ag.title}
                        </h3>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            ag.status === "Active"
                              ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
                              : ag.status === "RevisionPending"
                              ? "bg-purple-500/10 text-purple-300 border-purple-500/20"
                              : ag.status === "CompletionPending"
                              ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                              : ag.status === "Completed"
                              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                          }`}
                        >
                          {ag.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono text-slate-400 mt-2">
                        <span className="text-amber-300 font-bold">
                          {formatCurrency(ag.amount)}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-[10px]">
                            v{ag.current_version}
                          </span>
                          {isCreator && (
                            <span className="text-[10px] text-cyan-400">Issuer</span>
                          )}
                          {isParticipant && (
                            <span className="text-[10px] text-indigo-400">Worker</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* RIGHT COLUMN: Detail View, Diff, Timeline (7 cols) */}
          <section className="lg:col-span-7 space-y-6">
            {loadingDetail ? (
              <div className="glass-panel rounded-3xl p-16 text-center border border-white/[0.08] flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-mono text-slate-400">Loading agreement state...</p>
              </div>
            ) : detail ? (
              <div className="space-y-6">
                {/* OnChain state sync banner */}
                <OnChainBadge status={onChain} />

                {/* Digital Receipt Card */}
                <ReceiptCard
                  detail={detail}
                  currentUser={currentUser}
                  users={users}
                  onActionComplete={(updated) => {
                    setDetail(updated);
                    handleRefresh();
                  }}
                  onOpenRevisionModal={() => {
                    if (!currentUser) setShowAuthModal(true);
                    else setShowRevisionModal(true);
                  }}
                  onToggleDiff={() => setShowDiff(!showDiff)}
                  showDiff={showDiff}
                />

                {/* Section 22: What Changed Diff Viewer */}
                {showDiff && (
                  <WhatChangedDiff
                    agreementId={detail.agreement.id}
                    versions={detail.versions}
                  />
                )}

                {/* Audit Timeline */}
                <TimelineView
                  events={detail.events}
                  users={users}
                  currentUserId={currentUser?.id}
                />
              </div>
            ) : (
              <div className="glass-panel rounded-3xl p-12 text-center border border-white/[0.08]">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-2xl mx-auto mb-4">
                  📜
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  Select an Agreement Receipt
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
                  Select a digital agreement from the list on the left, or create a new agreement to experience the deterministic state machine.
                </p>
                <button
                  onClick={() => {
                    if (!currentUser) setShowAuthModal(true);
                    else setShowCreateModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20"
                >
                  Create New Agreement
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Authentication Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={(user) => {
            setCurrentUser(user);
            handleRefresh();
          }}
          demoUsers={users}
          onSelectDemoUser={(user) => {
            setCurrentUser(user);
            handleRefresh();
          }}
        />
      )}

      {/* Create Agreement Modal */}
      {showCreateModal && currentUser && (
        <CreateAgreementModal
          currentUser={currentUser}
          users={users}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newAgreement) => {
            setSelectedId(newAgreement.agreement.id);
            handleRefresh();
          }}
        />
      )}

      {/* Propose Revision Modal */}
      {showRevisionModal && detail && currentUser && (
        <ProposeRevisionModal
          agreementId={detail.agreement.id}
          currentVersion={detail.current_version_detail}
          currentUser={currentUser}
          onClose={() => setShowRevisionModal(false)}
          onSuccess={(updated) => {
            setDetail(updated);
            setShowDiff(true);
            handleRefresh();
          }}
        />
      )}
    </div>
  );
}
