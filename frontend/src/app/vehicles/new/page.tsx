"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { NavBar } from "@/components/NavBar";

export default function NewVehiclePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    purchasePrice: "",
    mileage: "",
    salePrice: "",
    status: "stock",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/api/vehicles", {
        method: "POST",
        body: JSON.stringify({
          make: form.make,
          model: form.model,
          year: Number(form.year),
          purchasePrice: Math.round(Number(form.purchasePrice) * 100),
          mileage: Number(form.mileage),
          salePrice: form.salePrice ? Math.round(Number(form.salePrice) * 100) : undefined,
          status: form.status,
        }),
      });
      router.push("/stock");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black">
      <NavBar />
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Nouveau</p>
            <h1 className="text-2xl font-semibold text-white">Ajouter un véhicule</h1>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/30 space-y-4 backdrop-blur">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
            <LabeledInput
              label="Marque"
              required
              value={form.make}
              onChange={(v) => setForm((f) => ({ ...f, make: v }))}
            />
            <LabeledInput
              label="Modèle"
              required
              value={form.model}
              onChange={(v) => setForm((f) => ({ ...f, model: v }))}
            />
            <LabeledInput
              label="Année"
              type="number"
              required
              value={form.year}
              onChange={(v) => setForm((f) => ({ ...f, year: Number(v) }))}
            />
            <LabeledInput
              label="Prix d'achat (en euros)"
              helper="Ex: 12500 pour 12 500 €"
              type="number"
              step="0.01"
              required
              value={form.purchasePrice}
              onChange={(v) => setForm((f) => ({ ...f, purchasePrice: v }))}
            />
            <LabeledInput
              label="Kilométrage"
              type="number"
              required
              value={form.mileage}
              onChange={(v) => setForm((f) => ({ ...f, mileage: v }))}
            />
            <LabeledInput
              label="Prix de vente (en euros, optionnel)"
              helper="Laisser vide si non défini"
              type="number"
              step="0.01"
              value={form.salePrice}
              onChange={(v) => setForm((f) => ({ ...f, salePrice: v }))}
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-200">Statut initial</label>
              <select
                className="rounded-lg border border-slate-800 bg-slate-950 text-slate-100 px-3 py-2"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="stock">Stock</option>
                <option value="preparation">Préparation</option>
                <option value="sold">Vendu</option>
              </select>
            </div>
            <button
              type="submit"
              className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 px-4 py-2 font-semibold shadow-lg shadow-cyan-500/30 hover:scale-[1.01] transition disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Ajout..." : "Créer"}
            </button>
          </form>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      </main>
    </div>
  );
}

function LabeledInput({
  label,
  helper,
  ...props
}: {
  label: string;
  helper?: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-200">{label}</label>
      <input
        {...props}
        className="rounded-lg border border-slate-800 bg-slate-950 text-slate-100 px-3 py-2"
        onChange={(e) => props.onChange(e.target.value)}
      />
      {helper && <p className="text-xs text-slate-400">{helper}</p>}
    </div>
  );
}
