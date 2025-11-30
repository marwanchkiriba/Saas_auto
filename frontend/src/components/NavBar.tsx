 "use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { clearToken } from "@/lib/api";
import { LayoutDashboard, PlusCircle, Archive, Car, Power } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/stock", label: "Stock", icon: Car },
  { href: "/vehicles/new", label: "Ajouter", icon: PlusCircle },
  { href: "/archive", label: "Archive", icon: Archive },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-10 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-800 border border-slate-700">
            <Image src="/parkmaster-logo.png" alt="ParcMaster logo" width={40} height={40} className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">ParcMaster</p>
            <h1 className="text-lg font-semibold text-white">Gestion parc</h1>
          </div>
        </div>
        <nav className="flex items-center gap-2 text-sm font-medium">
          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 rounded-full px-3 py-2 transition ${
                  active
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/30"
                    : "text-slate-200 hover:bg-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-full border border-slate-700 px-3 py-2 text-slate-200 hover:bg-slate-800"
          >
            <Power className="h-4 w-4" /> Déconnexion
          </button>
        </nav>
      </div>
    </header>
  );
}
