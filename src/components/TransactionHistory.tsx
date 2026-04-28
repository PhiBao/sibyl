"use client";

interface Transaction {
  id: number;
  type: string;
  service: string;
  amount: number;
  status: string;
  timestamp: string;
  scoreChange: number;
}

export default function TransactionHistory({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="glass rounded-2xl overflow-hidden fade-in" style={{ animationDelay: "0.3s" }}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-semibold">Recent Transactions</h3>
          <p className="text-[12px] text-text-tertiary mt-0.5">Live on-chain activity</p>
        </div>
        <span className="text-[11px] text-text-tertiary bg-white/[0.04] px-2 py-1 rounded">Last 24h</span>
      </div>

      {/* List */}
      <div className="divide-y divide-white/[0.03]">
        {transactions.map((tx, i) => (
          <div
            key={tx.id}
            className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer fade-in"
            style={{ animationDelay: `${0.4 + i * 0.04}s` }}
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium ${
                tx.status === "success"
                  ? "bg-pulse-green/10 text-pulse-green"
                  : "bg-danger/10 text-danger"
              }`}>
                {tx.status === "success" ? "✓" : "✗"}
              </div>
              <div>
                <p className="text-[13px] font-medium">{tx.service}</p>
                <p className="text-[11px] text-text-tertiary mt-0.5">
                  {tx.type} · {new Date(tx.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[13px] font-mono font-medium">${tx.amount.toFixed(3)}</p>
              <p className={`text-[11px] font-medium mt-0.5 ${
                tx.scoreChange >= 0 ? "text-pulse-green" : "text-danger"
              }`}>
                {tx.scoreChange >= 0 ? "+" : ""}{tx.scoreChange} pts
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/[0.04] text-center">
        <button className="text-[12px] text-text-tertiary hover:text-text-secondary transition-colors">
          View All Transactions →
        </button>
      </div>
    </div>
  );
}
