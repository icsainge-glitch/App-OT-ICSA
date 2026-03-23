
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Briefcase, Search, Building2, CheckCircle2, LayoutList, Plus, User, Users, X, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useUser, useUserProfile } from "@/lib/auth-provider";
import { getClients, getPersonnel, createProject } from "@/actions/db-actions";
import { useActionData } from "@/hooks/use-action-data";
import { v4 as uuidv4 } from "uuid";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function NewProject() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const { userProfile, isProfileLoading } = useUserProfile();

  const [loading, setLoading] = useState(false);
  const [openClientSearch, setOpenClientSearch] = useState(false);
  const [openTeamSearch, setOpenTeamSearch] = useState(false);
  const [manualClientSearch, setManualClientSearch] = useState("");

  const { data: clients } = useActionData<any[]>(() => getClients(), []);
  const { data: allPersonnel } = useActionData<any[]>(() => getPersonnel(), []);

  const [formData, setFormData] = useState({
    name: "",
    clientId: "",
    clientName: "",
    teamNames: [] as string[],
    teamIds: [] as string[]
  });

  useEffect(() => {
    if (userProfile?.nombre_t && user && formData.teamIds.length === 0) {
      setFormData(prev => ({
        ...prev,
        teamNames: [userProfile.nombre_t!],
        teamIds: [user.uid]
      }));
    }
  }, [userProfile, user, formData.teamIds.length]);

  const handleSelectClient = (client: any) => {
    setFormData({ ...formData, clientId: client.id, clientName: client.nombreCliente });
    setOpenClientSearch(false);
  };

  const handleTeamSelect = (person: any) => {
    if (!formData.teamIds.includes(person.id)) {
      setFormData(prev => ({
        ...prev,
        teamNames: [...prev.teamNames, person.nombre_t],
        teamIds: [...prev.teamIds, person.id]
      }));
    }
    setOpenTeamSearch(false);
  };

  const handleTeamRemove = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      teamNames: prev.teamNames.filter((_: any, i: number) => prev.teamIds[i] !== memberId),
      teamIds: prev.teamIds.filter((id: string) => id !== memberId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.name.trim() || !formData.clientName.trim()) {
      toast({ variant: "destructive", title: "Faltan Datos", description: "El nombre del proyecto y el cliente son obligatorios." });
      return;
    }

    setLoading(true);
    const projectId = uuidv4();
    const projectData = {
      ...formData,
      id: projectId,
      status: "Active",
      createdBy: user.uid,
      creatorEmail: user.uid || "",
      startDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await createProject(projectData);
      toast({ title: "Proyecto Creado", description: "El proyecto ha sido iniciado con éxito." });
      router.push(`/projects/${projectId}`);
    } catch (error) {
      setLoading(false);
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el proyecto." });
    }
  };

  if (isUserLoading || isProfileLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Briefcase className="h-10 w-10 text-primary animate-bounce" />
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/20 pb-12 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed animate-fade-in">
      <header className="bg-white/80 backdrop-blur-2xl border-b border-primary/10 sticky top-0 z-40 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between max-w-2xl">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-black uppercase tracking-tighter text-primary">Iniciar Proyecto</h1>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.name || !formData.clientName}
            className="bg-primary hover:bg-primary/90 font-black h-11 px-8 rounded-xl shadow-lg transition-all active:scale-95"
          >
            {loading ? "Iniciando..." : "Crear Proyecto"}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="shadow-[0_15px_50px_rgba(0,0,0,0.04)] border-none bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden animate-slide-up">
          <CardHeader className="bg-transparent border-b border-black/5 p-8">
            <CardTitle className="text-xs font-black uppercase flex items-center justify-between text-primary tracking-[0.2em] w-full">
              <span className="flex items-center gap-3"><LayoutList className="h-4 w-4" /> Configuración de Proyecto</span>
              <span className="text-[9px] font-bold text-muted-foreground flex items-center gap-1 normal-case tracking-widest bg-muted/50 px-2 py-1 rounded-md">
                <span className="text-destructive">*</span> Obligatorios
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-10">
            <div className="space-y-4">
              <Label htmlFor="projectName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Nombre o Identificador del Proyecto <span className="text-destructive text-sm">*</span>
              </Label>
              <div className="relative group">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="projectName"
                  placeholder="Ej: Instalación Rack Sede Norte"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="h-16 pl-12 font-bold text-lg bg-muted/30 border-none focus-visible:ring-primary/20 shadow-inner rounded-2xl transition-all"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Empresa Contratante <span className="text-destructive text-sm">*</span>
              </Label>
              <div className="relative group">
                <Popover open={openClientSearch} onOpenChange={setOpenClientSearch}>
                  <PopoverTrigger asChild>
                    <div className="relative cursor-pointer">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        readOnly
                        placeholder="Haga clic para buscar empresa..."
                        value={formData.clientName}
                        className="h-16 pl-12 pr-24 font-bold text-lg bg-muted/30 border-none rounded-2xl cursor-pointer hover:bg-muted/50 transition-all"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {formData.clientId ? (
                          <Badge className="bg-primary text-white text-[8px] uppercase font-black">Vinculado</Badge>
                        ) : (
                          <Search className="h-5 w-5 text-primary opacity-50" />
                        )}
                      </div>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 shadow-2xl rounded-2xl border-none overflow-hidden" align="start">
                    <Command className="rounded-2xl">
                      <CommandInput 
                        placeholder="Buscar clientes registrados..." 
                        className="h-14 border-none focus:ring-0"
                        onValueChange={setManualClientSearch}
                      />
                      <CommandList className="max-h-[350px]">
                        <CommandEmpty className="p-8 text-center">
                          <p className="text-sm font-bold text-muted-foreground">No se encontraron clientes profesionales.</p>
                          <Button
                            variant="ghost"
                            className="mt-4 text-xs font-black text-primary uppercase"
                            onClick={() => {
                              if (manualClientSearch.trim()) {
                                setFormData({ ...formData, clientName: manualClientSearch.trim(), clientId: "" });
                                setOpenClientSearch(false);
                                setManualClientSearch("");
                              }
                            }}
                          >
                            Usar nombre manual
                          </Button>
                        </CommandEmpty>
                        <CommandGroup className="p-2">
                          {clients?.map((client) => (
                            <CommandItem
                              key={client.id}
                              onSelect={() => handleSelectClient(client)}
                              className="p-4 cursor-pointer rounded-xl aria-selected:bg-primary aria-selected:text-white transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-muted/20 flex items-center justify-center group-aria-selected:bg-white/20">
                                  <Building2 className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-black text-xs uppercase">{client.nombreCliente}</span>
                                  <span className="text-[10px] opacity-60 font-bold">{client.rutCliente}</span>
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Users className="h-4 w-4" /> Colaboradores del Proyecto
              </Label>
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.teamNames.map((name, index) => (
                  <Badge key={index} className="text-[10px] py-1.5 px-4 rounded-xl bg-primary/10 text-primary gap-3 font-black border-none">
                    {name}
                    {formData.teamIds[index] !== user?.uid && (
                      <button type="button" onClick={() => handleTeamRemove(formData.teamIds[index])} className="rounded-full bg-primary/20 hover:bg-primary/40 p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>

              <Popover open={openTeamSearch} onOpenChange={setOpenTeamSearch}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-14 text-xs font-black border-dashed border-2 rounded-2xl uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/5 transition-all">
                    <PlusCircle className="h-4 w-4 mr-2" /> Añadir Supervisores o Grupos
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] md:w-[400px] p-0 shadow-2xl rounded-2xl border-none overflow-hidden" align="center">
                  <Command>
                    <CommandInput placeholder="Buscar por nombre..." className="h-14 border-none focus:ring-0 font-bold" />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty className="p-6 text-center text-sm font-bold opacity-40">Sin resultados.</CommandEmpty>
                      <CommandGroup heading="Personal Autorizado" className="p-2">
                        {(allPersonnel || []).map(person => (
                          <CommandItem key={person.id} onSelect={() => handleTeamSelect(person)} className="p-4 cursor-pointer rounded-xl aria-selected:bg-primary aria-selected:text-white transition-all">
                            <User className="mr-3 h-5 w-5" />
                            <div className="flex flex-col">
                              <span className="font-black uppercase text-[10px]">{person.nombre_t}</span>
                              <span className="text-[8px] font-bold opacity-60">{person.rol_t}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-[9px] text-muted-foreground italic text-center">Añadir a otros supervisores les permitirá ver este proyecto y crear OTs vinculadas.</p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-12 flex justify-center">
          <div className="flex flex-col items-center gap-2 opacity-20">
            <span className="font-black text-lg tracking-tighter text-primary">ICSA</span>
            <span className="text-[6px] font-bold uppercase tracking-[0.3em]">ingeniería comunicaciones S.A.</span>
          </div>
        </div>
      </main>
    </div>
  );
}
