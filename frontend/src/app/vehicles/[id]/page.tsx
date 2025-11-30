"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, getToken } from "@/lib/api";
import { NavBar } from "@/components/NavBar";
import { CostsPanel } from "./costs";

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  purchasePrice: number;
  salePrice: number | null;
  mileage: number;
  status: string;
  mainPhotoUrl: string | null;
  costs: { id: string; label: string; amount: number; category: string; incurredAt: string }[];
  photos: { id: string; url: string; position: number }[];
  totalCost: number;
  margin: number | null;
};

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    const id = params?.id as string;
    (async () => {
      try {
        const data = await apiFetch<{ vehicle: Vehicle }>(`/api/vehicles/${id}`);
        setVehicle(data.vehicle);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [params, router]);

  async function updateStatus(status: string) {
    if (!vehicle) return;
    let salePriceValue = vehicle.salePrice;
    if (status === "sold" && salePriceValue == null) {
      const input = window.prompt("Prix de vente (en euros) ?");
      if (!input) return;
      const parsed = Number(input);
      if (Number.isNaN(parsed) || parsed <= 0) {
        setError("Prix de vente invalide");
        return;
      }
      salePriceValue = Math.round(parsed * 100);
    }
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/api/vehicles/${vehicle.id}`, {
        method: "PUT",
        body: JSON.stringify({ status, salePrice: salePriceValue ?? undefined }),
      });
      const refreshed = await apiFetch<{ vehicle: Vehicle }>(`/api/vehicles/${vehicle.id}`);
      setVehicle(refreshed.vehicle);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteVehicle() {
    if (!vehicle) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/api/vehicles/${vehicle.id}`, { method: "DELETE" });
      router.push("/stock");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">Chargement...</p>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-3">
          <p className="text-red-600 font-medium">Erreur: {error ?? "Introuvable"}</p>
          <Link href="/stock" className="text-sm text-slate-700 underline">
            Retour véhicules
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black">
      <NavBar />
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Détail véhicule</p>
            <h1 className="text-2xl font-semibold text-white">
              {vehicle.make} {vehicle.model} ({vehicle.year})
            </h1>
            <p className="text-sm text-slate-300">Statut: {vehicle.status}</p>
          </div>
          <div className="space-y-2 text-right">
            <p className="text-sm text-slate-300">Coût total</p>
            <p className="text-xl font-semibold text-white">{formatMoney(vehicle.totalCost)}</p>
            <p className="text-sm text-slate-300">Marge</p>
            <p className="text-lg font-semibold text-white">
              {vehicle.margin != null ? formatMoney(vehicle.margin) : "N/A"}
            </p>
            <a
              className="inline-block mt-2 text-sm text-cyan-300 underline"
              href={`http://localhost:4000/api/export/${vehicle.id}/pdf`}
              target="_blank"
              rel="noreferrer"
            >
              Export PDF
            </a>
            <div className="flex items-center justify-end gap-2">
              {vehicle.status !== "sold" && (
                <button
                  onClick={() => updateStatus("sold")}
                  className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 px-3 py-2 text-sm hover:scale-[1.01] disabled:opacity-60 shadow-md shadow-emerald-500/30"
                  disabled={saving}
                >
                  Marquer vendu
                </button>
              )}
              <button
                onClick={deleteVehicle}
                className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300 hover:bg-red-900/30 disabled:opacity-60"
                disabled={saving}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/30 space-y-2">
            <h2 className="text-lg font-semibold text-white">Informations</h2>
            <p className="text-sm text-slate-200">Kilométrage : {vehicle.mileage.toLocaleString("fr-FR")} km</p>
            <p className="text-sm text-slate-200">Achat : {formatMoney(vehicle.purchasePrice)}</p>
            <p className="text-sm text-slate-200">
              Vente : {vehicle.salePrice != null ? formatMoney(vehicle.salePrice) : "Non renseigné"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/30 space-y-3">
            <h2 className="text-lg font-semibold text-white">Photos</h2>
            {vehicle.photos.length === 0 ? (
              <p className="text-sm text-slate-300">Aucune photo.</p>
            ) : (
              <div className="space-y-2 text-sm">
                {vehicle.photos.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-slate-200">
                    <span className="truncate">{p.url}</span>
                    <span className="text-slate-400">#{p.position}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/30 space-y-3">
          <CostsPanel
            vehicleId={vehicle.id}
            initialCosts={vehicle.costs}
            onCostsUpdated={(costs) => setVehicle({ ...vehicle, costs })}
          />
        </div>
      </main>
    </div>
  );
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
}
