"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MoreHorizontal, Archive as ArchiveIcon, Car, TrendingUp, TrendingDown } from "lucide-react";

import { apiFetch, getToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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

export default function ArchivePage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stats
  const totalRevenue = vehicles.reduce((acc, v) => acc + (v.salePrice || 0), 0);
  const totalMargin = vehicles.reduce((acc, v) => acc + (v.margin || 0), 0);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    (async () => {
      try {
        const data = await apiFetch<{ vehicles: Vehicle[] }>(
          "/api/vehicles?status=sold"
        );
        setVehicles(data.vehicles);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  return (
    <div className="container mx-auto p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-lg bg-blue-500/20 text-blue-500">
              <ArchiveIcon className="h-6 w-6" />
            </span>
            Archive
          </h1>
          <p className="text-muted-foreground mt-1">
            {vehicles.length} véhicule{vehicles.length !== 1 ? "s" : ""} vendu{vehicles.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Stats */}
      {vehicles.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenus totaux</p>
                  <p className="text-3xl font-bold text-blue-500">{formatMoney(totalRevenue)}</p>
                </div>
                <span className="p-3 rounded-full bg-blue-500/20 text-blue-500">
                  <TrendingUp className="h-6 w-6" />
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className={totalMargin >= 0 ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Marge totale</p>
                  <p className={`text-3xl font-bold ${totalMargin >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {formatMoney(totalMargin)}
                  </p>
                </div>
                <span className={`p-3 rounded-full ${totalMargin >= 0 ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>
                  {totalMargin >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="h-2 w-2 bg-blue-500 rounded-full" />
            Véhicules Vendus
          </CardTitle>
          <CardDescription>
            Historique de tous les véhicules vendus
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
          ) : vehicles.length === 0 ? (
            <div className="text-center py-12">
              <ArchiveIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun véhicule vendu pour l'instant</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden w-[80px] sm:table-cell">
                    Photo
                  </TableHead>
                  <TableHead>Véhicule</TableHead>
                  <TableHead className="text-right">Prix d'achat</TableHead>
                  <TableHead className="text-right">Prix de vente</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Marge</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((v) => (
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
                    <TableCell className="text-right font-medium">
                      {formatMoney(v.purchasePrice)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-blue-500">
                      {v.salePrice ? formatMoney(v.salePrice) : "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right">
                      {v.margin != null ? (
                        <span className={`inline-flex items-center gap-1 ${v.margin >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {v.margin >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {formatMoney(Math.abs(v.margin))}
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
                            Voir les détails
                          </DropdownMenuItem>
                          <a
                            href={`http://localhost:4000/api/export/${v.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <DropdownMenuItem>Export PDF</DropdownMenuItem>
                          </a>
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

function formatMoney(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
