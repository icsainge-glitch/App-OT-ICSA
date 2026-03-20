"use client";

import { useUser } from "@/lib/auth-provider";
import { MobileNav } from "@/components/MobileNav";
import { usePathname } from "next/navigation";
import { PullToRefresh } from "./PullToRefresh";

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

    const handleRefresh = async () => {
        // Simple hard refresh of the current page
        window.location.reload();
        // Return a promise that never resolves to keep the loading state until reload
        return new Promise<void>(() => {});
    };

    return (
        <>
            <main className={showNav ? "pb-24 md:pb-0" : ""}>
                {showNav ? (
                    <PullToRefresh onRefresh={handleRefresh}>
                        {children}
                    </PullToRefresh>
                ) : (
                    children
                )}
            </main>
            {showNav && <MobileNav />}
        </>
    );
}
