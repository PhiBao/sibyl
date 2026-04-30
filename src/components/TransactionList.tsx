"use client";

interface Transaction {
  buyer: string;
  provider: string;
  serviceId: number;
  amount: number;
  success: boolean;
  timestamp: number;
  scoreChange: number;
  x402Authorized: boolean;
  date: string;
  time: string;
}

export default function TransactionList({ transactions, isLoading }: { transactions: Transaction[]; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="terminal-panel p-4 animate-pulse">
            <div className="h-4 bg-white/5 w-1/3 mb-2" />
            <div className="h-3 bg-white/5 w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="terminal-panel p-8 text-center">
        <p className="text-neon-green text-lg mb-2 font-bold">[ NO_DATA ]</p>
        <p className="text-text-secondary text-sm">No onchain agent transactions recorded.</p>
        <p className="text-text-tertiary text-xs mt-1">Request an agent service to generate x402 attestation.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {transactions.map((tx, i) => (
        <div
          key={i}
          className="terminal-panel p-3 flex items-center justify-between hover:border-neon-green/30 transition-all fade-in"
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-7 h-7 border flex items-center justify-center text-xs shrink-0 font-bold ${
                tx.success
                  ? "border-neon-green/40 text-neon-green bg-neon-green/10"
                  : "border-danger/40 text-danger bg-danger/10"
              }`}
            >
              {tx.success ? "✓" : "✕"}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-bold truncate text-text-primary">
                {tx.success ? "X402_SETTLED" : "SETTLEMENT_FAIL"}
              </p>
              <p className="text-[10px] text-text-tertiary font-mono truncate">
                SVC#{tx.serviceId} :: {tx.provider.slice(0, 6)}...{tx.provider.slice(-4)} :: {tx.date} {tx.time}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0 ml-3">
            <p className="text-[13px] font-mono font-bold text-neon-cyan">${tx.amount.toFixed(2)}</p>
            <p className={`text-[10px] font-bold ${tx.scoreChange >= 0 ? "text-neon-green" : "text-danger"}`}>
              {tx.scoreChange >= 0 ? "+" : ""}{tx.scoreChange} PTS
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
