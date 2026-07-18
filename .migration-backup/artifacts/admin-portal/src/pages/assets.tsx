import { useState } from "react";
import {
  useGetAdminAssets,
  useCreateAdminAsset,
  useUpdateAdminAsset,
  useDeleteAdminAsset,
} from "@workspace/api-client-react";
import { Coins, Loader2, Plus, Save, Trash2, X } from "lucide-react";

export function AssetsPage() {
  const { data: assets, isLoading, refetch } = useGetAdminAssets();
  const createMutation = useCreateAdminAsset();
  const updateMutation = useUpdateAdminAsset();
  const deleteMutation = useDeleteAdminAsset();

  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [form, setForm] = useState({
    symbol: "",
    name: "",
    category: "crypto" as "crypto" | "stock" | "etf" | "forex" | "commodity",
    price: "",
    currency: "USD",
    imageUrl: "",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    category: "crypto" as "crypto" | "stock" | "etf" | "forex" | "commodity",
    price: "",
    change24h: "0",
    currency: "USD",
    imageUrl: "",
    available: true,
  });

  const startEdit = (a: NonNullable<typeof assets>[number]) => {
    setEditId(a.id);
    setEditForm({
      name: a.name,
      category: "crypto",
      price: String(a.price),
      change24h: String(a.change24h ?? 0),
      currency: a.currency,
      imageUrl: a.logoUrl ?? "",
      available: a.available,
    });
  };

  const submitCreate = async () => {
    if (!form.symbol.trim() || !form.name.trim() || !form.price) return;
    await createMutation.mutateAsync({
      data: {
        symbol: form.symbol.trim().toUpperCase(),
        name: form.name.trim(),
        category: form.category,
        price: parseFloat(form.price),
        currency: form.currency.trim().toUpperCase(),
        imageUrl: form.imageUrl.trim() || null,
      },
    });
    setForm({ symbol: "", name: "", category: "crypto", price: "", currency: "USD", imageUrl: "" });
    setShowCreate(false);
    refetch();
  };

  const submitEdit = async () => {
    if (!editId) return;
    await updateMutation.mutateAsync({
      assetId: editId,
      data: {
        name: editForm.name,
        category: editForm.category,
        price: parseFloat(editForm.price),
        change24h: parseFloat(editForm.change24h || "0"),
        currency: editForm.currency.toUpperCase(),
        imageUrl: editForm.imageUrl.trim() || null,
        available: editForm.available,
      },
    });
    setEditId(null);
    refetch();
  };

  const remove = async (assetId: string, symbol: string) => {
    if (!confirm(`Remove asset ${symbol}? Existing trades won't be affected.`)) return;
    await deleteMutation.mutateAsync({ assetId });
    refetch();
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Assets</h1>
            <p className="text-sm text-muted-foreground">Catalog of tradable assets and their reference prices.</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> New Asset
        </button>
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
       <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Asset</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Price</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">24h</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : (assets ?? []).length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No assets in catalog.</td></tr>
            ) : (
              (assets ?? []).map((a) => (
                <tr key={a.id} className="hover:bg-accent/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {a.logoUrl ? (
                        <img src={a.logoUrl} alt={a.symbol} className="w-7 h-7 rounded-full" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                          {a.symbol[0]}
                        </div>
                      )}
                      <span className="font-bold text-foreground">{a.symbol}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{a.name}</td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">
                    {a.price.toLocaleString()} {a.currency}
                  </td>
                  <td className={`px-4 py-3 text-center text-xs font-medium ${a.change24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {a.change24h >= 0 ? "+" : ""}{a.change24h.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      a.available ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"
                    }`}>
                      {a.available ? "Available" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEdit(a)}
                        className="text-xs text-primary hover:opacity-80"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(a.id, a.symbol)}
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
        <Modal title="Add Asset" onClose={() => setShowCreate(false)}>
          <div className="space-y-3">
            <Field label="Symbol">
              <input
                value={form.symbol}
                onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
                placeholder="BTC"
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm uppercase"
              />
            </Field>
            <Field label="Name">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Bitcoin"
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm"
              />
            </Field>
            <Field label="Category">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as typeof form.category })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm"
              >
                <option value="crypto">crypto</option>
                <option value="stock">stock</option>
                <option value="etf">etf</option>
                <option value="forex">forex</option>
                <option value="commodity">commodity</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price">
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="65000"
                  className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm"
                />
              </Field>
              <Field label="Currency">
                <input
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm uppercase"
                />
              </Field>
            </div>
            <Field label="Image URL (optional)">
              <input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm"
              />
            </Field>
            <button
              onClick={submitCreate}
              disabled={createMutation.isPending}
              className="w-full bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60"
            >
              {createMutation.isPending ? "Creating..." : "Create Asset"}
            </button>
          </div>
        </Modal>
      )}

      {editId && (
        <Modal title="Edit Asset" onClose={() => setEditId(null)}>
          <div className="space-y-3">
            <Field label="Name">
              <input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price">
                <input
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm"
                />
              </Field>
              <Field label="Currency">
                <input
                  value={editForm.currency}
                  onChange={(e) => setEditForm({ ...editForm, currency: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm uppercase"
                />
              </Field>
            </div>
            <Field label="24h change %">
              <input
                type="number"
                step="0.01"
                value={editForm.change24h}
                onChange={(e) => setEditForm({ ...editForm, change24h: e.target.value })}
                placeholder="e.g. -1.25 or 3.4"
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm"
              />
            </Field>
            <Field label="Image URL">
              <input
                value={editForm.imageUrl}
                onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editForm.available}
                onChange={(e) => setEditForm({ ...editForm, available: e.target.checked })}
              />
              Available for trading
            </label>
            <button
              onClick={submitEdit}
              disabled={updateMutation.isPending}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60"
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-card-border rounded-xl p-5 max-w-md w-full">
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      {children}
    </div>
  );
}
