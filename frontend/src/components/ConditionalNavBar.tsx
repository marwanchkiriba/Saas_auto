"use client";

import { usePathname } from "next/navigation";
import { NavBar } from "@/components/NavBar";

const authRoutes = ["/login", "/signup"];

export function ConditionalNavBar() {
    const pathname = usePathname();
    const isAuthPage = authRoutes.includes(pathname);

    if (isAuthPage) {
        return null;
    }

    return <NavBar />;
}
