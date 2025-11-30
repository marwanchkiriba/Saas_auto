"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getToken } from "@/lib/api";
import { NavBar } from "@/components/NavBar";
import Link from "next/link";

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  purchasePrice: number;
  salePrice: number | null;
  mileage: number;
  status: string;
  totalCost: number;
  margin: number | null;
};

export default function StockPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    (async () => {
      try {
        const data = await apiFetch<{ vehicles: Vehicle[] }>("/api/vehicles");
        // garder stock + preparation
        setVehicles(data.vehicles.filter((v) => v.status !== "sold"));
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function markSold(id: string, currentSalePrice: number | null) {
    let salePriceValue = currentSalePrice;
    if (salePriceValue == null) {
      const input = window.prompt("Prix de vente (en euros) ?");
      if (!input) return;
      const parsedEuros = Number(input);
      if (Number.isNaN(parsedEuros) || parsedEuros <= 0) {
        setError("Prix de vente invalide");
        return;
      }
      salePriceValue = Math.round(parsedEuros * 100);
    }
    setSavingId(id);
    setError(null);
    try {
      await apiFetch(`/api/vehicles/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "sold", salePrice: salePriceValue }),
      });
      const data = await apiFetch<{ vehicles: Vehicle[] }>("/api/vehicles");
      setVehicles(data.vehicles.filter((v) => v.status !== "sold"));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingId(null);
    }
  }

  async function deleteVehicle(id: string) {
    setSavingId(id);
    setError(null);
    try {
      await apiFetch(`/api/vehicles/${id}`, { method: "DELETE" });
      setVehicles((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black">
      <NavBar />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Stock</p>
            <h1 className="text-2xl font-semibold text-white">Véhicules en stock</h1>
          </div>
          <Link
            href="/vehicles/new"
            className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 px-4 py-2 font-semibold shadow-lg shadow-cyan-500/30 hover:scale-[1.01] transition"
          >
            Ajouter un véhicule
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/30 space-y-4 backdrop-blur">
          {loading ? (
            <p className="text-sm text-slate-300">Chargement...</p>
          ) : error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : vehicles.length === 0 ? (
            <p className="text-sm text-slate-300">Aucun véhicule en stock.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => router.push(`/vehicles/${v.id}`)}
                  className="text-left rounded-xl border border-slate-800 p-4 space-y-2 shadow-lg shadow-black/20 bg-slate-900/70 backdrop-blur hover:border-cyan-400/60 transition"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white">
                      {v.make} {v.model} ({v.year})
                    </p>
                    <span className="text-xs uppercase px-2 py-1 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
                      {v.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">Km: {v.mileage.toLocaleString("fr-FR")}</p>
                  <p className="text-sm text-slate-200">Coût total: {formatMoney(v.totalCost)}</p>
                  <p className="text-sm text-slate-200">
                    Marge: {v.margin != null ? formatMoney(v.margin) : "N/A"}
                  </p>
                  {v.mainPhotoUrl && (
                    <p className="text-xs text-slate-400 truncate">Photo: {v.mainPhotoUrl}</p>
                  )}
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    <a
                      className="text-cyan-300 underline"
                      href={`http://localhost:4000/api/export/${v.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Export PDF
                    </a>
                    <button
                      onClick={() => markSold(v.id, v.salePrice)}
                      className="text-xs rounded bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 px-2 py-1 disabled:opacity-60 shadow-md shadow-emerald-500/30"
                      disabled={savingId === v.id}
                    >
                      Marquer vendu
                    </button>
                    <button
                      onClick={() => deleteVehicle(v.id)}
                      className="text-xs rounded border border-red-500/40 px-2 py-1 text-red-300 hover:bg-red-900/30 disabled:opacity-60"
                      disabled={savingId === v.id}
                    >
                      Supprimer
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
}
