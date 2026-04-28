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
    <div className="glass rounded-2xl overflow-hidden fade-in" style={{ animationDelay: "0.4s" }}>
      <div className="px-6 py-4 border-b border-white/5">
        <h3 className="text-lg font-semibold">Recent Transactions</h3>
        <p className="text-text-secondary text-sm">Live on-chain activity</p>
      </div>
      <div className="divide-y divide-white/5">
        {transactions.map((tx, i) => (
          <div
            key={tx.id}
            className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors fade-in"
            style={{ animationDelay: `${0.5 + i * 0.05}s` }}
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                tx.status === "success" ? "bg-pulse-green/10" : "bg-danger/10"
              }`}>
                {tx.status === "success" ? "✓" : "✗"}
              </div>
              <div>
                <p className="text-sm font-medium">{tx.service}</p>
                <p className="text-xs text-text-tertiary">{tx.type} · {new Date(tx.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono">${tx.amount.toFixed(3)}</p>
              <p className={`text-xs font-medium ${
                tx.scoreChange >= 0 ? "text-pulse-green" : "text-danger"
              }`}>
                {tx.scoreChange >= 0 ? "+" : ""}{tx.scoreChange} pts
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
