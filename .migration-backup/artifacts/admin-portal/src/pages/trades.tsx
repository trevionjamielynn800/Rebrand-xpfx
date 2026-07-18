import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  useGetAdminTrades,
  useUpdateAdminUserTrade,
  useDeleteAdminUserTrade,
  useCreateAdminUserTrade,
  useGetAdminUsers,
  type AdminTradeRow,
} from "@workspace/api-client-react";
import { TrendingUp, Loader2, Trash2, Plus, Save, X } from "lucide-react";

export function TradesPage() {
  const { data: trades, isLoading, refetch } = useGetAdminTrades();
  const { data: users } = useGetAdminUsers();
  const updateMutation = useUpdateAdminUserTrade();
  const deleteMutation = useDeleteAdminUserTrade();
  const createMutation = useCreateAdminUserTrade();
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "cancelled">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editTrade, setEditTrade] = useState<AdminTradeRow | null>(null);

  const filtered = (trades ?? []).filter((t) => filter === "all" || t.status === filter);

  const setStatus = async (
    userId: string,
    tradeId: string,
    status: "active" | "completed" | "cancelled",
  ) => {
    await updateMutation.mutateAsync({ userId, tradeId, data: { status } });
    refetch();
  };

  const remove = async (userId: string, tradeId: string) => {
    if (!confirm("Delete this trade? This will not refund any balances.")) return;
    await deleteMutation.mutateAsync({ userId, tradeId });
    refetch();
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">All Trades</h1>
            <p className="text-sm text-muted-foreground">Every trade across every user account.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 bg-muted/30 rounded-lg p-1">
            {(["all", "active", "completed", "cancelled"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-medium hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Open Trade
          </button>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
       <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">User</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pair</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Profit</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin inline" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No trades found.</td></tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id} className="hover:bg-accent/30">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/users/${t.userId}`)}
                      className="text-left hover:text-primary"
                    >
                      <p className="font-medium text-foreground">{t.userName}</p>
                      <p className="text-xs text-muted-foreground">{t.userEmail}</p>
                    </button>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{t.pair}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      t.type === "long" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    }`}>{t.type}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-foreground">
                    {t.amount.toLocaleString()} {t.currency}
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${t.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {t.profit >= 0 ? "+" : ""}{t.profit.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      t.status === "active" ? "bg-blue-500/20 text-blue-400" :
                      t.status === "completed" ? "bg-green-500/20 text-green-400" :
                      "bg-muted text-muted-foreground"
                    }`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {t.status === "active" && (
                        <>
                          <button
                            onClick={() => setEditTrade(t)}
                            className="text-xs text-primary hover:opacity-80"
                          >
                            Edit P/L
                          </button>
                          <button
                            onClick={() => setStatus(t.userId, t.id, "completed")}
                            className="text-xs text-green-400 hover:opacity-80"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => setStatus(t.userId, t.id, "cancelled")}
                            className="text-xs text-yellow-400 hover:opacity-80"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => remove(t.userId, t.id)}
                        className="text-destructive hover:opacity-70"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
       </div>
      </div>

      {showCreate && (
        <CreateTradeModal
          users={(users ?? []).map((u) => ({ id: u.id, name: u.fullName, email: u.email }))}
          isPending={createMutation.isPending}
          onClose={() => setShowCreate(false)}
          onSubmit={async (userId, body) => {
            await createMutation.mutateAsync({ userId, data: body });
            setShowCreate(false);
            refetch();
          }}
        />
      )}

      {editTrade && (
        <EditFiguresModal
          trade={editTrade}
          isPending={updateMutation.isPending}
          onClose={() => setEditTrade(null)}
          onSubmit={async (data) => {
            await updateMutation.mutateAsync({ userId: editTrade.userId, tradeId: editTrade.id, data });
            setEditTrade(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function CreateTradeModal({
  users,
  isPending,
  onClose,
  onSubmit,
}: {
  users: { id: string; name: string; email: string }[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (
    userId: string,
    body: {
      pair: string;
      type: "long" | "short";
      amount: number;
      entryPrice: number;
      currentPrice: number;
      targetPrice: number;
      profit: number;
      expectedProfit: number;
      currency: string;
      status: "active";
    },
  ) => Promise<void>;
}) {
  const [userId, setUserId] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    pair: "",
    type: "long" as "long" | "short",
    amount: "",
    entryPrice: "",
    currentPrice: "",
    targetPrice: "",
    profit: "0",
    expectedProfit: "0",
    currency: "USD",
  });

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users.slice(0, 50);
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    ).slice(0, 50);
  }, [users, search]);

  const submit = async () => {
    if (!userId || !form.pair || !form.amount || !form.entryPrice) return;
    const entry = parseFloat(form.entryPrice);
    await onSubmit(userId, {
      pair: form.pair.toUpperCase(),
      type: form.type,
      amount: parseFloat(form.amount),
      entryPrice: entry,
      currentPrice: parseFloat(form.currentPrice || form.entryPrice),
      targetPrice: parseFloat(form.targetPrice || form.entryPrice),
      profit: parseFloat(form.profit || "0"),
      expectedProfit: parseFloat(form.expectedProfit || "0"),
      currency: form.currency.toUpperCase(),
      status: "active",
    });
  };

  return (
    <Modal title="Open New Trade" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">User</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm mb-1"
          />
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm"
            size={5}
          >
            {filteredUsers.length === 0 ? (
              <option value="" disabled>No users match.</option>
            ) : (
              filteredUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
              ))
            )}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Pair</label>
            <input
              value={form.pair}
              onChange={(e) => setForm({ ...form, pair: e.target.value.toUpperCase() })}
              placeholder="BTC/USD"
              className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm uppercase"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as "long" | "short" })}
              className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm"
            >
              <option value="long">long</option>
              <option value="short">short</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Amount</label>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Currency</label>
            <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm uppercase" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Entry price</label>
            <input type="number" value={form.entryPrice} onChange={(e) => setForm({ ...form, entryPrice: e.target.value })} className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Target price</label>
            <input type="number" value={form.targetPrice} onChange={(e) => setForm({ ...form, targetPrice: e.target.value })} className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Current price</label>
            <input type="number" value={form.currentPrice} onChange={(e) => setForm({ ...form, currentPrice: e.target.value })} className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Expected profit</label>
            <input type="number" value={form.expectedProfit} onChange={(e) => setForm({ ...form, expectedProfit: e.target.value })} className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Initial profit (P/L)</label>
            <input type="number" value={form.profit} onChange={(e) => setForm({ ...form, profit: e.target.value })} className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm" />
          </div>
        </div>
        <button
          onClick={submit}
          disabled={isPending || !userId || !form.pair || !form.amount || !form.entryPrice}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Open Trade
        </button>
      </div>
    </Modal>
  );
}

function EditFiguresModal({
  trade,
  isPending,
  onClose,
  onSubmit,
}: {
  trade: AdminTradeRow;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (data: { currentPrice: number; profit: number; expectedProfit: number }) => Promise<void>;
}) {
  const [currentPrice, setCurrentPrice] = useState(String(trade.currentPrice));
  const [profit, setProfit] = useState(String(trade.profit));
  const [expectedProfit, setExpectedProfit] = useState(String(trade.expectedProfit));

  const submit = async () => {
    await onSubmit({
      currentPrice: parseFloat(currentPrice),
      profit: parseFloat(profit),
      expectedProfit: parseFloat(expectedProfit),
    });
  };

  return (
    <Modal title={`Edit P/L — ${trade.pair} (${trade.userName})`} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Current price</label>
          <input type="number" value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)} className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Profit (current P/L)</label>
          <input type="number" value={profit} onChange={(e) => setProfit(e.target.value)} className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Expected profit at target</label>
          <input type="number" value={expectedProfit} onChange={(e) => setExpectedProfit(e.target.value)} className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm" />
        </div>
        <button
          onClick={submit}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Figures
        </button>
      </div>
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-card-border rounded-xl p-5 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
