"use client";

import React, { useState } from "react";
import { OnChainStatusResponse } from "@/lib/api";
import { ShieldCheck, Copy, Check, ExternalLink, ChevronDown, ChevronUp, Cpu, Hash } from "lucide-react";

interface OnChainBadgeProps {
  status: OnChainStatusResponse | null;
  loading?: boolean;
}

export const OnChainBadge: React.FC<OnChainBadgeProps> = ({ status, loading = false }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-4 animate-pulse flex items-center justify-between border border-cyan-500/20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-cyan-400 animate-spin" />
          </div>
          <div className="h-4 w-40 bg-slate-800 rounded"></div>
        </div>
        <div className="h-4 w-24 bg-slate-800 rounded"></div>
      </div>
    );
  }

  if (!status) return null;

  const truncate = (str: string, lead = 10, tail = 8) => {
    if (!str || str.length <= lead + tail) return str;
    return `${str.substring(0, lead)}...${str.substring(str.length - tail)}`;
  };

  return (
    <div className="glass-panel rounded-2xl border border-cyan-500/20 overflow-hidden shadow-lg shadow-cyan-950/20 transition-all">
      {/* Header bar */}
      <div 
        onClick={() => setExpanded(!expanded)}
        className="px-4 py-3 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-indigo-950/40 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                EVM Neutral State Coordination
              </span>
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Synchronized</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              ID: {truncate(status.on_chain_id, 12, 8)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="hidden sm:inline-block text-xs font-mono text-slate-400">
            {status.network}
          </span>
          <button 
            type="button" 
            className="p-1 rounded-md text-slate-400 hover:text-white"
            aria-label="Toggle details"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable details panel */}
      {expanded && (
        <div className="p-4 border-t border-white/[0.06] bg-slate-950/60 space-y-3.5 text-xs font-mono">
          {/* Deterministic Hash */}
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
              Deterministic Keccak-256 Agreement Hash (bytes32)
            </span>
            <div className="flex items-center justify-between bg-black/50 px-3 py-2 rounded-xl border border-white/[0.08]">
              <span className="text-cyan-300 break-all select-all font-mono text-[11px]">
                {status.on_chain_id}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(status.on_chain_id, "id");
                }}
                className="ml-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="Copy bytes32 ID"
              >
                {copiedField === "id" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Smart Contract Address */}
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
              GhostReceipt Smart Contract
            </span>
            <div className="flex items-center justify-between bg-black/50 px-3 py-2 rounded-xl border border-white/[0.08]">
              <span className="text-indigo-300 break-all select-all font-mono text-[11px]">
                {status.contract_address}
              </span>
              <div className="flex items-center space-x-1 ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(status.contract_address, "contract");
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  title="Copy contract address"
                >
                  {copiedField === "contract" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={`https://sepolia.etherscan.io/address/${status.contract_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 transition"
                  title="View on Etherscan"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* On-chain transactions log */}
          {status.transactions && status.transactions.length > 0 && (
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                Synced Blockchain Transactions ({status.transactions.length})
              </span>
              <div className="space-y-1.5">
                {status.transactions.map((tx, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900/70 border border-white/[0.05]"
                  >
                    <div className="flex items-center space-x-2">
                      <Hash className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="text-slate-300 font-semibold">{tx.event_type}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a
                        href={`https://sepolia.etherscan.io/tx/${tx.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:underline flex items-center space-x-1"
                      >
                        <span>{truncate(tx.tx_hash, 8, 6)}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
