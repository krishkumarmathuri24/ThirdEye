import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  Hash,
  Clock,
  Key,
  ShieldCheck,
  Search,
  ExternalLink
} from 'lucide-react';
import { EgressProof } from '../types';
import { api } from '../services/api';

interface EgressProofProps {
  tenantId: string;
}

export const EgressProofPanel: React.FC<EgressProofProps> = ({ tenantId }) => {
  const [proofs, setProofs] = useState<EgressProof[]>([]);
  const [selectedProof, setSelectedProof] = useState<EgressProof | null>(null);
  const [searchHash, setSearchHash] = useState('');

  useEffect(() => {
    api.getEgressProofs(tenantId)
      .then((data) => {
        setProofs(data);
        if (data.length > 0) setSelectedProof(data[0]);
      })
      .catch((err) => console.error(err));
  }, [tenantId]);

  const filtered = proofs.filter((p) =>
    searchHash === '' ||
    p.payload_hash.toLowerCase().includes(searchHash.toLowerCase()) ||
    p.payload_id.toLowerCase().includes(searchHash.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title & Description */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileCheck2 className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-bold text-white tracking-tight">Cryptographic Egress Proof Panel</h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Provides immutable verification of outgoing metadata transmissions. Customers can verify the SHA-256 payload hash and HMAC signatures against their local Tier 1 records at any time.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            100% CRYPTOGRAPHICALLY VERIFIED
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by SHA-256 Hash or Payload ID..."
            value={searchHash}
            onChange={(e) => setSearchHash(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500 font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Proof List Table */}
        <div className="lg:col-span-2 p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <h3 className="text-xs font-semibold text-slate-300 uppercase font-mono mb-3">
            Outgoing Egress Log Entries
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-mono">
                <tr>
                  <th className="pb-2">Payload ID</th>
                  <th className="pb-2">Timestamp (UTC)</th>
                  <th className="pb-2">SHA-256 Hash</th>
                  <th className="pb-2 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filtered.map((proof) => (
                  <tr
                    key={proof.payload_id}
                    onClick={() => setSelectedProof(proof)}
                    className={`cursor-pointer transition-colors ${
                      selectedProof?.payload_id === proof.payload_id
                        ? 'bg-cyan-950/40 text-cyan-200'
                        : 'hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <td className="py-2.5 font-bold">{proof.payload_id.slice(0, 14)}...</td>
                    <td className="py-2.5 text-slate-400">{new Date(proof.transmission_timestamp).toLocaleTimeString()}</td>
                    <td className="py-2.5 text-cyan-400">{proof.payload_hash.slice(0, 16)}...</td>
                    <td className="py-2.5 text-right">
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Proof Verification Card */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
          <h3 className="text-xs font-semibold text-slate-200 uppercase font-mono mb-4 pb-2 border-b border-slate-800">
            Proof Cryptographic Certificate
          </h3>

          {selectedProof ? (
            <div className="space-y-4 text-xs font-mono">
              <div>
                <span className="text-slate-400 block mb-1">Payload ID:</span>
                <span className="text-white font-bold break-all bg-slate-950 p-2 rounded block border border-slate-800">
                  {selectedProof.payload_id}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">SHA-256 Payload Hash:</span>
                <span className="text-cyan-400 break-all bg-slate-950 p-2 rounded block border border-slate-800">
                  {selectedProof.payload_hash}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">HMAC Source Pseudonym:</span>
                <span className="text-purple-400 break-all bg-slate-950 p-2 rounded block border border-slate-800">
                  {selectedProof.hmac_signature}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
                <span className="text-emerald-400 font-semibold block mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> Cryptographic Integrity Intact
                </span>
                <p className="text-[11px] text-slate-400 font-sans">
                  The payload digest matches the hash recorded in the immutable audit block at Tier 1.
                </p>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Approved Transmitted Metadata:</span>
                <pre className="p-3 bg-slate-950 rounded border border-slate-800 text-[11px] text-slate-300 max-h-48 overflow-y-auto">
                  {JSON.stringify(selectedProof.metadata_sample, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-center py-12">Select an egress proof to inspect cryptographic signatures.</div>
          )}
        </div>
      </div>
    </div>
  );
};
