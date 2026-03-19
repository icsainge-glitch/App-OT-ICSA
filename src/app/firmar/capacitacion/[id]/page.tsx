
'use client';

import { use, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SignaturePad } from "@/components/SignaturePad";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2, User, Info, MapPin, Clock, MessageSquare, Users, ShieldCheck } from "lucide-react";
import { getCapacitacionById, submitCapacitacionRemoteSignature } from "@/actions/db-actions";
import { useActionData } from "@/hooks/use-action-data";
import { formatFolio } from "@/lib/utils";

function CapacitacionRemoteSignaturePageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [prevencionName, setPrevencionName] = useState("Departamento de Prevención");
  const [signatureUrl, setSignatureUrl] = useState("");
  const [isValidating, setIsValidating] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: cap, isLoading: isCapLoading } = useActionData<any>(() => getCapacitacionById(id), [id]);

  useEffect(() => {
    if (!isCapLoading) {
      if (!cap) {
        setErrorMsg("El registro de la charla no existe.");
        setIsValidating(false);
      } else if (cap.status === 'Completado') {
        setIsSubmitted(true);
        setIsValidating(false);
      } else if (!token || cap.signature_token !== token) {
        setErrorMsg("Token de firma no válido o acceso no autorizado.");
        setIsValidating(false);
      } else if (cap.token_expiry && new Date(cap.token_expiry) < new Date()) {
        setErrorMsg("El enlace de firma ha expirado (validez de 7 días).");
        setIsValidating(false);
      } else {
        setIsValidating(false);
        if (cap.prevencionName) setPrevencionName(cap.prevencionName);
      }
    }
  }, [cap, isCapLoading, token]);

  const handleSubmit = async () => {
    if (!prevencionName || !signatureUrl) {
      toast({
        variant: "destructive",
        title: "Faltan datos",
        description: "Por favor ingrese su nombre/departamento y realice su firma."
      });
      return;
    }

    setLoading(true);
    try {
      const result = await submitCapacitacionRemoteSignature({
        id: id,
        token: token!,
        prevencionName,
        prevencionSignatureUrl: signatureUrl,
      });

      if (result.success) {
        toast({ title: "Firma Exitosa", description: "La charla ha sido validada correctamente." });
        setIsSubmitted(true);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo procesar la firma." });
    } finally {
      setLoading(false);
    }
  };

  if (isCapLoading || isValidating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-primary gap-4">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="font-black tracking-tighter text-xl uppercase">Validando Solicitud...</p>
      </div>
    );
  }

  if (errorMsg && !isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center gap-6">
        <div className="h-20 w-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center">
          <Info size={40} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-primary uppercase">Enlace No Válido</h1>
          <p className="text-muted-foreground font-medium max-w-xs">{errorMsg}</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/')} className="font-bold">Volver al Inicio</Button>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center gap-6">
        <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
          <CheckCircle2 size={40} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-primary uppercase">¡Validación Completada!</h1>
          <p className="text-muted-foreground font-medium">La charla ha sido revisada y firmada exitosamente. El registro ya se encuentra actualizado en el sistema.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-12">
      <header className="bg-primary text-white p-6 sticky top-0 z-50 shadow-lg text-center">
        <h1 className="font-black text-xl uppercase tracking-tighter leading-none">ICSA Gestión Preventiva</h1>
        <p className="text-xs font-bold opacity-70 uppercase tracking-widest mt-1">Revisión de Charla</p>
      </header>

      <main className="container mx-auto px-4 mt-6 max-w-2xl space-y-6">
        <div className="flex items-center justify-between px-1">
          <Badge className="bg-primary text-white border-none px-4 py-1.5 font-black uppercase tracking-widest text-xs">
            Folio {formatFolio(cap?.folio)}
          </Badge>
          <span className="text-xs font-black text-muted-foreground uppercase">Firma Remota Prevención</span>
        </div>

        <Card className="shadow-2xl border-none bg-white rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-primary/5 p-6 border-b">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" /> Resumen del Registro
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <Label className="uppercase text-[10px] font-black text-muted-foreground">Relator / Supervisor</Label>
                <div className="flex items-center gap-2 font-bold text-primary">
                  <User className="h-4 w-4" /> {cap?.supervisorName}
                </div>
                <p className="text-[10px] text-muted-foreground">{cap?.cargo}</p>
              </div>
              <div className="space-y-1">
                <Label className="uppercase text-[10px] font-black text-muted-foreground">Fecha y Lugar</Label>
                <div className="flex items-center gap-2 font-bold text-primary">
                  <Clock className="h-4 w-4" /> {cap?.fecha}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3" /> {cap?.lugar}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-black text-muted-foreground flex items-center gap-2">
                <MessageSquare className="h-3 w-3" /> Temario Tratado
              </Label>
              <div className="p-5 bg-muted/30 rounded-2xl text-sm leading-relaxed font-medium italic text-muted-foreground border border-dashed">
                {cap?.temario}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="uppercase text-[10px] font-black text-muted-foreground flex items-center gap-2">
                <Users className="h-3 w-3" /> Asistentes ({cap?.assistants?.length || 0})
              </Label>
              <div className="border border-primary/10 rounded-2xl overflow-hidden shadow-inner">
                <table className="w-full text-left">
                  <thead className="bg-primary/5 text-[10px] uppercase font-black text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Nombre</th>
                      <th className="px-4 py-3">RUT</th>
                      <th className="px-4 py-3 text-right">Firma</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    {cap?.assistants?.map((asis: any, idx: number) => (
                      <tr key={idx} className="bg-white hover:bg-muted/5 transition-colors">
                        <td className="px-4 py-3 font-bold text-xs uppercase">{asis.nombre}</td>
                        <td className="px-4 py-3 text-xs font-medium text-muted-foreground">{asis.rut}</td>
                        <td className="px-4 py-3 text-right">
                          {asis.firma ? (
                            <div className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase">
                              <CheckCircle2 className="h-3 w-3" /> Firmado
                            </div>
                          ) : (
                            <span className="text-[9px] font-bold text-muted-foreground uppercase italic px-2">Pendiente</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xl border-none bg-white rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-muted/10 p-6 border-b">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">Validación de Prevención</CardTitle>
            <CardDescription className="text-xs font-bold">Confirme la revisión de este registro mediante su firma digital.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre / Departamento Responsable</Label>
                <Input
                  placeholder="Ej: Prevención de Riesgos ICSA"
                  value={prevencionName}
                  onChange={e => setPrevencionName(e.target.value)}
                  className="h-14 bg-muted/10 border-none shadow-inner font-bold rounded-2xl px-6"
                />
              </div>

              <div className="pt-4">
                <SignaturePad
                  label="Firma de Validación (Prevención)"
                  onSave={(url) => setSignatureUrl(url)}
                />
              </div>

              <p className="text-[10px] text-center text-muted-foreground italic leading-tight px-4">
                Al firmar este documento, valido que la charla se ha realizado conforme a los estándares de seguridad 
                de la empresa y que el registro es fidedigno.
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading || !signatureUrl}
              className="w-full h-20 bg-primary hover:bg-primary/90 text-white text-xl font-black gap-4 shadow-xl shadow-primary/30 rounded-[1.5rem] uppercase tracking-tighter transition-all active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin h-6 w-6" /> : <ShieldCheck className="h-7 w-7" />} 
              Validar y Firmar Registro
            </Button>
          </CardContent>
        </Card>
      </main>

      <footer className="mt-12 text-center pb-12 px-6">
        <div className="max-w-xl mx-auto space-y-4">
          <p className="text-[9px] text-muted-foreground leading-relaxed italic">
            Documento de control interno. La firma electrónica simple aplicada en este sistema posee plena validez legal 
            según la normativa vigente de firmas digitales.
          </p>
          <div className="flex flex-col items-center opacity-40">
            <span className="font-black text-xl tracking-tighter text-primary">ICSA</span>
            <span className="text-[8px] font-bold uppercase tracking-[0.4em] mt-1">ingeniería comunicaciones S.A.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function CapacitacionRemoteSignaturePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-black animate-pulse text-primary uppercase tracking-tighter">Cargando validación...</div>}>
      <CapacitacionRemoteSignaturePageContent params={params} />
    </Suspense>
  );
}
