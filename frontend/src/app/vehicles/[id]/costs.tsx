"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

type Cost = { id: string; label: string; amount: number; category: string; incurredAt: string };

export function CostsPanel({
  vehicleId,
  initialCosts,
  onCostsUpdated,
}: {
  vehicleId: string;
  initialCosts: Cost[];
  onCostsUpdated: (costs: Cost[]) => void;
}) {
  const [costs, setCosts] = useState<Cost[]>(initialCosts);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("autre");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addCost(e: React.FormEvent) {
    e.preventDefault();
    if (!label || !amount) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ cost: Cost }>(`/api/vehicles/${vehicleId}/costs`, {
        method: "POST",
        body: JSON.stringify({
          label,
          amount: Math.round(Number(amount) * 100),
          category,
          incurredAt: new Date().toISOString(),
        }),
      });
      const updated = [...costs, res.cost];
      setCosts(updated);
      onCostsUpdated(updated);
      setLabel("");
      setAmount("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/30 space-y-3">
      <h2 className="text-lg font-semibold text-white">Coûts</h2>
      <form className="grid gap-2 md:grid-cols-4 items-center" onSubmit={addCost}>
        <input
          className="rounded-lg border border-slate-800 bg-slate-950 text-slate-100 px-3 py-2 text-sm md:col-span-2"
          placeholder="Libellé"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
        />
        <input
          className="rounded-lg border border-slate-800 bg-slate-950 text-slate-100 px-3 py-2 text-sm"
          type="number"
          step="0.01"
          placeholder="Montant (euros)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <select
          className="rounded-lg border border-slate-800 bg-slate-950 text-slate-100 px-3 py-2 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="transport">Transport</option>
          <option value="repair">Réparation</option>
          <option value="admin">Admin</option>
          <option value="autre">Autre</option>
        </select>
        <button
          type="submit"
          className="md:col-span-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 px-4 py-2 font-semibold shadow-lg shadow-cyan-500/30 hover:scale-[1.01] transition disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Ajout..." : "Ajouter un coût"}
        </button>
      </form>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {costs.length === 0 ? (
        <p className="text-sm text-slate-300">Aucun coût saisi.</p>
      ) : (
        <div className="space-y-2 text-sm">
          {costs.map((c) => (
            <div key={c.id} className="flex items-center justify-between text-slate-200">
              <span>
                {c.label} ({c.category})
              </span>
              <span>
                {formatMoney(c.amount)} · {new Date(c.incurredAt).toLocaleDateString("fr-FR")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
}
