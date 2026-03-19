"use client";

import { useUser } from "@/lib/auth-provider";
import { MobileNav } from "@/components/MobileNav";
import { usePathname } from "next/navigation";

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const { user } = useUser();
    const pathname = usePathname() || "";

    // Hide nav on landing page, login, firmar routes, and edit/new form routes
    const isHiddenRoute = pathname === "/" || 
        pathname === "/login" ||
        pathname.startsWith("/firmar") ||
        pathname.includes("/edit") ||
        pathname.includes("/new");

    const showNav = user && !isHiddenRoute;

    return (
        <>
            <main className={showNav ? "pb-24 md:pb-0" : ""}>
                {children}
            </main>
            {showNav && <MobileNav />}
        </>
    );
}
