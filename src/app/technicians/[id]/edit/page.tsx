
"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, ShieldCheck, KeyRound, Loader2, RefreshCw, AlertTriangle, User, Mail, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useUser, useUserProfile } from "@/lib/auth-provider";
import { getPersonnelById, updatePersonnel, changeUserPassword } from "@/actions/db-actions";
import { useActionData } from "@/hooks/use-action-data";
import { validateRut, formatRut } from "@/lib/rut-utils";
import { cn } from "@/lib/utils";

export default function EditTechnician({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const { userProfile, isProfileLoading } = useUserProfile();
  const { data: personnel, isLoading: isPersonnelLoading } = useActionData<any>(() => getPersonnelById(id), [id]);

  useEffect(() => {
    console.log("---- DEBUG TECH EDIT ----");
    console.log("ID PARAM:", id);
    console.log("IS LOADING:", isPersonnelLoading);
    console.log("PERSONNEL DATA:", personnel);
  }, [id, personnel, isPersonnelLoading]);

  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const initializedIdRef = React.useRef<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [formData, setFormData] = useState({
    nombre_t: "",
    rut_t: "",
    email_t: "",
    cel_t: "",
    rol_t: "tecnico",
    estado_t: "Activo",
    currentPassword: ""
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    if (personnel && personnel.id !== initializedIdRef.current) {
      // Normalizar el rol para que coincida con el Select
      const rawRole = personnel.rol_t || "tecnico";
      let normalizedRole = "tecnico";
      if (rawRole.toLowerCase().includes("admin")) normalizedRole = "admin";
      else if (rawRole.toLowerCase().includes("supervisor")) normalizedRole = "supervisor";
      else if (rawRole.toLowerCase().includes("tecnico") || rawRole.toLowerCase().includes("técnico")) normalizedRole = "tecnico";

      setFormData({
        nombre_t: personnel.nombre_t || personnel.name || "",
        rut_t: personnel.rut_t || personnel.rut || "",
        email_t: personnel.email || personnel.email_t || "",
        cel_t: personnel.telefono_t || personnel.cel_t || "",
        rol_t: normalizedRole,
        estado_t: personnel.estado_t || "Activo",
        currentPassword: personnel.password || "********"
      });
      initializedIdRef.current = personnel.id;
      console.log("[DATA_INIT] Form initialized aggressively with:", personnel);
    }
  }, [personnel]);

  useEffect(() => {
    if (!isUserLoading) {
      if (!user) {
        router.push("/login");
      } else {
        const role = user.role?.toLowerCase();
        if (role !== 'admin' && role !== 'administrador') {
          router.replace("/dashboard");
        }
      }
    }
  }, [user, isUserLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    setLoading(true);

    if (!formData.nombre_t || !formData.rut_t || !formData.email_t) {
      toast({ variant: "destructive", title: "Error", description: "Faltan campos requeridos." });
      setLoading(false);
      return;
    }

    if (!validateRut(formData.rut_t)) {
      toast({ variant: "destructive", title: "RUT Inválido", description: "Verifique el formato del RUT." });
      setLoading(false);
      return;
    }

    try {
      const { email_t, cel_t, ...rest } = formData;
      await updatePersonnel(id, {
        ...rest,
        email: email_t,
        telefono_t: cel_t,
        updatedAt: new Date().toISOString(),
        updatedBy: user.email
      });
      toast({ title: "Cambios Guardados", description: "El perfil ha sido actualizado correctamente." });
      router.push("/dashboard");
    } catch (error) {
      setLoading(false);
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el registro." });
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      toast({ variant: "destructive", title: "Error", description: "La contraseña debe tener al menos 6 caracteres." });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Las contraseñas no coinciden." });
      return;
    }

    setPasswordLoading(true);
    try {
      const result = await changeUserPassword(id, passwordData.newPassword);

      if (result.success) {
        toast({ title: "Contraseña Actualizada", description: "La clave de acceso ha sido cambiada con éxito." });
        setPasswordData({ newPassword: "", confirmPassword: "" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar la contraseña." });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (isUserLoading || isPersonnelLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-primary gap-4">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="font-black tracking-tighter text-xl uppercase">Cargando Perfil...</p>
      </div>
    );
  }

  if (!personnel && !isPersonnelLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center gap-6">
        <AlertTriangle className="h-20 w-20 text-destructive" />
        <div className="space-y-4">
          <h1 className="text-2xl font-black text-primary uppercase">No Encontrado</h1>
          <p className="text-muted-foreground font-medium max-w-sm mx-auto">
            El perfil solicitado con identificador <code className="bg-muted px-2 py-1 rounded text-primary font-bold">{id}</code> no existe en nuestros registros.
          </p>
          <div className="bg-muted/50 p-4 rounded-xl border border-dashed border-primary/20 text-left">
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Ayuda Técnica:</p>
            <ul className="text-[10px] space-y-1 text-muted-foreground font-medium list-disc ml-4">
              <li>Verifique si el colaborador fue eliminado recientemente.</li>
              <li>Asegúrese de que el ID en la URL sea correcto.</li>
              <li>Si es un administrador migrado, intente buscarlo en la lista nuevamente.</li>
            </ul>
          </div>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" className="font-bold">Volver al Dashboard</Button>
        </Link>
      </div>
    );
  }

  const isAdmin = userProfile?.rol_t?.toLowerCase() === 'admin' || 
    userProfile?.rol_t?.toLowerCase() === 'administrador';

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-white/80 backdrop-blur-2xl border-b border-primary/10 sticky top-0 z-40 shadow-[0_10px_30px_rgba(0,0,0,0.03)] h-16 flex items-center">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/technicians">
              <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 hover:bg-muted/50">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-black text-lg text-primary uppercase tracking-tighter">Editar Colaborador</h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Actualización de perfiles ICSA</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/90 font-black rounded-xl h-10 shadow-[0_6px_15px_rgba(var(--primary),0.2)] transition-all hover:-translate-y-0.5 px-6 gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span className="hidden sm:inline">Guardar Cambios</span>
              <span className="sm:hidden text-[10px]">Guardar</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-8 pb-12 max-w-2xl space-y-6">
        {/* Profile Summary Card */}
        <Card className="shadow-[0_15px_50px_rgba(0,0,0,0.04)] border-none bg-primary text-white rounded-3xl overflow-hidden animate-slide-up">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="h-20 w-20 rounded-3xl bg-white/10 flex items-center justify-center text-3xl font-black shadow-inner border border-white/10 shrink-0">
                {(formData.nombre_t || personnel?.nombre_t)?.substring(0, 2).toUpperCase() || "??"}
              </div>
              <div className="flex-1 text-center md:text-left space-y-1">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
                  <Badge className={cn("font-black uppercase text-[10px] px-3 py-1 border-none", 
                    (formData.estado_t || personnel?.estado_t) === 'Activo' ? "bg-accent text-primary" : "bg-destructive text-white"
                  )}>
                    {formData.estado_t || personnel?.estado_t || "Activo"}
                  </Badge>
                  <Badge className="bg-white/10 text-white font-black uppercase text-[10px] px-3 py-1 border-none">
                    {formData.rol_t || personnel?.rol_t}
                  </Badge>
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">{formData.nombre_t || personnel?.nombre_t || "Colaborador"}</h2>
                <div className="flex flex-col md:flex-row md:items-center gap-x-4 gap-y-1 text-white/60 font-bold text-[10px] uppercase">
                  {personnel?.createdAt && <span>Registrado: {new Date(personnel.createdAt).toLocaleDateString()}</span>}
                  {personnel?.updatedBy && <span>Último cambio por: {personnel.updatedBy}</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Diagnostic Data Viewer (Visible only for admins) */}
        <Card className="shadow-md border-2 border-primary/20 bg-muted/30 rounded-3xl overflow-hidden animate-slide-up animation-delay-75 border-dashed">
          <CardHeader className="py-4 px-6 border-b border-primary/10">
            <CardTitle className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Datos de Respaldo Actuales
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            {[
              { label: "Nombre", value: personnel?.nombre_t || personnel?.name || "No definido" },
              { label: "RUT", value: personnel?.rut_t || personnel?.rut || "No definido" },
              { label: "Email", value: personnel?.email || personnel?.email_t || "No definido" },
              { label: "Teléfono", value: personnel?.telefono_t || personnel?.cel_t || "No definido" },
              { label: "Estado", value: personnel?.estado_t || "No definido" },
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between items-center border-b border-black/5 pb-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">{item.label}:</span>
                <span className="text-[10px] font-black text-primary uppercase text-right truncate ml-4">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="shadow-[0_15px_50px_rgba(0,0,0,0.04)] border-none bg-white rounded-3xl overflow-hidden animate-slide-up animation-delay-100">
            <CardHeader className="bg-muted/5 p-6 border-b border-black/5">
              <CardTitle className="text-primary flex items-center gap-3 uppercase tracking-tighter font-black text-sm">
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                Información del Colaborador
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nombre Completo del Técnico</Label>
                  <Input 
                    value={formData.nombre_t} 
                    onChange={e => setFormData({ ...formData, nombre_t: e.target.value })} 
                    className="h-14 bg-muted/30 border-none rounded-2xl font-bold px-5 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-primary/20 transition-all" 
                    placeholder="Ej: Juan Pérez González"
                    required 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">RUT <span className="opacity-60 lowercase font-medium ml-1 tracking-normal">(ej: 12.345.678-9)</span></Label>
                    <Input 
                      value={formData.rut_t} 
                      onChange={e => setFormData({ ...formData, rut_t: formatRut(e.target.value) })} 
                      className="h-14 bg-muted/30 border-none rounded-2xl font-black px-5 text-sm uppercase ring-offset-background focus-visible:ring-2 focus-visible:ring-primary/20 transition-all" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Rol en el Sistema</Label>
                    <Select value={formData.rol_t} onValueChange={v => setFormData({ ...formData, rol_t: v })}>
                      <SelectTrigger className="h-14 bg-muted/30 border-none rounded-2xl font-black px-5 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-primary/20 transition-all">
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                      <SelectContent className="border-none shadow-2xl rounded-2xl">
                        <SelectItem value="admin" className="font-bold uppercase text-[10px] py-3">Administrador ICSA</SelectItem>
                        <SelectItem value="supervisor" className="font-bold uppercase text-[10px] py-3">Supervisor de Terreno</SelectItem>
                        <SelectItem value="tecnico" className="font-bold uppercase text-[10px] py-3">Técnico Instalador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Estado Operativo</Label>
                    <Select value={formData.estado_t} onValueChange={v => setFormData({ ...formData, estado_t: v })}>
                      <SelectTrigger className={cn(
                        "h-14 border-none rounded-2xl font-black px-5 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-primary/20 transition-all",
                        formData.estado_t === 'Activo' ? "bg-accent/10 text-primary" : "bg-destructive/10 text-destructive"
                      )}>
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent className="border-none shadow-2xl rounded-2xl">
                        <SelectItem value="Activo" className="font-black uppercase text-[10px] py-3">Activo (Habilitado)</SelectItem>
                        <SelectItem value="Inactivo" className="font-black uppercase text-[10px] py-3 text-destructive">Inactivo (Suspendido)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Teléfono de Contacto</Label>
                    <Input 
                      value={formData.cel_t} 
                      onChange={e => setFormData({ ...formData, cel_t: e.target.value })} 
                      className="h-14 bg-muted/30 border-none rounded-2xl font-bold px-5 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-primary/20 transition-all" 
                      placeholder="+56 9 ..."
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Correo Electrónico (Usuario)</Label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input 
                        type="email" 
                        value={formData.email_t} 
                        onChange={e => setFormData({ ...formData, email_t: e.target.value })} 
                        className="h-14 bg-muted/30 border-none rounded-2xl font-bold pl-12 pr-5 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-primary/20 transition-all" 
                        required 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>

        {isAdmin && (
          <Card className="shadow-[0_15px_50px_rgba(185,28,28,0.06)] border-none bg-white rounded-3xl overflow-hidden animate-slide-up animation-delay-200">
            <CardHeader className="bg-destructive/5 p-6 border-b border-destructive/5">
              <CardTitle className="text-destructive flex items-center gap-3 uppercase tracking-tighter font-black text-sm">
                <div className="h-8 w-8 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <KeyRound className="h-4 w-4" />
                </div>
                Seguridad y Acceso
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase ml-11 -mt-1 opacity-70">
                Gestión administrativa de credenciales
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Contraseña Actual en Sistema</Label>
                  <div className="relative group">
                    <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none group-focus-within:text-primary transition-colors" />
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      value={formData.currentPassword}
                      readOnly
                      className="h-14 bg-muted/30 border-none rounded-2xl font-black pl-12 pr-14 text-sm tracking-widest cursor-default select-none ring-0 focus-visible:ring-0"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary hover:bg-transparent"
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                  <p className="text-[9px] text-muted-foreground font-medium ml-1 flex items-center gap-1.5 opacity-60">
                    <ShieldCheck className="h-3 w-3" /> Solo visible para administradores. Esta es la clave vigente del usuario.
                  </p>
                </div>

                <div className="w-full h-px bg-muted md:col-span-2 my-2 opacity-50 border-dashed border-t" />

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={passwordData.newPassword}
                      onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="h-14 bg-muted/30 border-none rounded-2xl font-bold px-5 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-destructive/20 transition-all pr-14"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Confirmar Contraseña</Label>
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={passwordData.confirmPassword}
                    onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="h-14 bg-muted/30 border-none rounded-2xl font-bold px-5 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-destructive/20 transition-all"
                  />
                </div>
              </div>
              <Button
                onClick={handleUpdatePassword}
                disabled={passwordLoading}
                variant="outline"
                className="w-full h-14 border-2 border-destructive/20 text-destructive hover:bg-destructive hover:text-white font-black uppercase text-[10px] tracking-widest gap-3 rounded-2xl shadow-sm transition-all active:scale-95"
              >
                {passwordLoading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <KeyRound className="h-5 w-5" />}
                Actualizar Clave de Acceso
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
