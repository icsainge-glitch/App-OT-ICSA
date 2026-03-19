
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { SignaturePad } from "@/components/SignaturePad";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, ArrowRight, Save, User, Briefcase, 
  CheckCircle2, Plus, Trash2, Shield, AlertTriangle, 
  Wrench, Users, Camera, X, Loader2 
} from "lucide-react";
import { useUser, useUserProfile } from "@/lib/auth-provider";
import { getActiveProjects, saveHPT, getNextFolioHPT } from "@/actions/db-actions";
import { useActionData } from "@/hooks/use-action-data";

const STEPS = [
  { id: 'general', title: 'General y Equipo', icon: Briefcase },
  { id: 'resources', title: 'Recursos y Permisos', icon: Wrench },
  { id: 'risks', title: 'Riesgos Potenciales', icon: AlertTriangle },
  { id: 'medidas', title: 'Medidas Seguridad', icon: CheckCircle2 },
  { id: 'epp', title: 'EPP Requerido', icon: Shield },
  { id: 'review', title: 'Firma Supervisor', icon: Save }
];

export function HPTForm({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const { userProfile, isProfileLoading } = useUserProfile();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: initialData?.id || undefined,
    projectId: initialData?.projectId || initialData?.projectid || "",
    supervisorName: initialData?.supervisorName || initialData?.supervisorname || "",
    supervisorRut: initialData?.supervisorRut || initialData?.supervisorrut || "",
    fecha: initialData?.fecha || new Date().toISOString().split('T')[0],
    trabajoRealizar: initialData?.trabajoRealizar || initialData?.trabajorealizar || "",
    firmaSupervisor: initialData?.firmaSupervisor || initialData?.firmasupervisor || "",
    status: initialData?.status || "Borrador"
  });

  const [recursos, setRecursos] = useState(initialData?.recursos || {
    personal: "N/A",
    equipos: "N/A",
    materiales: "N/A",
    coordinacionC: "N/A",
    bloqueo: "N/A",
    permisoC: "N/A"
  });

  const [riesgos, setRiesgos] = useState(initialData?.riesgos || {
    aprisionamiento: "N/A",
    atrapamiento: "N/A",
    caidaMismo: "N/A",
    caidaDistinto: "N/A",
    energiaE: "N/A",
    fluidosP: "N/A",
    sustanciasT: "N/A",
    temperaturas: "N/A",
    estadoP: "N/A",
    radiacion: "N/A",
    golpeadoC: "N/A",
    golpeadoO: "N/A",
    atropellado: "N/A",
    inmersion: "N/A",
    sobreesfuerzo: "N/A",
    cargasS: "N/A",
    incendioE: "N/A",
    otros: ""
  });

  const [medidas, setMedidas] = useState(initialData?.medidas || {
    limpiesa: "N/A",
    iluminacion: "N/A",
    ventilacion: "N/A",
    electricas: "N/A",
    superficies: "N/A",
    delimitada: "N/A",
    controlL: "N/A",
    enclavamiento: "N/A",
    eppAdecuado: "N/A",
    arnes: "N/A",
    fueraCarga: "N/A",
    izajes: "N/A",
    evitarIncendio: "N/A",
    zonaSeguridad: "N/A"
  });

  const [epp, setEpp] = useState(initialData?.epp || {
    casco: false,
    lentes: false,
    calzado: false,
    respiratorio: false,
    careta: false,
    guantes: false,
    legionario: false,
    barbiquejo: false,
    auditivo: false,
    soldar: false,
    solar: false,
    arnesY: false,
    otros: ""
  });

  const [workers, setWorkers] = useState<any[]>(initialData?.workers || []);
  const [folio, setFolio] = useState<number | string>(initialData?.folio || 0);

  const isAdmin = userProfile?.rol_t?.toLowerCase() === 'admin' || 
    userProfile?.rol_t?.toLowerCase() === 'administrador';

  const { data: projects } = useActionData<any[]>(() => {
    if (!user?.uid || isProfileLoading) return Promise.resolve([]);
    return getActiveProjects(user.uid, isAdmin);
  }, [user?.uid, isAdmin, isProfileLoading]);

  useEffect(() => {
    if (initialData?.folio) return;
    const fetchFolio = async () => {
      const next = await getNextFolioHPT();
      setFolio(next);
    };
    fetchFolio();
  }, [initialData]);

  useEffect(() => {
    if (userProfile && !formData.supervisorName) {
      setFormData(prev => ({
        ...prev,
        supervisorName: userProfile.nombre_t || "",
        supervisorRut: (userProfile as any).rut_t || ""
      }));
    }
  }, [userProfile]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const addWorker = () => {
    setWorkers(prev => [...prev, { nombre: "", rut: "", cargo: "", firma: "" }]);
  };

  const removeWorker = (index: number) => {
    setWorkers(prev => prev.filter((_, i) => i !== index));
  };

  const updateWorker = (index: number, field: string, value: string) => {
    setWorkers(prevWorkers => {
      const newWorkers = [...prevWorkers];
      newWorkers[index] = { ...newWorkers[index], [field]: value };
      return newWorkers;
    });
  };

  const onSubmit = async (isFinal: boolean = false) => {
    if (!user) return;
    
    // Validate worker signatures if finalizing
    if (isFinal) {
      const unsignedWorkers = workers.filter(w => !w.firma && w.nombre);
      if (unsignedWorkers.length > 0) {
        toast({ 
          variant: "destructive", 
          title: "Firmas Faltantes en Equipo", 
          description: `Faltan las firmas de: ${unsignedWorkers.map(w => w.nombre).join(", ")}` 
        });
        return;
      }
    }

    setLoading(true);

    const hptPayload = {
      ...formData,
      folio: folio,
      recursos,
      riesgos,
      medidas,
      epp,
      status: isFinal ? "Completado" : "Borrador",
      createdBy: user.uid,
      // Ensure lowercase keys for DB if it expects them
      projectid: formData.projectId,
      supervisorname: formData.supervisorName,
      supervisorrut: formData.supervisorRut,
      trabajorealizar: formData.trabajoRealizar,
      firmasupervisor: formData.firmaSupervisor
    };

    const result = await saveHPT(hptPayload, workers);
    setLoading(false);

    if (result.success) {
      toast({ title: isFinal ? "HPT Finalizado" : "Borrador Guardado", description: "El documento ha sido registrado exitosamente." });
      router.push("/hpt");
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
  };

  const StepIcon = STEPS[currentStep].icon;

  return (
    <div className="space-y-6">
      {/* Step Progress */}
      <div className="flex justify-between px-2 overflow-x-auto pb-4 gap-4 no-scrollbar">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === currentStep;
          const isPast = idx < currentStep;
          return (
            <div key={step.id} className="flex flex-col items-center gap-2 min-w-[60px]">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
                isActive ? 'bg-primary text-white scale-110 shadow-lg' : 
                isPast ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {isPast ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest text-center ${isActive ? 'text-primary' : 'text-muted-foreground opacity-50'}`}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      <Card className="shadow-2xl border-none bg-white rounded-[2.5rem] overflow-hidden animate-slide-up">
        <CardHeader className="bg-primary/5 p-8 border-b border-black/5">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl flex items-center gap-3 uppercase font-black tracking-tighter text-primary">
              <StepIcon className="h-7 w-7" /> {STEPS[currentStep].title}
            </CardTitle>
            <Badge variant="outline" className="font-black text-[10px] uppercase border-primary/20 text-primary px-3 py-1">
              Paso {currentStep + 1} de {STEPS.length}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
            
            {/* Step 0: General and Team */}
            {currentStep === 0 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Vincular a Proyecto</Label>
                    <select 
                      className="w-full h-14 rounded-2xl bg-muted/30 border-none px-6 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                      value={formData.projectId}
                      onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
                    >
                      <option value="">Independiente / Sin Proyecto</option>
                      {projects?.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Fecha</Label>
                    <Input type="date" value={formData.fecha} onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))} className="h-14 bg-muted/30 border-none rounded-2xl font-bold px-6 shadow-inner" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Supervisor a Cargo</Label>
                    <Input placeholder="Nombre completo" value={formData.supervisorName} onChange={(e) => setFormData(prev => ({ ...prev, supervisorName: e.target.value }))} className="h-14 bg-muted/30 border-none rounded-2xl font-bold px-6 shadow-inner" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">RUT Supervisor</Label>
                    <Input placeholder="Ej: 12.345.678-9" value={formData.supervisorRut} onChange={(e) => setFormData(prev => ({ ...prev, supervisorRut: e.target.value }))} className="h-14 bg-muted/30 border-none rounded-2xl font-bold px-6 shadow-inner" />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1 tracking-[0.2em]">Equipo de Trabajo (Máx 6)</Label>
                    {workers.length < 6 && (
                      <Button type="button" onClick={addWorker} variant="outline" size="sm" className="h-10 px-4 text-[10px] font-black uppercase rounded-xl border-primary/20 text-primary">
                        <Plus className="h-4 w-4 mr-2" /> Añadir Persona
                      </Button>
                    )}
                  </div>
                  <div className="space-y-4">
                    {workers.map((worker, idx) => (
                      <Card key={idx} className="bg-muted/10 border-none rounded-3xl p-6 relative">
                        <Button type="button" size="icon" variant="ghost" className="absolute top-2 right-2 text-destructive" onClick={() => removeWorker(idx)}>
                          <X className="h-5 w-5" />
                        </Button>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Nombre Trabajador</Label>
                            <Input value={worker.nombre} onChange={(e) => updateWorker(idx, 'nombre', e.target.value)} className="bg-white border-none rounded-2xl font-bold h-12 shadow-sm" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground">RUT</Label>
                            <Input value={worker.rut} onChange={(e) => updateWorker(idx, 'rut', e.target.value)} className="bg-white border-none rounded-2xl font-bold h-12 shadow-sm" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Cargo</Label>
                            <Input value={worker.cargo} onChange={(e) => updateWorker(idx, 'cargo', e.target.value)} className="bg-white border-none rounded-2xl font-bold h-12 shadow-sm" />
                          </div>
                          <div className="col-span-full space-y-4 mt-2">
                            <SignaturePad 
                              label={`Firma de ${worker.nombre || 'Integrante'}`} 
                              onSave={(url) => updateWorker(idx, 'firma', url)} 
                              initialValue={worker.firma}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Trabajo a Realizar ¿Cómo Ejecutaré Mi trabajo?</Label>
                  <Textarea placeholder="Describa el trabajo detalladamente..." value={formData.trabajoRealizar} onChange={(e) => setFormData(prev => ({ ...prev, trabajoRealizar: e.target.value }))} className="min-h-[150px] bg-muted/30 border-none rounded-3xl p-6 font-medium text-sm shadow-inner resize-none" />
                </div>
              </div>
            )}

            {/* Step 1: Resources */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">RECURSOS / COORDINACIÓN / PERMISOS:</p>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { id: 'personal', label: '1. ¿Se cuenta con el personal necesario y entrenado según el procedimiento de trabajo ICSA?' },
                    { id: 'equipos', label: '2. ¿Se cuenta con los Equipos, Herramientas necesarias, y estos se encuentran en buen estado de uso? (Aplico lista de Verificación.)' },
                    { id: 'materiales', label: '3. ¿Se dispone de los materiales, repuestos e insumos necesarios?' },
                    { id: 'coordinacionC', label: '4. ¿Se realizó coordinaciones necesarias con cliente para acceder a las zonas de trabajo?' },
                    { id: 'bloqueo', label: '5. ¿Se coordinó bloqueo de seguridad y/o líneas (Eléctricas, Hidráulicas, etc.)?' },
                    { id: 'permisoC', label: '6. ¿Se solicitó el permiso de ingreso al personal de prevención de riesgos cliente?' }
                  ].map((item) => (
                    <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/10 rounded-[2rem] gap-4">
                      <Label className="text-xs font-bold leading-tight flex-1">{item.label}</Label>
                      <div className="flex bg-white/50 p-1 rounded-xl shadow-inner gap-1 shrink-0">
                        {['SI', 'NO', 'N/A'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setRecursos((prev: any) => ({ ...prev, [item.id]: opt }))}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${
                              recursos[item.id as keyof typeof recursos] === opt 
                                ? 'bg-primary text-white shadow-md' 
                                : 'text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Risks */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                <p className="text-xs font-black text-primary uppercase tracking-widest mb-4">IDENTIFICACIÓN DE ACCIDENTES POTENCIALES O RIESGOS ASOCIADOS:</p>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { id: 'aprisionamiento', label: '1. Aprisionamiento. (Tableros, máquinas o equipos en movimiento...)' },
                    { id: 'atrapamiento', label: '2. Atrapamiento. (De o parte de todo el cuerpo por objetos en mov...)' },
                    { id: 'caidaMismo', label: '3. Caída al mismo nivel. (Al caminar en áreas con agua, hielo...)' },
                    { id: 'caidaDistinto', label: '4. Caída a distinto nivel. (Caballetes, andamios, escaleras...)' },
                    { id: 'energiaE', label: '5. Contacto con energía eléctrica. (Comando, tableros generales...)' },
                    { id: 'fluidosP', label: '6. Contacto con fluidos a presión. (Agua, aire, gases, vapor, etc)' },
                    { id: 'sustanciasT', label: '7. Contacto con sust. Tóxicas. (Cloro, flúor, ácido sulfúrico...)' },
                    { id: 'temperaturas', label: '8. Contacto con Temperaturas Extremas. (Calor o Frío...)' },
                    { id: 'estadoP', label: '9. Estado Personal. (Salud física/psicológica para ejecutar trabajo)' },
                    { id: 'radiacion', label: '10. Exposición a. (Radiación UV, ruidos, gases, polvos, humos, etc)' },
                    { id: 'golpeadoC', label: '11. Golpeado con o Contra Herr. (Objetos, estructuras, máquinas)' },
                    { id: 'golpeadoO', label: '12. Golpeado por objetos en Mov. (Cualquier elemento en movimiento)' },
                    { id: 'atropellado', label: '13. Atropellado Por Vehículo o Maq. (En movimiento)' },
                    { id: 'inmersion', label: '14. Por Inmersión (asfixia). (Espacios cerrados, sust. tóxicas)' },
                    { id: 'sobreesfuerzo', label: '15. Sobreesfuerzo. (Levantar carga sin ayuda o equipos)' },
                    { id: 'cargasS', label: '16. Cargas Suspendidas. (Exposición bajo cargas)' },
                    { id: 'incendioE', label: '17. Incendios, Explosión, Derrames.' }
                  ].map((item) => (
                    <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/10 rounded-2xl gap-3">
                      <Label className="text-[11px] font-bold leading-tight flex-1">{item.label}</Label>
                      <div className="flex bg-white/50 p-1 rounded-lg shadow-inner gap-1 shrink-0">
                        {['SI', 'NO', 'N/A'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setRiesgos((prev: any) => ({ ...prev, [item.id]: opt }))}
                            className={`px-3 py-1.5 rounded-md text-[9px] font-black transition-all ${
                              riesgos[item.id as keyof typeof riesgos] === opt 
                                ? 'bg-primary text-white' 
                                : 'text-muted-foreground'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="space-y-2 pt-4">
                    <Label className="font-black uppercase text-[10px] text-muted-foreground">18. Otros:</Label>
                    <Input placeholder="Especifique otros riesgos..." value={riesgos.otros} onChange={(e) => setRiesgos((prev: any) => ({ ...prev, otros: e.target.value }))} className="h-12 bg-muted/30 border-none rounded-2xl font-bold px-6" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Safety Measures */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                <p className="text-xs font-black text-primary uppercase tracking-widest mb-4">IDENTIFICACIÓN DE LAS MEDIDAS DE SEGURIDAD:</p>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { id: 'limpiesa', label: '1. El área de trabajo está limpia, ordenada y con accesos expeditos.' },
                    { id: 'iluminacion', label: '2. El área dispone de la iluminación requerida para la tarea.' },
                    { id: 'ventilacion', label: '3. El área dispone de la ventilación requerida para la tarea.' },
                    { id: 'electricas', label: '4. Las instalaciones eléc. portátiles se encuentran en buen estado.' },
                    { id: 'superficies', label: '5. Las superficies de trabajo se encuentran en buenas condiciones.' },
                    { id: 'delimitada', label: '6. Está delimitada la zona de bloqueo / movimientos de equipos.' },
                    { id: 'controlL', label: '7. Se verifica el control local de los bloqueos del o los equipos.' },
                    { id: 'enclavamiento', label: '8. Se verifica enclavamiento mecánico de andamios/escalas.' },
                    { id: 'eppAdecuado', label: '9. Se verifica la utilización de los EPP adecuados y en buen estado.' },
                    { id: 'arnes', label: '10. Se utilizan arnés de seguridad sobre 1,5 mt.' },
                    { id: 'fueraCarga', label: '11. Los trabajadores se ubican fuera del área de carga suspendida.' },
                    { id: 'izajes', label: '12. Se utilizan equipos de izajes y traslado de materiales en buen estado.' },
                    { id: 'evitarIncendio', label: '13. Se implementan medidas para evitar un incendio en el área.' },
                    { id: 'zonaSeguridad', label: '14. El área cuenta con zona de seguridad en caso de emergencias.' }
                  ].map((item) => (
                    <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/10 rounded-2xl gap-3">
                      <Label className="text-[11px] font-bold leading-tight flex-1">{item.label}</Label>
                      <div className="flex bg-white/50 p-1 rounded-lg shadow-inner gap-1 shrink-0">
                        {['SI', 'NO', 'N/A'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setMedidas((prev: any) => ({ ...prev, [item.id]: opt }))}
                            className={`px-3 py-1.5 rounded-md text-[9px] font-black transition-all ${
                              medidas[item.id as keyof typeof medidas] === opt 
                                ? 'bg-primary text-white' 
                                : 'text-muted-foreground'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: EPP */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <p className="text-xs font-black text-primary uppercase tracking-widest">EQUIPOS DE PROTECCIÓN Y ELEMENTOS DE SEGURIDAD REQUERIDOS:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { id: 'casco', label: 'Casco de Seguridad' },
                    { id: 'lentes', label: 'Lentes de Seguridad' },
                    { id: 'calzado', label: 'Calzado de Seguridad' },
                    { id: 'respiratorio', label: 'Protector Respiratorio' },
                    { id: 'careta', label: 'Careta Facial' },
                    { id: 'guantes', label: 'Guantes de seguridad' },
                    { id: 'legionario', label: 'Legionario' },
                    { id: 'barbiquejo', label: 'Barbiquejo' },
                    { id: 'auditivo', label: 'Protector Auditivo' },
                    { id: 'soldar', label: 'Máscara soldar' },
                    { id: 'solar', label: 'Protector solar' },
                    { id: 'arnesY', label: 'Arnés de Seguridad y Cabo de Vida tipo Y' }
                  ].map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 p-3 bg-muted/10 rounded-xl hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setEpp((prev: any) => ({ ...prev, [item.id]: !prev[item.id as keyof typeof epp] }))}>
                      <Checkbox id={item.id} checked={epp[item.id as keyof typeof epp] as boolean} onCheckedChange={(val) => setEpp((prev: any) => ({ ...prev, [item.id]: val }))} className="h-5 w-5 rounded border-primary/20 data-[state=checked]:bg-primary" />
                      <Label htmlFor={item.id} className="text-[10px] font-black uppercase tracking-tight cursor-pointer line-clamp-1">{item.label}</Label>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 pt-4 border-t border-black/5">
                  <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Otros EPP:</Label>
                  <Input placeholder="Especifique..." value={epp.otros} onChange={(e) => setEpp((prev: any) => ({ ...prev, otros: e.target.value }))} className="h-14 bg-muted/30 border-none rounded-2xl font-bold px-6 shadow-inner" />
                </div>
              </div>
            )}


            {/* Step 5: Final Signature */}
            {currentStep === 5 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10">
                  <h4 className="font-black uppercase text-xs text-primary mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" /> Declaración del Supervisor
                  </h4>
                  <p className="text-[11px] font-medium leading-relaxed opacity-80 italic">
                    Declaro que he evaluado los riesgos asociados a esta tarea y que se han tomado todas las medidas de prevención necesarias, 
                    verificando el estado de los recursos, equipos y el personal bajo mi cargo.
                  </p>
                </div>

                <div className="space-y-6">
                  <SignaturePad 
                    label="Firma del Supervisor a Cargo" 
                    onSave={(url) => setFormData((prev: any) => ({ ...prev, firmaSupervisor: url }))} 
                    initialValue={formData.firmaSupervisor}
                  />
                </div>

                <div className="pt-6 flex flex-col gap-3">
                  <Button 
                    type="button" 
                    onClick={() => onSubmit(true)} 
                    disabled={loading || !formData.firmaSupervisor}
                    className="h-20 bg-primary text-white rounded-[2rem] font-black text-xl uppercase tracking-tighter shadow-xl shadow-primary/30"
                  >
                    {loading ? <Loader2 className="animate-spin h-6 w-6 mr-3" /> : <Save className="h-6 w-6 mr-3" />}
                    Finalizar y Guardar HPT
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost"
                    onClick={() => onSubmit(false)} 
                    disabled={loading}
                    className="h-14 font-black text-xs uppercase tracking-widest text-muted-foreground hover:bg-muted"
                  >
                    Guardar como Borrador
                  </Button>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            {currentStep < 5 && (
              <div className="flex gap-4 pt-8 border-t border-black/5">
                {currentStep > 0 && (
                  <Button type="button" variant="outline" onClick={handleBack} className="h-16 flex-1 rounded-2xl border-none bg-muted/50 font-black uppercase text-xs tracking-widest hover:bg-muted group">
                    <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" /> Atrás
                  </Button>
                )}
                <Button type="button" onClick={handleNext} className="h-16 flex-[1.5] rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/30 group">
                  Siguiente <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            )}

          </form>
        </CardContent>
      </Card>

      {/* Helper Text */}
      <div className="flex items-center justify-center gap-2 opacity-30 mt-4">
        <Shield className="h-4 w-4" />
        <span className="text-[9px] font-black uppercase tracking-widest">ICSA - Sistema de Gestión de Seguridad</span>
      </div>
    </div>
  );
}
