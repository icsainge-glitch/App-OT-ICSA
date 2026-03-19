
"use client";

import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus, Search, LogOut, LayoutDashboard,
  Eye, Download, Users, UserRound, Building2,
  Trash2, History, Briefcase, FolderOpen, ClipboardList, BookOpen, Pencil, Menu, ChevronRight, FileText, Info, Clock, CheckCircle, Loader2, ArrowRight, Wrench, Package, Filter, MoreHorizontal, X, RefreshCw
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { generateWorkOrderPDF, generateToolReportPDF, generateBatchReturnActPDF } from "@/lib/pdf-generator";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useUser, useUserProfile } from "@/lib/auth-provider";
import { useActionData } from "@/hooks/use-action-data";
import { getActiveProjects, getWorkOrders, getArchivedWorkOrders, deleteRecord, hideWorkOrder, hideProject, getTools, saveTool, deleteTool, getToolMovements, approveToolReturn, returnMultipleTools, assignMultipleTools, getClients, getPersonnel } from "@/actions/db-actions";
import { logoutAction } from "@/actions/auth-actions";
import { cn, formatFolio } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhotoUpload } from "@/components/PhotoUpload";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToolCard } from "@/components/ToolCard";
import { SignaturePad } from "@/components/SignaturePad";

function DashboardContent() {
  const { user, isUserLoading } = useUser();
  const { userProfile, isProfileLoading } = useUserProfile();
  const router = useRouter();
  const { toast } = useToast();
  const logoImage = PlaceHolderImages.find(img => img.id === "icsa-logo");

  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    } else {
      setActiveTab("dashboard");
    }
  }, [searchParams]);

  const setTab = (tab: string) => {
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tab);
    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'clients' | 'personnel' | 'ordenes' | 'historial' | 'projects' | 'herramientas' } | null>(null);
  const [toolModalOpen, setToolModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnAllModalOpen, setReturnAllModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<any>(null);
  const [returningTool, setReturningTool] = useState<any>(null);
  const [reportPeriod, setReportPeriod] = useState<"daily" | "weekly" | "monthly" | "all">("all");
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toolImage, setToolImage] = useState<string>("");
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);
  const [selectedAvailableToolIds, setSelectedAvailableToolIds] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [viewingActa, setViewingActa] = useState<any>(null);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [tempSignature, setTempSignature] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (editingTool) {
      setToolImage(editingTool.imageUrl || "");
    } else {
      setToolImage("");
    }
  }, [editingTool]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  const isAdmin = userProfile?.rol_t?.toLowerCase() === 'admin' || 
    userProfile?.rol_t?.toLowerCase() === 'administrador';
  
  const isPrivileged = isAdmin;

  const { data: projects, isLoading: isProjectsLoading } = useActionData(() => {
    if (!user?.uid || isProfileLoading) return Promise.resolve([]);
    console.log(`[DASHBOARD_DEBUG] Fetching projects. User: ${user.uid}, isPrivileged: ${isPrivileged}`);
    return getActiveProjects(user.uid, isPrivileged, true);
  }, [user?.uid, isProfileLoading, isPrivileged]);

  const { data: orders, isLoading: isOrdersLoading } = useActionData(() => {
    if (!user?.uid || isProfileLoading) return Promise.resolve([]);
    return getWorkOrders(user.uid, isPrivileged);
  }, [user?.uid, isProfileLoading, isPrivileged]);

  const { data: historyOrders, isLoading: isHistoryLoading } = useActionData(() => {
    if (!user?.uid || isProfileLoading) return Promise.resolve([]);
    return getArchivedWorkOrders(user.uid, isPrivileged);
  }, [user?.uid, isProfileLoading, isPrivileged]);

  const { data: tools, isLoading: isToolsLoading } = useActionData(() => {
    if (!user?.uid || isProfileLoading) return Promise.resolve([]);
    return getTools();
  }, [user?.uid, isProfileLoading]);

  const { data: movements, isLoading: isMovementsLoading } = useActionData(() => {
    if (!user?.uid || isProfileLoading) return Promise.resolve([]);
    if (activeTab === 'tool-history') return getToolMovements('all');
    if (reportModalOpen) return getToolMovements(reportPeriod);
    return Promise.resolve([]);
  }, [user?.uid, isProfileLoading, activeTab, reportModalOpen, reportPeriod]);

  const activeProjects = useMemo(() => (projects || []).filter((p: any) => {
    const s = p.status?.toLowerCase();
    return s === 'active' || s === 'pendiente';
  }), [projects]);
  const completedProjects = useMemo(() => (projects || []).filter((p: any) => {
    const s = p.status?.toLowerCase();
    return s === 'completed' || s === 'completado';
  }), [projects]);

  const filteredProjects = useMemo(() => {
    const list = activeTab === "project-history" ? completedProjects : activeProjects;
    return list.filter((p: any) => {
      const matchText = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchText) return false;

      if (activeTab === "project-history" && (dateFrom || dateTo)) {
        const projectDateStr = p.updatedAt || p.endDate || p.startDate || p.createdAt;
        if (!projectDateStr) return false;
        const projectDate = new Date(projectDateStr);

        if (dateFrom) {
          const from = new Date(dateFrom);
          from.setHours(0, 0, 0, 0);
          if (projectDate < from) return false;
        }
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          if (projectDate > to) return false;
        }
      }
      return true;
    });
  }, [activeProjects, completedProjects, activeTab, searchTerm, dateFrom, dateTo]);

  const filteredOrders = useMemo(() => {
    const list = activeTab === "order-history" ? (historyOrders || []) : (orders || []);
    return list.filter((o: any) => {
      const matchText = o.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) || o.folio?.toString().includes(searchTerm);
      if (!matchText) return false;

      if (activeTab === "order-history" && (dateFrom || dateTo)) {
        const orderDateStr = o.updatedAt || o.startDate || o.createdAt;
        if (!orderDateStr) return false;
        const orderDate = new Date(orderDateStr);

        if (dateFrom) {
          const from = new Date(dateFrom);
          from.setHours(0, 0, 0, 0);
          if (orderDate < from) return false;
        }
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          if (orderDate > to) return false;
        }
      }
      return true;
    });
  }, [orders, historyOrders, activeTab, searchTerm, dateFrom, dateTo]);

  const filteredTools = useMemo(() => {
    if (!tools) return [];
    return tools.filter((t: any) => {
      const matchText = t.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.serie?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchText;
    });
  }, [tools, searchTerm]);

  const toolsSummary = useMemo(() => {
    if (!tools) return {};
    const summary: { [key: string]: string[] } = {};
    tools.forEach((t: any) => {
      if (t.estado === 'En Terreno' && t.asignadoA) {
        if (!summary[t.asignadoA]) summary[t.asignadoA] = [];
        summary[t.asignadoA].push(t.nombre);
      }
    });
    return summary;
  }, [tools]);

  const myTools = useMemo(() => {
    if (!tools || !user) return [];
    const identifier = userProfile?.name || user?.email;
    return tools.filter((t: any) => t.asignadoA === identifier && t.estado === 'En Terreno');
  }, [tools, user, userProfile]);

  const handleSaveTool = async (data: any, signatureUrl?: string) => {
    // Basic security check: only admins can change technical data (nombre, marca, etc.)
    // Technicians only call this for assignment changes where toolModalOpen is false
    if (!isAdmin && toolModalOpen) {
      toast({ title: "Acceso Denegado", description: "Solo el administrador puede modificar datos técnicos.", variant: "destructive" });
      return;
    }

    try {
      await saveTool(data, signatureUrl);
      toast({ title: "Herramienta guardada", description: "El inventario ha sido actualizado." });
      setToolModalOpen(false);
      setEditingTool(null);
      setTimeout(() => window.location.reload(), 500);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    await logoutAction();
    window.location.href = "/login";
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if ((deleteConfirm.type === 'ordenes' || deleteConfirm.type === 'historial') && !isAdmin && user) {
        await hideWorkOrder(deleteConfirm.id, deleteConfirm.type, user.uid);
        toast({ title: "Orden oculta", description: "Esta orden ya no será visible en su cuenta." });
      } else if (deleteConfirm.type === 'projects' && !isAdmin && user) {
        await hideProject(deleteConfirm.id, user.uid);
        toast({ title: "Proyecto oculto", description: "Este proyecto ya no será visible en su cuenta." });
      } else {
        await deleteRecord(deleteConfirm.type, deleteConfirm.id, user?.uid, isAdmin);
        toast({ 
          title: isAdmin ? "Registro eliminado" : "Registro oculto", 
          description: isAdmin ? "El registro ha sido eliminado permanentemente." : "Este registro ya no será visible en su cuenta." 
        });
      }
      setDeleteConfirm(null);
      setTimeout(() => window.location.reload(), 500);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      setDeleteConfirm(null);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-6">
      <div className="flex flex-col items-center mb-8 px-6">
        {logoImage && (
          <div className="relative w-16 h-16 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-lg mb-2 p-2">
            <Image src={logoImage.imageUrl} alt="Logo" fill className="object-contain" />
          </div>
        )}
        <span className="font-black text-xl tracking-tighter text-white">ICSA Operaciones</span>
      </div>

      <nav className="flex-1 overflow-y-auto space-y-1 px-4 py-2 scrollbar-thin scrollbar-thumb-primary/10">
        {[
          { id: "dashboard", icon: LayoutDashboard, label: "Panel Resumen" },
          { id: "projects", icon: Briefcase, label: "Proyectos Activos" },
          { id: "project-history", icon: BookOpen, label: "Historial Proyectos" },
          { id: "orders", icon: ClipboardList, label: "Órdenes Activas" },
          { id: "order-history", icon: History, label: "Historial Órdenes" },
          { id: "tools", icon: Wrench, label: "Control Herramientas" },
          { id: "tool-history", icon: FileText, label: "Actas Herramientas" },
          { id: "hpt", icon: FileText, label: "HPT (Seguridad)" },
          { id: "capacitaciones", icon: BookOpen, label: "Charlas" }
        ].map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 h-12 rounded-xl font-bold text-sm transition-all text-left",
              activeTab === item.id ? "bg-white text-primary shadow-md" : "text-white/70 hover:bg-white/10 hover:text-white"
            )}
            onClick={() => { 
              if (item.id === 'hpt') { router.push('/hpt'); return; }
              if (item.id === 'capacitaciones') { router.push('/capacitaciones'); return; }
              setTab(item.id); 
              setSearchTerm(""); 
              setIsMobileMenuOpen(false); 
            }}
          >
            <item.icon size={20} className="shrink-0" /> <span className="truncate">{item.label}</span>
          </Button>
        ))}

        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-white/10 space-y-1">
            <Link href="/clients" className="block">
              <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-white/70 hover:bg-white/10 hover:text-white rounded-xl font-bold">
                <Users size={20} /> Gestión Clientes
              </Button>
            </Link>
            <Link href="/technicians" className="block">
              <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-white/70 hover:bg-white/10 hover:text-white rounded-xl font-bold">
                <UserRound size={20} /> Control Personal
              </Button>
            </Link>
          </div>
        )}
      </nav>

      <div className="px-4 pt-4 mt-auto border-t border-white/10 shrink-0">
        <Button onClick={handleLogout} variant="ghost" className="w-full justify-start gap-3 text-white/50 hover:text-white hover:bg-destructive/20 h-12 rounded-xl font-bold">
          <LogOut size={20} /> Cerrar Sesión
        </Button>
      </div>
    </div>
  );

  const toggleToolSelection = useCallback((toolId: string) => {
    setSelectedToolIds(prev =>
      prev.includes(toolId)
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  }, []);

  const toggleAvailableToolSelection = useCallback((toolId: string) => {
    setSelectedAvailableToolIds(prev =>
      prev.includes(toolId)
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  }, []);

  if (isUserLoading || !mounted || isProfileLoading) return <div className="min-h-screen flex items-center justify-center font-black animate-pulse bg-background text-primary tracking-widest text-sm">INICIANDO SISTEMA ICSA...</div>;

  const handleAssignMultiple = async () => {
    if (selectedAvailableToolIds.length === 0) return;
    setAssignmentModalOpen(true);
    setTempSignature("");
  };

  const confirmAssignment = async () => {
    if (!tempSignature) {
      toast({ title: "Firma requerida", description: "Por favor, firme para confirmar la asignación.", variant: "destructive" });
      return;
    }
    
    setIsAssigning(true);
    try {
      const identifier = userProfile?.name || user?.email || "Usuario";
      await assignMultipleTools(selectedAvailableToolIds, identifier, tempSignature);
      toast({ 
        title: "Herramientas asignadas", 
        description: `Se han asignado ${selectedAvailableToolIds.length} equipos a tu cargo.` 
      });
      setSelectedAvailableToolIds([]);
      setAssignmentModalOpen(false);
      setTimeout(() => window.location.reload(), 500);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsAssigning(false);
    }
  };

  const userIdentifier = userProfile?.name || user?.email || "";

  const getPageTitle = () => {
    switch (activeTab) {
      case "dashboard": return "Resumen General";
      case "projects": return "Proyectos Activos";
      case "project-history": return "Historial de Proyectos";
      case "orders": return "Órdenes Activas";
      case "order-history": return "Historial de Órdenes";
      case "tools": return "Control de Herramientas";
      case "tool-history": return "Actas de Movimiento";
      default: return "Panel";
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col md:flex-row bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
      <aside className="w-64 bg-primary/95 backdrop-blur-3xl text-white hidden md:flex flex-col shadow-[10px_0_40px_rgba(var(--primary),0.15)] sticky top-0 h-screen border-r border-primary/20 z-50">
        <SidebarContent />
      </aside>

      <header className="md:hidden bg-primary/95 backdrop-blur-3xl text-white p-4 flex items-center justify-between shadow-lg sticky top-0 z-50 border-b border-white/10">
        <div className="flex items-center gap-2">
          {logoImage && (
            <div className="relative w-8 h-8 bg-white rounded-lg flex items-center justify-center overflow-hidden p-1">
              <Image src={logoImage.imageUrl} alt="Logo" fill className="object-contain" />
            </div>
          )}
          <span className="font-black tracking-tighter text-lg uppercase">ICSA</span>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => window.location.reload()} variant="ghost" size="icon" className="text-white/70 h-9 w-9 active:scale-95 group">
            <RefreshCw size={18} className="group-active:animate-spin" />
          </Button>
          <Button onClick={handleLogout} variant="ghost" size="icon" className="text-white/70 h-9 w-9">
            <LogOut size={18} />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-primary uppercase tracking-tighter">
              {getPageTitle()}
            </h1>
            {activeTab === "dashboard" && (
              <p className="text-sm font-bold text-muted-foreground mt-1">
                Bienvenido, <span className="text-primary">{userProfile?.nombre_t || user?.name || "Usuario"}</span>
              </p>
            )}
          </div>
          {activeTab !== "tools" && (
            <div className="flex gap-3">
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="hidden md:flex bg-white hover:bg-muted font-black rounded-2xl h-11 px-4 shadow-sm transition-all active:scale-95 group border-primary/20"
                title="Refrescar Datos"
              >
                <RefreshCw size={18} className="group-active:animate-spin" />
              </Button>
              <Link href="/projects/new">
                <Button className="bg-primary hover:bg-primary/90 font-black rounded-2xl h-11 px-6 shadow-[0_8px_20px_rgba(var(--primary),0.2)] transition-all hover:-translate-y-0.5 active:scale-95">
                  <Plus size={18} className="mr-2" /> Nuevo Proyecto
                </Button>
              </Link>
              <Link href="/work-orders/new">
                <Button className="bg-accent hover:bg-accent/90 text-primary font-black rounded-2xl h-11 px-6 shadow-[0_8px_20px_rgba(var(--accent),0.3)] transition-all hover:-translate-y-0.5 active:scale-95">
                  <Plus size={18} className="mr-2" /> Crear OT
                </Button>
              </Link>
              {activeTab !== "dashboard" && (
                <>
                  <Link href="/hpt/new">
                    <Button className="hidden lg:flex bg-slate-800 hover:bg-slate-900 text-white font-black rounded-2xl h-11 px-6 shadow-[0_8px_20px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5 active:scale-95">
                      <Plus size={18} className="mr-2" /> Nuevo HPT
                    </Button>
                  </Link>
                  <Link href="/capacitaciones/new">
                    <Button className="hidden lg:flex bg-slate-800 hover:bg-slate-900 text-white font-black rounded-2xl h-11 px-6 shadow-[0_8px_20_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5 active:scale-95">
                      <Plus size={18} className="mr-2" /> Nueva Charla
                    </Button>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8 animate-fade-in">
            <Card className="shadow-[0_10px_40px_rgba(0,0,0,0.03)] border-none bg-white/80 backdrop-blur-3xl rounded-3xl overflow-hidden hover:shadow-[0_10px_40px_rgba(0,0,0,0.06)] transition-all duration-500">
              <CardHeader className="bg-primary/[0.03] p-6 border-b border-primary/5">
                <CardTitle className="text-[11px] font-black uppercase text-primary tracking-[0.2em] flex items-center gap-3">
                  <FolderOpen size={16} /> Proyectos en Ejecución
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ProjectTable projects={activeProjects.slice(0, 5)} isLoading={isProjectsLoading} setDeleteConfirm={setDeleteConfirm} isAdmin={isPrivileged} />
              </CardContent>
            </Card>

            <Card className="shadow-[0_10px_40px_rgba(0,0,0,0.03)] border-none bg-white/80 backdrop-blur-3xl rounded-3xl overflow-hidden hover:shadow-[0_10px_40px_rgba(0,0,0,0.06)] transition-all duration-500">
              <CardHeader className="bg-accent/[0.08] p-6 border-b border-accent/10">
                <CardTitle className="text-[11px] font-black uppercase text-primary tracking-[0.2em] flex items-center gap-3">
                  <ClipboardList size={16} /> Órdenes Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <OrderTable orders={(orders || []).slice(0, 5)} isLoading={isOrdersLoading} type="ordenes" setDeleteConfirm={setDeleteConfirm} isAdmin={isPrivileged} />
              </CardContent>
            </Card>

            <Card className="shadow-[0_10px_40px_rgba(0,0,0,0.03)] border-none bg-white/80 backdrop-blur-3xl rounded-3xl overflow-hidden hover:shadow-[0_10px_40px_rgba(0,0,0,0.06)] transition-all duration-500 cursor-pointer group" onClick={() => setTab("tools")}>
              <CardHeader className="bg-primary/[0.05] p-6 border-b border-primary/5">
                <CardTitle className="text-[11px] font-black uppercase text-primary tracking-[0.2em] flex items-center justify-between">
                  <div className="flex items-center gap-3"><Wrench size={16} /> Control Herramientas</div>
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Package size={32} className="text-primary" />
                </div>
                <h3 className="font-black text-primary text-lg uppercase tracking-tighter mb-1">Inventario & Equipos</h3>
                <p className="text-xs font-bold text-muted-foreground uppercase mb-6 leading-tight">Gestiona taladros, escaleras y equipos en terreno</p>
                <div className="flex gap-4 w-full">
                  <div className="flex-1 bg-primary/5 p-3 rounded-2xl">
                    <div className="text-xl font-black text-primary">{tools?.filter((t: any) => t.estado === 'Disponible').length || 0}</div>
                    <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">Disponibles</div>
                  </div>
                  <div className="flex-1 bg-accent/20 p-3 rounded-2xl">
                    <div className="text-xl font-black text-primary">{tools?.filter((t: any) => t.estado === 'En Terreno').length || 0}</div>
                    <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">En Terreno</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {(activeTab === "projects" || activeTab === "project-history") && (
          <Card className="shadow-[0_10px_40px_rgba(0,0,0,0.03)] border-none bg-white/90 backdrop-blur-2xl rounded-3xl overflow-hidden animate-slide-up">
            <CardHeader className="border-b border-black/5 bg-transparent p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input placeholder="Buscar proyecto o cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-12 h-12 bg-muted/30 border-none rounded-2xl font-bold transition-all focus:ring-2 focus:ring-primary/20 shadow-inner" />
                </div>
                {activeTab === "project-history" && (
                  <div className="flex flex-col flex-1 gap-2 max-w-xl">
                    <span className="text-xs font-black uppercase text-primary/60 tracking-widest sm:ml-1">Filtrar por Fecha:</span>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-xs font-black uppercase text-primary shrink-0 min-w-[45px]">Desde:</span>
                        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-11 bg-white border border-primary/20 rounded-xl font-bold shadow-sm focus:ring-2 focus:ring-primary/20 w-full" />
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-xs font-black uppercase text-primary shrink-0 min-w-[45px]">Hasta:</span>
                        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-11 bg-white border border-primary/20 rounded-xl font-bold shadow-sm focus:ring-2 focus:ring-primary/20 w-full" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            {activeTab === "projects" && (
              <div className="space-y-6">
                <ProjectTable projects={filteredProjects} isLoading={isProjectsLoading} setDeleteConfirm={setDeleteConfirm} isAdmin={isPrivileged} />
              </div>
            )}
            {activeTab === "project-history" && (
              <CardContent className="p-0">
                <ProjectTable projects={filteredProjects} isLoading={isProjectsLoading} setDeleteConfirm={setDeleteConfirm} isAdmin={isPrivileged} />
              </CardContent>
            )}
          </Card>
        )}

        {(activeTab === "orders" || activeTab === "order-history") && (
          <Card className="shadow-[0_10px_40px_rgba(0,0,0,0.03)] border-none bg-white/90 backdrop-blur-2xl rounded-3xl overflow-hidden animate-slide-up">
            <CardHeader className="border-b border-black/5 bg-transparent p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input placeholder="Buscar por folio o cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-12 h-12 bg-muted/30 border-none rounded-2xl font-bold transition-all focus:ring-2 focus:ring-primary/20 shadow-inner" />
                </div>
                {activeTab === "order-history" && (
                  <div className="flex flex-col flex-1 gap-2 max-w-xl">
                    <span className="text-xs font-black uppercase text-primary/60 tracking-widest sm:ml-1">Filtrar por Fecha:</span>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-xs font-black uppercase text-primary shrink-0 min-w-[45px]">Desde:</span>
                        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-11 bg-white border border-primary/20 rounded-xl font-bold shadow-sm focus:ring-2 focus:ring-primary/20 w-full" />
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-xs font-black uppercase text-primary shrink-0 min-w-[45px]">Hasta:</span>
                        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-11 bg-white border border-primary/20 rounded-xl font-bold shadow-sm focus:ring-2 focus:ring-primary/20 w-full" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <OrderTable
                orders={filteredOrders}
                isLoading={activeTab === "orders" ? isOrdersLoading : isHistoryLoading}
                type={activeTab === "orders" ? "ordenes" : "historial"}
                setDeleteConfirm={setDeleteConfirm}
                isAdmin={isPrivileged}
              />
            </CardContent>
          </Card>
        )}

        {activeTab === "tools" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-6 rounded-3xl border border-white shadow-xl shadow-primary/5">
              <div>
                <h2 className="text-2xl font-black text-primary tracking-tighter uppercase italic">Inventario de Equipos</h2>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Control y asignación de herramientas de terreno</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {isAdmin && (
                  <>
                    <Button onClick={() => setTab("tool-history")} className="h-12 px-6 rounded-2xl bg-white text-primary border border-primary/10 hover:bg-primary/5 font-black uppercase tracking-tighter gap-2 shadow-lg shadow-primary/5 active:scale-95 transition-all">
                      <History size={20} /> Actas
                    </Button>
                    <Button onClick={() => setReportModalOpen(true)} className="h-12 px-6 rounded-2xl bg-white text-primary border border-primary/10 hover:bg-primary/5 font-black uppercase tracking-tighter gap-2 shadow-lg shadow-primary/5 active:scale-95 transition-all">
                      <FileText size={20} /> Reporte
                    </Button>
                    <Button onClick={() => { setEditingTool(null); setToolModalOpen(true); }} className="h-12 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-tighter gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all">
                      <Plus size={20} /> Nueva Herramienta
                    </Button>
                  </>
                )}
              </div>
            </div>

            {isAdmin && Object.keys(toolsSummary).length > 0 && (
              <div className="bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white shadow-xl shadow-primary/5 animate-in slide-in-from-top duration-500">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-primary uppercase italic tracking-tighter">Resumen de Asignaciones</h3>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">¿Quién tiene qué instrumentos hoy?</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Object.entries(toolsSummary).map(([name, toolsList]: [string, any]) => (
                    <div key={name} className="bg-white/80 p-4 rounded-2xl border border-white shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                          <UserRound size={16} />
                        </div>
                        <span className="font-black text-primary text-xs uppercase truncate">{name}</span>
                      </div>
                      <div className="space-y-1.5 ml-2 border-l-2 border-primary/10 pl-3">
                        {toolsList.map((toolName: string, i: number) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />
                            <span className="text-xs font-bold text-muted-foreground uppercase leading-tight">{toolName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {myTools.length > 0 && (
              <div className="bg-accent/10 backdrop-blur-md p-6 rounded-3xl border border-accent/20 shadow-xl shadow-accent/5 animate-in slide-in-from-top duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/20 rounded-xl text-primary">
                      <Wrench size={20} />
                    </div>
                    <div>
                      <h3 className="font-black text-primary uppercase italic tracking-tighter">Mis Herramientas</h3>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Equipos bajo tu responsabilidad actualmente</p>
                    </div>
                  </div>
                  {myTools.length > 0 && (
                    <div className="flex gap-2">
                       {selectedToolIds.length > 0 && (
                        <Button
                          variant="ghost"
                          onClick={() => setSelectedToolIds([])}
                          className="h-10 px-4 rounded-xl text-primary/60 font-black uppercase text-[10px] tracking-widest hover:bg-primary/5 transition-all"
                        >
                          Limpiar
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          if (selectedToolIds.length === 0) {
                            setSelectedToolIds(myTools.map((t: any) => t.id));
                          } else {
                            setReturnAllModalOpen(true);
                          }
                        }}
                        className={cn(
                          "h-10 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg active:scale-95 whitespace-nowrap",
                          selectedToolIds.length > 0 
                            ? "bg-primary text-white shadow-primary/20 hover:bg-primary/90" 
                            : "bg-white text-primary border border-primary/10 shadow-primary/5 hover:bg-primary/5"
                        )}
                      >
                        <History size={14} className="mr-2" /> 
                        {selectedToolIds.length > 0 
                          ? `Devolver Seleccionadas (${selectedToolIds.length})` 
                          : "Seleccionar Todas"}
                      </Button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {myTools.map((tool: any) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      isSelected={selectedToolIds.includes(tool.id)}
                      onToggle={toggleToolSelection}
                      onReturn={(t) => {
                        setReturningTool(t);
                        setReturnModalOpen(true);
                      }}
                      isAdmin={isAdmin}
                      userIdentifier={userIdentifier}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="font-black text-primary uppercase italic tracking-tighter">Herramientas Disponibles</h3>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Equipos listos para ser retirados</p>
                </div>
              </div>
              <div className="flex gap-2">
                {selectedAvailableToolIds.length > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedAvailableToolIds([])}
                    className="h-10 px-4 rounded-xl text-primary/60 font-black uppercase text-[10px] tracking-widest hover:bg-primary/5 transition-all"
                  >
                    Limpiar
                  </Button>
                )}
                <Button
                  onClick={() => {
                    if (selectedAvailableToolIds.length > 0) {
                      handleAssignMultiple();
                    } else {
                      const availableOnly = filteredTools.filter((t: any) => t.estado === 'Disponible');
                      setSelectedAvailableToolIds(availableOnly.map((t: any) => t.id));
                    }
                  }}
                  disabled={isAssigning}
                  className={cn(
                    "h-10 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg active:scale-95 whitespace-nowrap gap-2",
                    selectedAvailableToolIds.length > 0 
                      ? "bg-accent text-primary shadow-accent/20 hover:bg-accent/90" 
                      : "bg-white text-primary border border-primary/10 shadow-primary/5 hover:bg-primary/5"
                  )}
                >
                  {isAssigning ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  {selectedAvailableToolIds.length > 0 
                    ? `Tomar Seleccionadas (${selectedAvailableToolIds.length})` 
                    : "Seleccionar Disponibles"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {isToolsLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="h-48 rounded-3xl bg-white/50 animate-pulse border border-white" />
                ))
              ) : filteredTools.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-white/30 backdrop-blur-sm rounded-3xl border-2 border-dashed border-primary/10">
                  <Package size={48} className="mx-auto text-primary/20 mb-4" />
                  <p className="font-black text-primary/40 uppercase tracking-widest italic">No hay herramientas registradas</p>
                </div>
              ) : (
                filteredTools.map((tool: any) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    isSelected={selectedAvailableToolIds.includes(tool.id)}
                    onToggle={toggleAvailableToolSelection}
                    onSave={handleSaveTool}
                    onReturn={(t) => {
                      setReturningTool(t);
                      setReturnModalOpen(true);
                    }}
                    onEdit={(t) => { setEditingTool(t); setToolModalOpen(true); }}
                    onDelete={(id, type) => setDeleteConfirm({ id, type: type as any })}
                    isAdmin={isAdmin}
                    userIdentifier={userIdentifier}
                    isAvailableSection={true}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "tool-history" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-6 rounded-3xl border border-white shadow-xl shadow-primary/5">
              <div>
                <h2 className="text-2xl font-black text-primary tracking-tighter uppercase italic">Actas de Movimiento</h2>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Historial inmutable de asignaciones y devoluciones</p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white shadow-xl shadow-primary/5 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Herramienta / Equipo</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Responsable</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Retiro (Asignación)</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Devolución (Acta)</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isMovementsLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          <div className="flex justify-center items-center text-primary font-bold animate-pulse gap-2">
                            <Loader2 size={16} className="animate-spin" /> Cargando Actas...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : !movements || movements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">
                          No hay actas de movimiento registradas.
                        </TableCell>
                      </TableRow>
                    ) : (() => {
                      // Grouping logic for Batch Acts
                      const groupedMovements: any[] = [];
                      const processedBatches = new Set();

                      movements.forEach((mov: any) => {
                        if (mov.batchId) {
                          if (!processedBatches.has(mov.batchId)) {
                            // Find all movements in this batch
                            const batchItems = movements.filter((m: any) => m.batchId === mov.batchId);
                            groupedMovements.push({
                              type: 'batch',
                              id: mov.batchId,
                              timestamp: mov.timestamp,
                              responsible: mov.responsible,
                              action: mov.action,
                              items: batchItems
                            });
                            processedBatches.add(mov.batchId);
                          }
                        } else {
                          groupedMovements.push({
                            type: 'single',
                            ...mov
                          });
                        }
                      });

                      return groupedMovements.map((group: any, idx: number) => {
                        if (group.type === 'batch') {
                          const isAssignmentBatch = group.action === 'Asignación';
                          return (
                            <TableRow key={group.id} className="group hover:bg-primary/5 transition-all">
                              <TableCell className="py-6">
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center gap-2">
                                    <div className={cn(
                                      "w-8 h-8 rounded-full flex items-center justify-center",
                                      isAssignmentBatch ? "bg-accent/20 text-primary" : "bg-primary/10 text-primary"
                                    )}>
                                      {isAssignmentBatch ? <ArrowRight size={14} /> : <Package size={16} />}
                                    </div>
                                    <span className="font-black text-primary text-xs uppercase tracking-tighter">
                                      {isAssignmentBatch ? 'Acta de Salida' : 'Devolución Unificada'} ({group.items.length} equipos)
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs font-black uppercase text-primary/70">{group.responsible}</TableCell>
                              <TableCell className="text-xs font-bold text-muted-foreground italic">{isAssignmentBatch ? 'Salida Masiva' : 'Multiposesión'}</TableCell>
                              <TableCell className="text-xs font-bold text-primary">
                                {new Date(group.timestamp).toLocaleString('es-CL', {
                                  day: '2-digit', month: '2-digit', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                })}
                              </TableCell>
                              <TableCell className="text-right flex items-center justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setViewingActa(group)}
                                  className="h-9 w-9 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 border border-primary/10"
                                >
                                  <Eye size={14} />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => generateBatchReturnActPDF(group.items)}
                                  className="h-9 px-4 rounded-xl bg-primary text-white font-black text-[10px] uppercase hover:bg-primary/90 shadow-lg shadow-primary/10 gap-2"
                                >
                                  <FileText size={14} /> Acta PDF
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        }

                        // Single assignment or old return
                        const mov = group;
                        return (
                          <TableRow key={mov.id} className="hover:bg-muted/10 opacity-80">
                            <TableCell className="font-bold text-primary text-xs uppercase">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <div className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center",
                                    mov.action === 'Asignación' ? "bg-primary/10 text-primary" : "bg-accent/10 text-primary"
                                  )}>
                                    {mov.action === 'Asignación' ? <ArrowRight size={12} /> : <CheckCircle size={12} />}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="leading-tight">{mov.action === 'Asignación' ? 'Asignación Individual' : 'Devolución Individual'}</span>
                                  </div>
                                </div>
                                <Badge className={cn(
                                  "text-[7px] w-fit font-black uppercase px-1 py-0 border-none mt-1 ml-8",
                                  mov.action === 'Devolución' ? "bg-accent/20 text-primary" : "bg-primary/10 text-primary"
                                )}>
                                  {mov.action}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs font-black uppercase text-primary/70">{mov.responsible || 'N/A'}</TableCell>
                            <TableCell className="text-xs font-bold text-muted-foreground italic">
                              {mov.action === 'Devolución' && mov.assignmentDate ? (
                                new Date(mov.assignmentDate).toLocaleString('es-CL', {
                                  day: '2-digit', month: '2-digit', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                })
                              ) : mov.action === 'Asignación' ? (
                                 new Date(mov.timestamp).toLocaleString('es-CL', {
                                  day: '2-digit', month: '2-digit', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                })
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-xs font-bold text-primary">
                              {new Date(mov.timestamp).toLocaleString('es-CL', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </TableCell>
                            <TableCell className="text-right flex items-center justify-end gap-2 pr-6">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setViewingActa(mov)}
                                className="h-8 w-8 rounded-lg bg-primary/5 text-primary hover:bg-primary/10 border border-primary/10"
                              >
                                <Eye size={14} />
                              </Button>
                              {(mov.action === 'Devolución' || mov.action === 'Asignación') && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => generateBatchReturnActPDF([mov])}
                                  className="h-8 w-8 rounded-lg bg-primary/5 text-primary hover:bg-primary hover:text-white"
                                >
                                  <FileText size={14} />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      });
                    })()}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent className="rounded-3xl border-none">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-black text-primary uppercase italic tracking-tighter">
                ¿Confirmar Eliminación?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {(!isAdmin && ['projects', 'ordenes', 'historial'].includes(deleteConfirm?.type || '')) 
                  ? "Este registro se borrará de sus registros. Esta acción no se puede deshacer para su cuenta."
                  : "Esta acción no se puede deshacer. El registro se eliminará permanentemente de la base de datos de ICSA."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-2xl font-bold">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 rounded-2xl font-bold text-white">
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={!!viewingActa} onOpenChange={(open) => !open && setViewingActa(null)}>
          <DialogContent className="rounded-3xl border-none max-w-2xl bg-white/95 backdrop-blur-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-8 pb-4 shrink-0 bg-primary/5 border-b border-primary/5">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl font-black text-primary uppercase italic tracking-tighter">
                    {viewingActa?.action === 'Asignación' ? 'Acta de Salida' : 'Acta de Devolución'}
                  </DialogTitle>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Documento de control interno ICSA</p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-primary uppercase tracking-tighter">Fecha y Hora</div>
                  <div className="text-xs font-bold text-muted-foreground">
                    {viewingActa && new Date(viewingActa.timestamp).toLocaleString('es-CL', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto p-8 pt-6 scrollbar-thin scrollbar-thumb-primary/10">
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-primary/50 uppercase tracking-widest">Responsable</span>
                    <p className="text-sm font-black text-primary uppercase">{viewingActa?.responsible || viewingActa?.items?.[0]?.responsible}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-primary/50 uppercase tracking-widest">Tipo de Movimiento</span>
                    <p className="text-sm font-black text-primary uppercase italic">
                      {viewingActa?.type === 'batch' ? (viewingActa.action === 'Asignación' ? 'Salida Masiva' : 'Devolución Unificada') : 'Individual'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] border-b border-primary/10 pb-2">Equipos y Herramientas</h4>
                  <div className="space-y-3">
                    {(viewingActa?.items || [viewingActa]).map((item: any, i: number) => (
                      <div key={i} className="bg-primary/[0.02] border border-primary/5 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between group hover:bg-primary/[0.04] transition-all gap-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-black text-primary uppercase tracking-tight">{item?.toolName || 'Equipo Desconocido'}</span>
                          <div className="flex flex-wrap items-center gap-3">
                            {item?.marca && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-black text-primary/40 uppercase tracking-widest">Marca:</span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.marca} {item.modelo}</span>
                              </div>
                            )}
                            {(item?.codigoInterno || item?.serie) && (
                              <div className="flex items-center gap-1.5 border-l border-primary/10 pl-3">
                                <span className="text-[9px] font-black text-primary/40 uppercase tracking-widest">Identificación:</span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.codigoInterno || item.serie}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {item?.comment && (
                          <div className="text-[10px] font-medium text-muted-foreground italic bg-accent/10 px-4 py-2 rounded-xl max-w-sm">
                            "{item.comment}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-primary/5 p-6 rounded-2xl border border-dashed border-primary/20">
                  <p className="text-[9px] font-bold text-primary/60 text-center leading-relaxed">
                    Este documento es una representación digital del movimiento de herramientas. 
                    Toda asignación implica la responsabilidad directa del personal sobre el cuidado y buen uso del equipamiento.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 bg-white border-t border-primary/5 gap-3">
              <Button 
                variant="outline" 
                onClick={() => setViewingActa(null)}
                className="rounded-xl font-bold uppercase text-[10px] h-10 px-6 border-primary/10"
              >
                Cerrar
              </Button>
              <Button 
                onClick={() => generateBatchReturnActPDF(viewingActa?.items || [viewingActa])}
                className="bg-primary hover:bg-primary/90 text-white rounded-xl font-black uppercase text-[10px] h-10 px-6 shadow-lg shadow-primary/20 gap-2"
              >
                <Download size={14} /> Descargar PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={toolModalOpen} onOpenChange={(open) => { setToolModalOpen(open); if (!open) setEditingTool(null); }}>
          <DialogContent className="rounded-3xl border-none max-w-lg bg-white/95 backdrop-blur-2xl max-h-[95vh] md:max-h-[85vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-8 pb-2 shrink-0 relative">
              <DialogTitle className="text-3xl font-black text-primary uppercase italic tracking-tighter">
                {editingTool ? "Editar Herramienta" : "Nueva Herramienta"}
              </DialogTitle>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Gestión del equipamiento técnico</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setToolModalOpen(false)}
                className="absolute top-8 right-6 z-50 rounded-xl h-10 w-10 bg-primary/5 hover:bg-primary/10 text-primary/40 hover:text-primary transition-all border border-primary/5 shadow-sm active:scale-95"
              >
                <X size={20} />
              </Button>
            </DialogHeader>
            <form onSubmit={(e: any) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = {
                id: editingTool?.id || crypto.randomUUID(),
                nombre: formData.get("nombre"),
                marca: formData.get("marca"),
                modelo: formData.get("modelo"),
                categoria: formData.get("categoria"),
                estado: formData.get("estado"),
                asignadoA: formData.get("asignadoA"),
                notas: formData.get("notas"),
                imageUrl: toolImage,
                codigoInterno: formData.get("codigoInterno"),
                descripcion: formData.get("descripcion"),
                createdAt: editingTool?.createdAt || new Date().toISOString()
              };
              handleSaveTool(data);
            }} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 px-6 overflow-y-auto min-h-0">
                <div className="space-y-4 py-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-primary ml-1">Foto de la Herramienta</Label>
                    <PhotoUpload
                      photos={toolImage ? [toolImage] : []}
                      onChange={(photos) => setToolImage(photos[0] || "")}
                      maxPhotos={1}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="codigoInterno" className="text-xs font-black uppercase tracking-widest text-primary ml-1">ID Interno / N° Inventario</Label>
                      <Input id="codigoInterno" name="codigoInterno" defaultValue={editingTool?.codigoInterno} placeholder="Ej: ESC-01" required className="rounded-xl border-primary/10 h-11 focus:ring-primary/20" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="nombre" className="text-xs font-black uppercase tracking-widest text-primary ml-1">Nombre Herramienta</Label>
                      <Input id="nombre" name="nombre" defaultValue={editingTool?.nombre} placeholder="Ej: Escalera Tijera" required className="rounded-xl border-primary/10 h-11 focus:ring-primary/20" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="categoria" className="text-xs font-black uppercase tracking-widest text-primary ml-1">Categoría</Label>
                      <Select name="categoria" defaultValue={editingTool?.categoria || "Eléctrica"}>
                        <SelectTrigger className="rounded-xl border-primary/10 h-11"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                          <SelectItem value="Eléctrica">Herramienta Eléctrica</SelectItem>
                          <SelectItem value="Manual">Herramienta Manual</SelectItem>
                          <SelectItem value="Medición">Medición / Instrumentación</SelectItem>
                          <SelectItem value="Computación">Computación / Redes</SelectItem>
                          <SelectItem value="Altura">Altura / Escaleras</SelectItem>
                          <SelectItem value="Seguridad">Seguridad / EPP</SelectItem>
                          <SelectItem value="Aseo">Aseo / Aspiradoras</SelectItem>
                          <SelectItem value="Soldadura">Soldadura</SelectItem>
                          <SelectItem value="Otro">Otro / Insumos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="marca" className="text-xs font-black uppercase tracking-widest text-primary ml-1">Marca</Label>
                      <Input id="marca" name="marca" defaultValue={editingTool?.marca} placeholder="Ej: Bosch" className="rounded-xl border-primary/10 h-11" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="modelo" className="text-xs font-black uppercase tracking-widest text-primary ml-1">Modelo</Label>
                      <Input id="modelo" name="modelo" defaultValue={editingTool?.modelo} placeholder="Ej: GSB 13 RE" className="rounded-xl border-primary/10 h-11" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="estado" className="text-xs font-black uppercase tracking-widest text-primary ml-1">Estado</Label>
                    <Select name="estado" defaultValue={editingTool?.estado || "Disponible"}>
                      <SelectTrigger className="rounded-xl border-primary/10 h-11"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-2xl">
                        <SelectItem value="Disponible">Disponible</SelectItem>
                        <SelectItem value="En Terreno">En Terreno</SelectItem>
                        <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                        <SelectItem value="De Baja">De Baja</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="descripcion" className="text-xs font-black uppercase tracking-widest text-primary ml-1">Descripción / Detalles</Label>
                    <Input id="descripcion" name="descripcion" defaultValue={editingTool?.descripcion} placeholder="Ej: Incluye maletín, cargador y puntas" className="rounded-xl border-primary/10 h-11" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="asignadoA" className="text-xs font-black uppercase tracking-widest text-primary ml-1">Responsable Actual</Label>
                    <Input id="asignadoA" name="asignadoA" defaultValue={editingTool?.asignadoA} placeholder="Técnico o Proyecto asignado" className="rounded-xl border-primary/10 h-11" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="notas" className="text-xs font-black uppercase tracking-widest text-primary ml-1">Historial / Observaciones</Label>
                    <Textarea id="notas" name="notas" defaultValue={editingTool?.notas} placeholder="Historial de uso, fallas o detalles adicionales..." className="rounded-xl border-primary/10 min-h-[100px] resize-none" />
                  </div>
                  <div className="h-8" />
                </div>
              </div>

              <DialogFooter className="p-6 pt-4 gap-3 border-t border-primary/5 bg-primary/[0.02] backdrop-blur-sm shrink-0">
                <Button type="button" variant="ghost" onClick={() => setToolModalOpen(false)} className="rounded-xl font-black uppercase text-xs tracking-widest flex-1 h-12">Cancelar</Button>
                <Button type="submit" className="rounded-xl bg-primary text-white font-black uppercase tracking-widest h-12 px-8 flex-1 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">Guardar Cambios</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
          <DialogContent className="rounded-3xl border-none w-[95vw] md:max-w-4xl bg-white/95 backdrop-blur-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-8 pb-4 shrink-0 relative">
              <DialogTitle className="text-3xl font-black text-primary uppercase italic tracking-tighter">Reporte de Inventario</DialogTitle>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Resumen detallado del equipamiento técnico</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setReportModalOpen(false)}
                className="absolute top-8 right-6 z-50 rounded-xl h-10 w-10 bg-primary/5 hover:bg-primary/10 text-primary/40 hover:text-primary transition-all border border-primary/5 shadow-sm active:scale-95"
              >
                <X size={20} />
              </Button>
            </DialogHeader>

            <div className="flex-1 px-8 overflow-y-auto min-h-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 py-2">
                {[
                  { label: "Total Equipos", value: (tools || []).length, color: "bg-primary/5 text-primary" },
                  { label: "Disponibles", value: (tools || []).filter((t: any) => t.estado === 'Disponible').length, color: "bg-accent/10 text-primary" },
                  { label: "En Terreno", value: (tools || []).filter((t: any) => t.estado === 'En Terreno').length, color: "bg-primary text-white" },
                  { label: "Fuera de Uso", value: (tools || []).filter((t: any) => t.estado === 'Mantenimiento' || t.estado === 'De Baja').length, color: "bg-destructive/10 text-destructive" },
                ].map((stat, i) => (
                  <div key={i} className={cn("p-4 rounded-2xl border border-white shadow-sm flex flex-col justify-center items-center text-center", stat.color)}>
                    <span className="text-2xl font-black italic tracking-tighter leading-none mb-1">{stat.value}</span>
                    <span className="text-[10px] font-black uppercase opacity-60">{stat.label}</span>
                  </div>
                ))}
              </div>

              <div className="bg-white/50 rounded-2xl border border-primary/5 overflow-hidden mb-8">
                {reportPeriod === 'all' ? (
                  <Table>
                    <TableHeader className="bg-primary/5">
                      <TableRow className="border-primary/5 hover:bg-transparent">
                        <TableHead className="text-[10px] font-black uppercase text-primary tracking-widest">ID</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-primary tracking-widest">Herramienta</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-primary tracking-widest">Fechas (Ingreso/Dev.)</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-primary tracking-widest">Estado/Responsable</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-primary tracking-widest">Observaciones Consolidadas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isToolsLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="animate-spin text-primary" size={24} />
                              <span className="text-[10px] font-black uppercase text-muted-foreground">Cargando datos...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (tools || []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center text-[10px] font-black uppercase text-muted-foreground italic">
                            No hay herramientas registradas en el sistema.
                          </TableCell>
                        </TableRow>
                      ) : (tools || []).map((tool: any) => (
                        <TableRow key={tool.id} className="border-primary/5">
                          <TableCell className="text-[11px] font-black text-primary/40 uppercase">{tool.codigoInterno || 'N/A'}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-[11px] font-black text-primary uppercase leading-tight">{tool.nombre}</span>
                              <span className="text-[9px] font-bold text-muted-foreground uppercase">{tool.marca} {tool.modelo}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1 text-[9px] font-bold text-primary/60 uppercase">
                                <Clock size={10} className="text-primary/30" />
                                <span>In: {tool.createdAt ? new Date(tool.createdAt).toLocaleDateString() : 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[9px] font-bold text-accent uppercase">
                                <History size={10} className="text-accent/30" />
                                <span>Out: {tool.lastReturnDate ? new Date(tool.lastReturnDate).toLocaleDateString() : '-'}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge className={cn(
                                "text-[8px] font-black uppercase px-2 py-0 border-none w-fit",
                                tool.estado === 'Disponible' ? "bg-accent text-primary" :
                                  tool.estado === 'En Terreno' ? "bg-primary text-white" : "bg-destructive text-white"
                              )}>{tool.estado}</Badge>
                              <span className="text-[10px] font-bold text-primary uppercase truncate max-w-[100px]">{tool.asignadoA || '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-h-[60px] overflow-y-auto pr-2 scrollbar-thin">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed whitespace-pre-wrap">
                                {tool.notas || '-'}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Table>
                    <TableHeader className="bg-primary/5">
                      <TableRow className="border-primary/5 hover:bg-transparent">
                        <TableHead className="text-[10px] font-black uppercase text-primary tracking-widest">Fecha / Hora</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-primary tracking-widest">Herramienta</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-primary tracking-widest">Acción</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-primary tracking-widest">Responsable</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-primary tracking-widest">Observación</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isMovementsLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="animate-spin text-primary" size={24} />
                              <span className="text-[10px] font-black uppercase text-muted-foreground">Cargando movimientos...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (movements || []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center text-[10px] font-black uppercase text-muted-foreground italic">
                            No hay movimientos registrados en este periodo.
                          </TableCell>
                        </TableRow>
                      ) : (movements || []).map((mov: any) => (
                        <TableRow key={mov.id} className="border-primary/5">
                          <TableCell className="text-[10px] font-bold text-primary/60 uppercase">
                            {new Date(mov.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-[11px] font-black text-primary uppercase">{mov.toolName}</TableCell>
                          <TableCell>
                            <Badge className={cn(
                              "text-[8px] font-black uppercase px-2 py-0 border-none w-fit",
                              mov.action === 'Asignación' ? "bg-primary text-white" : "bg-accent text-primary"
                            )}>{mov.action}</Badge>
                          </TableCell>
                          <TableCell className="text-[10px] font-bold text-primary uppercase">{mov.responsible}</TableCell>
                          <TableCell className="text-[10px] font-bold text-muted-foreground uppercase">{mov.comment || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>

            <DialogFooter className="p-8 pt-4 flex flex-col sm:flex-row gap-3 bg-white/50 backdrop-blur-sm border-t border-primary/5 shrink-0">
              <div className="flex-1 flex flex-col gap-2 order-2 sm:order-1">
                <Label className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Periodo del Reporte</Label>
                <Select value={reportPeriod} onValueChange={(v: any) => setReportPeriod(v)}>
                  <SelectTrigger className="rounded-xl border-primary/10 h-11 bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="all">Inventario Completo (Snapshot)</SelectItem>
                    <SelectItem value="daily">Reporte Diario (Movimientos Hoy)</SelectItem>
                    <SelectItem value="weekly">Reporte Semanal (Movimientos)</SelectItem>
                    <SelectItem value="monthly">Reporte Mensual (Movimientos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-[2] flex flex-col sm:flex-row gap-3 order-1 sm:order-2 self-end">
                <Button type="button" variant="ghost" onClick={() => setReportModalOpen(false)} className="rounded-xl font-bold flex-1 h-11">Cerrar</Button>
                <Button
                  type="button"
                  disabled={isToolsLoading || (tools || []).length === 0}
                  onClick={() => generateToolReportPDF(tools || [], movements || [], reportPeriod)}
                  className="rounded-xl bg-primary text-white font-black uppercase tracking-tighter px-6 flex-2 h-11 gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90"
                >
                  <FileText size={18} /> Descargar Reporte PDF
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={returnModalOpen} onOpenChange={(open) => { setReturnModalOpen(open); if (!open) setReturningTool(null); }}>
          <DialogContent className="rounded-[2.5rem] border-none max-w-md bg-white/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <DialogHeader className="p-8 pb-4">
              <DialogTitle className="text-3xl font-black text-primary uppercase italic tracking-tighter leading-none">
                Devolver Herramienta
              </DialogTitle>
              <CardDescription className="font-black text-accent uppercase text-[10px] tracking-[0.2em] mt-2 bg-accent/5 w-fit px-3 py-1 rounded-full border border-accent/10">
                {returningTool?.nombre} ({returningTool?.marca})
              </CardDescription>
            </DialogHeader>
            <form onSubmit={async (e: any) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const comment = formData.get("comment") as string;
              const timestamp = new Date().toLocaleString();
              const userIdentifier = userProfile?.name || user?.email || "Usuario";

              let updatedNotas = returningTool?.notas || "";
              if (comment.trim()) {
                const newNote = `[${timestamp} - ${userIdentifier}]: ${comment.trim()}`;
                updatedNotas = updatedNotas ? `${newNote}\n---\n${updatedNotas}` : newNote;
              }

              await handleSaveTool({
                ...returningTool,
                estado: 'Disponible',
                asignadoA: '',
                notas: updatedNotas,
                lastReturnDate: new Date().toISOString()
              }, tempSignature);
              setReturnModalOpen(false);
              setTempSignature("");
            }} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="px-8 pb-8 flex flex-col gap-4">
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="comment" className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">
                      Declaración de Estado / Fallos detectados
                    </Label>
                    <Textarea
                      id="comment"
                      name="comment"
                      placeholder="Ej: El equipo presenta desgaste en el cable, falla el gatillo, o se entrega en óptimas condiciones..."
                      className="rounded-2xl border-primary/10 min-h-[140px] focus:ring-primary/20 bg-primary/[0.02] font-medium p-4 text-sm leading-relaxed resize-none"
                      autoFocus
                    />
                  </div>

                  <div className="border-t border-primary/5 pt-4">
                    <SignaturePad
                      label="Firma de Entrega / Conformidad"
                      onSave={(url) => setTempSignature(url)}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="p-6 gap-3 bg-primary/[0.02] border-t border-primary/5">
                <Button type="button" variant="ghost" onClick={() => setReturnModalOpen(false)} className="flex-1 h-12 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-primary/5 transition-all">
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={!tempSignature}
                  className="flex-[2] h-12 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                >
                  Confirmar Devolución
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={returnAllModalOpen} onOpenChange={(open) => { setReturnAllModalOpen(open); if (!open) setTempSignature(""); }}>
          <DialogContent className="rounded-[2.5rem] border-none max-w-md bg-white/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <DialogHeader className="p-8 pb-4">
              <DialogTitle className="text-3xl font-black text-primary uppercase italic tracking-tighter leading-none">
                Devolver Lote de Herramientas
              </DialogTitle>
              <CardDescription className="font-black text-accent uppercase text-[10px] tracking-[0.2em] mt-2 bg-accent/5 w-fit px-3 py-1 rounded-full border border-accent/10">
                Vas a devolver {selectedToolIds.length} {selectedToolIds.length === 1 ? 'herramienta' : 'herramientas'}
              </CardDescription>
            </DialogHeader>
            <form onSubmit={async (e: any) => {
              e.preventDefault();
              try {
                const formData = new FormData(e.target);
                const comment = formData.get("comment") as string;
                const toolIds = selectedToolIds;
                const userIdentifier = userProfile?.name || user?.email || "Usuario";

                if (!tempSignature) {
                  toast({ title: "Firma requerida", variant: "destructive" });
                  return;
                }

                await returnMultipleTools(toolIds, comment, userIdentifier, tempSignature);
                toast({ title: "Equipos devueltos", description: "Se han generado las actas de devolución exitosamente." });
                setReturnAllModalOpen(false);
                setTempSignature("");
                setSelectedToolIds([]);
                setTimeout(() => window.location.reload(), 500);
              } catch (err: any) {
                toast({ title: "Error", description: err.message, variant: "destructive" });
              }
            }} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="px-8 pb-8 flex flex-col gap-4">
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="all-comment" className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">
                      Declaración de Estado General para el lote
                    </Label>
                    <Textarea
                      id="all-comment"
                      name="comment"
                      placeholder="Indique si algún equipo presenta fallos o desperfectos para su revisión técnica inmediata..."
                      className="rounded-2xl border-primary/10 min-h-[140px] focus:ring-primary/20 bg-primary/[0.02] font-medium p-4 text-sm leading-relaxed resize-none"
                      autoFocus
                    />
                  </div>

                  <div className="border-t border-primary/5 pt-4">
                    <SignaturePad
                      label="Firma de Devolución"
                      onSave={(url) => setTempSignature(url)}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="p-6 gap-3 bg-primary/[0.02] border-t border-primary/5">
                <Button type="button" variant="ghost" onClick={() => setReturnAllModalOpen(false)} className="flex-1 h-12 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-primary/5 transition-all">
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={!tempSignature}
                  className="flex-[2] h-12 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                >
                  Confirmar Devolución Masiva
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={assignmentModalOpen} onOpenChange={(open) => { setAssignmentModalOpen(open); if (!open) setTempSignature(""); }}>
          <DialogContent className="rounded-[2.5rem] border-none max-w-md bg-white/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl transition-all duration-300 flex flex-col max-h-[90vh]">
            <DialogHeader className="p-8 pb-4">
              <DialogTitle className="text-3xl font-black text-primary uppercase italic tracking-tighter leading-none">
                Confirmar Asignación
              </DialogTitle>
              <CardDescription className="font-black text-accent uppercase text-[10px] tracking-[0.2em] mt-2 bg-accent/5 w-fit px-3 py-1 rounded-full border border-accent/10">
                Lote de {selectedAvailableToolIds.length} herramientas
              </CardDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="px-8 pb-8 flex flex-col gap-6">
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <p className="text-[10px] font-bold text-primary/60 uppercase text-center leading-relaxed">
                    Al firmar, usted acepta la responsabilidad por el cuidado y buen uso del equipamiento asignado a su cargo.
                  </p>
                </div>

                <SignaturePad
                  label="Firma de Recepción (Asignación)"
                  onSave={(url) => setTempSignature(url)}
                />
              </div>
            </div>

            <DialogFooter className="p-6 gap-3 bg-primary/[0.02] border-t border-primary/5">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setAssignmentModalOpen(false)} 
                className="flex-1 h-12 rounded-2xl font-black uppercase text-xs tracking-widest"
              >
                Cancelar
              </Button>
              <Button 
                onClick={confirmAssignment}
                disabled={!tempSignature || isAssigning}
                className="flex-[2] h-12 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 disabled:opacity-50"
              >
                {isAssigning ? "Asignando..." : "Confirmar Recepción"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

function ProjectTable({ projects, isLoading, setDeleteConfirm, isAdmin }: { projects: any[], isLoading: boolean, setDeleteConfirm: any, isAdmin: boolean }) {
  return (
    <div className="w-full">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-black text-xs uppercase py-4 pl-6">Nombre de Proyecto</TableHead>
              <TableHead className="font-black text-xs uppercase">Cliente</TableHead>
              {isAdmin && <TableHead className="font-black text-xs uppercase">Responsable / Equipo</TableHead>}
              <TableHead className="font-black text-xs uppercase">Estado</TableHead>
              <TableHead className="text-right font-black text-xs uppercase pr-6">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <div className="flex justify-center items-center text-primary font-bold animate-pulse gap-2">
                    <Loader2 size={16} className="animate-spin" /> Cargando Proyectos...
                  </div>
                </TableCell>
              </TableRow>
            ) : projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                  Sin proyectos registrados
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project.id} className="hover:bg-muted/10">
                  <TableCell className="font-bold text-primary pl-6 py-4">{project.name}</TableCell>
                  <TableCell className="text-xs font-medium">{project.clientName}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-primary uppercase leading-tight">
                          {project.teamNames && project.teamNames.length > 0 ? project.teamNames[0] : 'Sin asignar'}
                        </span>
                        {project.teamNames && project.teamNames.length > 1 && (
                          <span className="text-[9px] font-bold text-muted-foreground uppercase">+{project.teamNames.length - 1} más</span>
                        )}
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant="outline" className="text-xs uppercase font-bold border-primary/20 text-primary">
                      {(project.status === 'Active' || project.status === 'Pendiente') ? 'EN EJECUCIÓN' : 'CERRADO'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6 py-4 flex justify-end gap-2">
                    <Link href={`/projects/${project.id}`}>
                      <Button variant="ghost" size="icon" title="Ver Detalles" className="h-8 w-8 text-primary hover:bg-primary hover:text-white rounded-lg"><Eye size={16} /></Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Borrar Proyecto"
                      onClick={() => setDeleteConfirm({ id: project.id, type: 'projects', name: project.name })}
                      className="h-8 w-8 text-destructive hover:bg-destructive hover:text-white rounded-lg"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden p-4 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-32 text-primary font-bold animate-pulse gap-3">
            <Loader2 size={32} className="animate-spin" />
            <span className="text-xs uppercase tracking-widest">Cargando...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground italic text-sm">Sin proyectos</div>
        ) : (
          projects.map((project, index) => (
            <div key={project.id} className="animate-slide-up" style={{ animationFillMode: 'both', animationDelay: `${index * 50}ms` }}>
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-xl shadow-primary/5 border border-white/50 active:scale-95 transition-all duration-200 flex items-center justify-between group">
                <Link href={`/projects/${project.id}`} className="flex-1">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={cn(
                        "text-xs font-black uppercase px-2 py-0.5 border-none",
                        (project.status === 'Active' || project.status === 'Pendiente') ? 'bg-accent/20 text-primary' : 'bg-muted text-muted-foreground'
                      )}>
                        {(project.status === 'Active' || project.status === 'Pendiente') ? 'Activo' : 'Cerrado'}
                      </Badge>
                    </div>
                    <h3 className="font-black text-primary text-xl leading-tight uppercase tracking-tighter">{project.name}</h3>
                    <p className="text-sm font-bold text-muted-foreground uppercase">{project.clientName}</p>
                    {isAdmin && project.teamNames && project.teamNames.length > 0 && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-dashed border-primary/10">
                        <UserRound size={12} className="text-primary/40" />
                        <span className="text-[10px] font-black text-primary/60 uppercase">{project.teamNames.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </Link>
                <div className="flex flex-col gap-2 ml-4">
                  <Link href={`/projects/${project.id}`}>
                    <div className="h-10 w-10 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-active:bg-primary group-active:text-white transition-colors">
                      <ArrowRight size={20} />
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      setDeleteConfirm({ id: project.id, type: 'projects', name: project.name });
                    }}
                    className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-2xl"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function OrderTable({ orders, isLoading, type, setDeleteConfirm, isAdmin }: { orders: any[], isLoading: boolean, type: string, setDeleteConfirm: any, isAdmin: boolean }) {
  return (
    <div className="w-full">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-black text-xs uppercase py-4 pl-6">Folio</TableHead>
              <TableHead className="font-black text-xs uppercase">Cliente</TableHead>
              {isAdmin && <TableHead className="font-black text-xs uppercase">Responsable (Técnico)</TableHead>}
              <TableHead className="font-black text-xs uppercase">Estado</TableHead>
              <TableHead className="text-right font-black text-xs uppercase pr-6">Gestión</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <div className="flex justify-center items-center text-primary font-bold animate-pulse gap-2">
                    <Loader2 size={16} className="animate-spin" /> Sincronizando OTs...
                  </div>
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                  Sin órdenes registradas
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const s = order.status?.toLowerCase();
                const isCompleted = s === 'completed' || s === 'completado' || type === 'historial';
                return (
                  <TableRow key={order.id} className="hover:bg-muted/10 group">
                    <TableCell className="py-4 pl-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-primary">{formatFolio(order.folio)}</span>
                        {order.isProjectSummary ? (
                          <span className="text-xs font-black text-primary uppercase bg-primary/10 px-1 py-0.5 rounded w-fit mt-1">Acta Final</span>
                        ) : (
                          <span className="text-xs text-muted-foreground truncate w-32 line-clamp-1" title={order.description}>{order.description || "Sin descripción"}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium">{order.clientName}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <span className="text-[10px] font-black text-primary uppercase bg-primary/5 px-2 py-1 rounded-lg border border-primary/5">
                          {order.techName || 'Sin Técnico'}
                        </span>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs uppercase font-bold border-none", isCompleted ? "bg-accent/20 text-primary" : "bg-primary/10 text-primary")}>
                        {isCompleted ? 'FINALIZADO' : 'PENDIENTE'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6 py-4">
                      <div className="flex justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {!isCompleted ? (
                          <Link href={`/work-orders/${order.id}/edit`}>
                            <Button variant="ghost" size="icon" title="Editar OT" className="h-8 w-8 text-primary hover:bg-primary hover:text-white rounded-lg"><Pencil size={16} /></Button>
                          </Link>
                        ) : (
                          <Link href={`/work-orders/${order.id}`}>
                            <Button variant="ghost" size="icon" title="Ver Detalles" className="h-8 w-8 text-primary hover:bg-primary hover:text-white rounded-lg"><Eye size={16} /></Button>
                          </Link>
                        )}
                        <Button variant="ghost" size="icon" title="Descargar PDF" className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-primary rounded-lg" onClick={() => generateWorkOrderPDF(order)}><Download size={16} /></Button>
                        <Button variant="ghost" size="icon" title="Eliminar" className="h-8 w-8 text-destructive hover:bg-destructive hover:text-white rounded-lg" onClick={() => setDeleteConfirm({ id: order.id, type })}><Trash2 size={16} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden p-4 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-32 text-primary font-bold animate-pulse gap-2">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground italic text-sm">Sin órdenes</div>
        ) : (
          orders.map((order, index) => {
            const s = order.status?.toLowerCase();
            const isCompleted = s === 'completed' || s === 'completado' || type === 'historial';
            return (
              <div key={order.id} className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-xl shadow-primary/5 border border-white/50 active:scale-95 transition-all duration-200 flex flex-col gap-4 animate-slide-up" style={{ animationFillMode: 'both', animationDelay: `${index * 50}ms` }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={cn(
                        "text-[8px] font-black uppercase px-2 py-0 border-none",
                        isCompleted ? "bg-accent/20 text-primary" : "bg-primary/10 text-primary"
                      )}>
                        {isCompleted ? 'Finalizada' : 'Pendiente'}
                      </Badge>
                      {order.isProjectSummary && (
                        <Badge className="text-[8px] font-black uppercase px-2 py-0 bg-primary/10 text-primary border-none">Acta Final</Badge>
                      )}
                    </div>
                    <h3 className="font-black text-primary text-lg leading-tight tracking-tighter">{formatFolio(order.folio)}</h3>
                    <p className="text-xs font-bold text-muted-foreground uppercase">{order.clientName}</p>
                    {isAdmin && (
                      <div className="flex items-center gap-2 mt-2 bg-primary/5 p-2 rounded-xl border border-primary/5">
                        <UserRound size={12} className="text-primary/40" />
                        <span className="text-[10px] font-black text-primary uppercase">{order.techName || 'Sin Técnico'}</span>
                      </div>
                    )}
                    {!order.isProjectSummary && (
                      <p className="text-[10px] text-muted-foreground mt-2 line-clamp-2 italic">{order.description || "Sin descripción"}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-dashed">
                  <div className="flex gap-2">
                    {!isCompleted ? (
                      <Link href={`/work-orders/${order.id}/edit`}>
                        <Button className="h-10 bg-primary rounded-xl font-black uppercase text-[10px] px-4">
                          <Pencil size={14} className="mr-2" /> Editar
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/work-orders/${order.id}`}>
                        <Button variant="outline" className="h-10 rounded-xl font-black uppercase text-[10px] px-4 border-primary/20 text-primary">
                          <Eye size={14} className="mr-2" /> Ver
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      onClick={() => generateWorkOrderPDF(order)}
                      className="h-10 w-10 rounded-xl bg-muted/50 text-muted-foreground"
                    >
                      <Download size={16} />
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    onClick={() => setDeleteConfirm({ id: order.id, type })}
                    className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-primary gap-4">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="font-black tracking-tighter text-xl uppercase">Cargando Dashboard...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
