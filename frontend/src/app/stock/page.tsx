"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MoreHorizontal, Plus, Car, Search } from "lucide-react";

import { apiFetch, getToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
  mainPhotoUrl?: string;
};

export default function StockPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filtered, setFiltered] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    (async () => {
      try {
        const data = await apiFetch<{ vehicles: Vehicle[] }>("/api/vehicles");
        const stockVehicles = data.vehicles.filter((v) => v.status !== "sold");
        setVehicles(stockVehicles);
        setFiltered(stockVehicles);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      vehicles.filter(
        (v) =>
          v.make.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.year.toString().includes(q)
      )
    );
  }, [search, vehicles]);

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
      setVehicles((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingId(null);
    }
  }

  async function deleteVehicle(id: string) {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce véhicule?"))
      return;
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
    <div className="container mx-auto p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-lg bg-primary/20 text-primary">
              <Car className="h-6 w-6" />
            </span>
            Stock
          </h1>
          <p className="text-muted-foreground mt-1">
            {filtered.length} véhicule{filtered.length !== 1 ? "s" : ""} en stock
          </p>
        </div>
        <Button asChild variant="luxury">
          <Link href="/vehicles/new" className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un véhicule
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par marque, modèle ou année..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="h-2 w-2 bg-green-500 rounded-full" />
            Véhicules en stock
          </CardTitle>
          <CardDescription>
            Liste de tous les véhicules actuellement en stock ou en préparation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-destructive">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Car className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {search ? "Aucun véhicule trouvé" : "Aucun véhicule en stock"}
              </p>
              {!search && (
                <Button asChild variant="link" className="mt-2">
                  <Link href="/vehicles/new">Ajouter votre premier véhicule</Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden w-[80px] sm:table-cell">
                    Photo
                  </TableHead>
                  <TableHead>Véhicule</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="hidden md:table-cell text-right">
                    Coût total
                  </TableHead>
                  <TableHead className="hidden lg:table-cell text-right">
                    Marge
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v) => (
                  <TableRow key={v.id} className="group">
                    <TableCell className="hidden sm:table-cell">
                      {v.mainPhotoUrl ? (
                        <Image
                          alt={`${v.make} ${v.model}`}
                          className="aspect-square rounded-lg object-cover border border-border/50"
                          height={56}
                          src={v.mainPhotoUrl}
                          width={56}
                        />
                      ) : (
                        <div className="w-14 h-14 bg-secondary rounded-lg flex items-center justify-center">
                          <Car className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div
                        onClick={() => router.push(`/vehicles/${v.id}`)}
                        className="cursor-pointer"
                      >
                        <p className="font-semibold group-hover:text-primary transition-colors">
                          {v.make} {v.model}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {v.year} • {v.mileage.toLocaleString("fr-FR")} km
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={v.status} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right font-medium">
                      {formatMoney(v.totalCost)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-right">
                      {v.margin != null ? (
                        <span className={v.margin >= 0 ? "text-green-500" : "text-red-500"}>
                          {formatMoney(v.margin)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => router.push(`/vehicles/${v.id}`)}
                          >
                            Voir / Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => markSold(v.id, v.salePrice)}
                            disabled={savingId === v.id}
                          >
                            Marquer vendu
                          </DropdownMenuItem>
                          <a
                            href={`http://localhost:4000/api/export/${v.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <DropdownMenuItem>Export PDF</DropdownMenuItem>
                          </a>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => deleteVehicle(v.id)}
                            disabled={savingId === v.id}
                          >
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    stock: { bg: "bg-green-500/20", text: "text-green-500", label: "En stock" },
    preparation: { bg: "bg-yellow-500/20", text: "text-yellow-500", label: "Préparation" },
    sold: { bg: "bg-blue-500/20", text: "text-blue-500", label: "Vendu" },
  };
  const c = config[status.toLowerCase()] || { bg: "bg-gray-500/20", text: "text-gray-500", label: status };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.text.replace("text-", "bg-")}`} />
      {c.label}
    </span>
  );
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
