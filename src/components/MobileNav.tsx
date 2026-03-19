"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard, Briefcase, ClipboardList, Plus,
    MoreHorizontal, History, BookOpen, Users, UserRound,
    LogOut, ChevronRight, X, Wrench
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/lib/auth-provider";
import { logoutAction } from "@/actions/auth-actions";

export function MobileNav() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { userProfile } = useUserProfile();
    const [isOpen, setIsOpen] = useState(false);

    const isAdmin = userProfile?.rol_t?.toLowerCase() === 'admin' || 
        userProfile?.rol_t?.toLowerCase() === 'administrador';
    const activeTab = searchParams.get("tab") || "dashboard";

    const navItems = [
        { label: "Panel", icon: LayoutDashboard, href: "/dashboard?tab=dashboard", id: "dashboard" },
        { label: "Proyectos", icon: Briefcase, href: "/dashboard?tab=projects", id: "projects" },
        { label: "Nueva", icon: Plus, href: "/work-orders/new", isFab: true },
        { label: "Órdenes", icon: ClipboardList, href: "/dashboard?tab=orders", id: "orders" },
        { label: "Más", icon: MoreHorizontal, isMenu: true },
    ];

    const menuItems = [
        { label: "Panel Resumen", icon: LayoutDashboard, href: "/dashboard?tab=dashboard", active: activeTab === "dashboard" && pathname === "/dashboard" },
        { label: "Proyectos Activos", icon: Briefcase, href: "/dashboard?tab=projects", active: activeTab === "projects" && pathname === "/dashboard" },
        { label: "Historial Proyectos", icon: BookOpen, href: "/dashboard?tab=project-history", active: activeTab === "project-history" && pathname === "/dashboard" },
        { label: "Órdenes Activas", icon: ClipboardList, href: "/dashboard?tab=orders", active: activeTab === "orders" && pathname === "/dashboard" },
        { label: "Historial Órdenes", icon: History, href: "/dashboard?tab=order-history", active: activeTab === "order-history" && pathname === "/dashboard" },
        { label: "Control Herramientas", icon: Wrench, href: "/dashboard?tab=tools", active: activeTab === "tools" && pathname === "/dashboard" },
        { label: "Actas Herramientas", icon: History, href: "/dashboard?tab=tool-history", active: activeTab === "tool-history" && pathname === "/dashboard" },
        { label: "HPT (Seguridad)", icon: ClipboardList, href: "/hpt", active: pathname === "/hpt" || pathname === "/hpt/new" },
        { label: "Capacitaciones", icon: BookOpen, href: "/capacitaciones", active: pathname === "/capacitaciones" || pathname === "/capacitaciones/new" },
    ].filter(item => {
        if (item.href === "/dashboard?tab=tool-history" && !isAdmin) return false;
        return true;
    });

    const adminItems = [
        { label: "Gestión Clientes", icon: Users, href: "/clients" },
        { label: "Control Personal", icon: UserRound, href: "/technicians" },
    ];

    const handleLogout = async () => {
        await logoutAction();
        window.location.href = "/login";
    };

    const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string, isTab: boolean) => {
        e.preventDefault();
        router.push(href);
    };

    return (
        <nav className="md:hidden fixed bottom-6 left-4 right-4 z-50 animate-slide-up">
            <div className="glassmorphism rounded-full flex items-center justify-between px-2 py-2 shadow-[0_20px_50px_rgba(0,0,0,0.2)] ring-1 ring-white/60">
                {navItems.map((item) => {
                    const isTabActive = item.id ? (activeTab === item.id && pathname === "/dashboard") : (pathname === item.href);

                    if (item.isFab) {
                        return (
                            <Link key={item.label} href={item.href} className="relative -top-6 animate-pop-in z-10" prefetch={false}>
                                <div className="bg-primary text-white p-4 rounded-full shadow-xl shadow-primary/40 active:scale-90 transition-all duration-300 flex items-center justify-center border-[3px] border-white ring-[3px] ring-primary/10">
                                    <item.icon size={26} strokeWidth={3} />
                                </div>
                            </Link>
                        );
                    }

                    if (item.isMenu) {
                        return (
                            <Sheet key={item.label} open={isOpen} onOpenChange={setIsOpen}>
                                <SheetTrigger asChild>
                                    <button
                                        className={cn(
                                            "flex flex-col items-center justify-center flex-1 py-2 rounded-2xl transition-all active:scale-95",
                                            isOpen ? "text-primary scale-110" : "text-muted-foreground/60"
                                        )}
                                    >
                                        <item.icon size={22} strokeWidth={isOpen ? 2.5 : 2} />
                                        <span className="text-xs font-black uppercase mt-1 tracking-tighter">
                                            {item.label}
                                        </span>
                                    </button>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="rounded-t-[3rem] border-none bg-white/95 backdrop-blur-3xl p-8 max-h-[85vh] overflow-y-auto shadow-2xl">
                                    <SheetHeader className="mb-6">
                                        <div className="flex items-center justify-between">
                                            <SheetTitle className="text-2xl font-black text-primary uppercase tracking-tighter">Navegación</SheetTitle>
                                            <button onClick={() => setIsOpen(false)} className="bg-muted/50 p-2 rounded-full hover:bg-muted transition-colors">
                                                <X size={20} />
                                            </button>
                                        </div>
                                    </SheetHeader>
                                    <div className="space-y-8 pb-10">
                                        <div className="grid grid-cols-1 gap-2">
                                            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2 mb-2">Secciones</p>
                                            {menuItems.map((menu) => (
                                                <Link
                                                    key={menu.label}
                                                    href={menu.href}
                                                    onClick={(e) => {
                                                        setIsOpen(false);
                                                        handleNavigation(e, menu.href, true);
                                                    }}
                                                    className={cn(
                                                        "flex items-center justify-between p-4 rounded-2xl transition-all group active:scale-95",
                                                        menu.active ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-muted/30 text-primary hover:bg-muted/50"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn("p-2 rounded-xl", menu.active ? "bg-white/20" : "bg-white shadow-sm text-primary")}>
                                                            <menu.icon size={20} strokeWidth={2.5} />
                                                        </div>
                                                        <span className="font-black text-xs uppercase tracking-tight">{menu.label}</span>
                                                    </div>
                                                    <ChevronRight size={16} className={cn(menu.active ? "opacity-100" : "opacity-30")} />
                                                </Link>
                                            ))}
                                        </div>

                                        {isAdmin && (
                                            <div className="grid grid-cols-1 gap-2">
                                                <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2 mb-2">Administración</p>
                                                {adminItems.map((admin) => (
                                                    <Link
                                                        key={admin.label}
                                                        href={admin.href}
                                                        onClick={(e) => {
                                                            setIsOpen(false);
                                                            handleNavigation(e, admin.href, false);
                                                        }}
                                                        className="flex items-center justify-between p-4 rounded-2xl bg-accent/10 text-primary transition-all active:scale-95 group"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-2 rounded-xl bg-white shadow-sm group-hover:bg-accent group-hover:text-white transition-colors">
                                                                <admin.icon size={20} strokeWidth={2.5} />
                                                            </div>
                                                            <span className="font-black text-xs uppercase tracking-tight">{admin.label}</span>
                                                        </div>
                                                        <ChevronRight size={16} className="opacity-30" />
                                                    </Link>
                                                ))}
                                            </div>
                                        )}

                                        <div className="pt-4 border-t border-dashed">
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center justify-between p-5 rounded-3xl bg-destructive/5 text-destructive font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <LogOut size={20} />
                                                    <span>Cerrar Sesión</span>
                                                </div>
                                                <ChevronRight size={16} className="opacity-30" />
                                            </button>
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        );
                    }

                    return (
                        <Link
                            key={item.label}
                            href={item.href || "#"}
                            onClick={(e) => handleNavigation(e, item.href || "#", !!item.id)}
                            className={cn(
                                "relative flex flex-col items-center justify-center flex-1 py-2 rounded-full transition-all duration-300 active:scale-90",
                                isTabActive ? "text-primary scale-110" : "text-muted-foreground/50 hover:text-primary/70"
                            )}
                        >
                            {isTabActive && (
                                <span className="absolute inset-0 bg-primary/15 rounded-full -z-10 animate-pop-in" />
                            )}
                            <item.icon size={22} strokeWidth={isTabActive ? 2.5 : 2} className="relative z-10" />
                            <span className={cn("text-xs font-black uppercase mt-1 tracking-tighter transition-all duration-300 relative z-10", isTabActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 h-0")}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
