
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
import { CheckCircle2, Loader2, User, Hash, Info, MapPin, Building2, ClipboardCheck, Mail } from "lucide-react";
import Image from "next/image";
import { getOrderById, submitRemoteSignature } from "@/actions/db-actions";
import { useActionData } from "@/hooks/use-action-data";
import { cn, formatFolio } from "@/lib/utils";

function RemoteSignaturePageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [receiverName, setReceiverName] = useState("");
  const [receiverRut, setReceiverRut] = useState("");
  const [receiverEmail, setReceiverEmail] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");
  const [isValidating, setIsValidating] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: order, isLoading: isOrderLoading } = useActionData<any>(() => getOrderById(id), [id]);

  useEffect(() => {
    if (!isOrderLoading) {
      if (!order) {
        setErrorMsg("La orden de trabajo no existe o ha sido eliminada.");
        setIsValidating(false);
      } else if (order.status === 'Completed' || order.status === 'Completado' || order.status === 'Archivada') {
        // If already completed, skip validation and mark as submitted so they see the success screen
        setIsSubmitted(true);
        setIsValidating(false);
      } else if (!token || order.signatureToken !== token) {
        setErrorMsg("Token de firma no válido o acceso no autorizado.");
        setIsValidating(false);
      } else if (new Date(order.tokenExpiry) < new Date()) {
        setErrorMsg("El enlace de firma ha expirado (validez de 7 días).");
        setIsValidating(false);
      } else {
        setIsValidating(false);
        // Pre-fill fields if they exist in the order
        if (order.clientReceiverName) setReceiverName(order.clientReceiverName);
        if (order.clientReceiverRut) setReceiverRut(order.clientReceiverRut);
        if (order.clientReceiverEmail) setReceiverEmail(order.clientReceiverEmail);
      }
    }
  }, [order, isOrderLoading, token]);

  const handleSubmit = async () => {
    if (!receiverName || !receiverRut || !signatureUrl) {
      toast({
        variant: "destructive",
        title: "Faltan datos",
        description: "Por favor complete su nombre, RUT y realice su firma."
      });
      return;
    }

    setLoading(true);
    try {
      const result = await submitRemoteSignature({
        orderId: id,
        token: token!,
        receiverName,
        receiverRut,
        receiverEmail,
        signatureUrl,
      });

      if (result.success) {
        toast({ title: "Firma Exitosa", description: "La orden de trabajo ha sido firmada y procesada." });
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

  if (isOrderLoading || isValidating) {
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

  if (loading && !isValidating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-primary gap-4">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="font-black tracking-tighter text-xl uppercase">Procesando Firma...</p>
      </div>
    );
  }

  // Muestra pantalla de éxito si la orden fue recién firmada o ya estaba en historial como completada
  if (isSubmitted && !isOrderLoading && !isValidating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center gap-6">
        <div className="h-20 w-20 bg-accent/20 text-primary rounded-full flex items-center justify-center">
          <CheckCircle2 size={40} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-primary uppercase">¡Firma Recibida!</h1>
          <p className="text-muted-foreground font-medium">Gracias por su colaboración. El proceso ha finalizado correctamente. Esta orden ya ha sido archivada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="bg-primary text-white p-6 sticky top-0 z-50 shadow-lg text-center">
        <h1 className="font-black text-xl uppercase tracking-tighter leading-none">ICSA Firma Digital</h1>
        <p className="text-xs font-bold opacity-70 uppercase tracking-widest mt-1">Recepción de Orden de Trabajo</p>
      </header>

      <main className="container mx-auto px-4 mt-6 max-w-2xl space-y-6">
        <div className="flex items-center justify-between px-1">
          <Badge className="bg-primary/20 text-primary border-none px-4 py-1.5 font-black uppercase tracking-widest text-xs">
            OT {formatFolio(order?.folio)}
          </Badge>
          <span className="text-xs font-black text-muted-foreground uppercase">Revisión Remota</span>
        </div>

        {/* RESUMEN DE TRABAJO */}
        <Card className="shadow-md border-none bg-white">
          <CardHeader className="bg-primary/5 p-4 border-b">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" /> Detalles de Ejecución
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/20 rounded-xl border border-primary/5">
                <p className="text-xs uppercase font-black text-muted-foreground mb-1">Tipo de Trabajo</p>
                <Badge className="bg-primary/10 text-primary border-none font-bold uppercase text-xs">
                  {order?.tipoTrabajo?.includes('Otro') ? order.tipoTrabajo.replace('Otro', order.tipoTrabajoOtro || 'Otro') : order?.tipoTrabajo || "N/A"}
                </Badge>
              </div>
              <div className="p-3 bg-muted/20 rounded-xl border border-primary/5">
                <p className="text-xs uppercase font-black text-muted-foreground mb-1">Estado</p>
                <Badge className={cn("border-none font-bold uppercase text-xs",
                  order?.estadoTrabajo?.includes('Trabajo finalizado correctamente') ? 'bg-emerald-100 text-emerald-700' :
                    order?.estadoTrabajo?.includes('Trabajo finalizado con observaciones') ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700')}>
                  {order?.estadoTrabajo || "N/A"}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex flex-col col-span-2 md:col-span-1">
                <p className="text-xs uppercase font-black text-muted-foreground">Mandante / Empresa</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <User className="h-4 w-4 text-primary" />
                  <p className="text-sm font-bold flex-1">{order?.clientName}</p>
                </div>
                {order?.clientRut && <p className="text-xs font-black text-muted-foreground ml-6">RUT: {order.clientRut}</p>}
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs uppercase font-black text-muted-foreground">Dirección Central</p>
                    <p className="text-sm font-bold">{order?.address}</p>
                  </div>
                </div>
                {order?.interventionAddress && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-primary mt-0.5 opacity-60" />
                    <div>
                      <p className="text-xs uppercase font-black text-muted-foreground">Dirección de la Sucursal</p>
                      <p className="text-sm font-bold">{order?.interventionAddress}</p>
                    </div>
                  </div>
                )}
              </div>
              {order?.building && (
                <div className="flex items-start gap-3">
                  <Building2 className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs uppercase font-black text-muted-foreground">Ubicación</p>
                    <p className="text-sm font-bold">Edif: {order?.building} / Piso: {order?.floor}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase font-black text-muted-foreground pl-1">Descripción del Trabajo</p>
              <div className="p-4 bg-muted/10 rounded-xl text-sm leading-relaxed border border-dashed font-medium text-muted-foreground italic">
                {order?.description || "Sin descripción adicional."}
              </div>
            </div>

            {Array.isArray(order?.detalleTecnico) && order?.detalleTecnico.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs uppercase font-black text-primary tracking-widest pl-1">Detalle Técnico</p>
                <div className="border border-primary/10 rounded-xl overflow-hidden text-sm">
                  <table className="w-full text-left">
                    <thead className="bg-primary/5 text-xs uppercase font-black text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Elemento</th>
                        <th className="px-3 py-2 text-center">Cantidad</th>
                        <th className="px-3 py-2">Obs.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/5">
                      {order.detalleTecnico.map((item: any, idx: number) => {
                        if (!item.cantidad && !item.observacion) return null;
                        return (
                          <tr key={idx} className="bg-white">
                            <td className="px-3 py-2 font-bold text-xs sm:text-xs">{item.elemento}</td>
                            <td className="px-3 py-2 font-black text-center text-primary text-xs">{item.cantidad || "-"}</td>
                            <td className="px-3 py-2 text-muted-foreground text-xs">{item.observacion || "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {Array.isArray(order?.puntosRed) && order?.puntosRed.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs uppercase font-black text-primary tracking-widest pl-1">Puntos de Red</p>
                <div className="border border-primary/10 rounded-xl overflow-hidden text-sm overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-primary/5 text-xs uppercase font-black text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-center">Pt.</th>
                        <th className="px-3 py-2">Ubicación</th>
                        <th className="px-3 py-2">Panel</th>
                        <th className="px-3 py-2">Res.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/5">
                      {order.puntosRed.map((punto: any, idx: number) => (
                        <tr key={idx} className="bg-white">
                          <td className="px-3 py-2 font-black text-xs text-center uppercase">{punto.id || "-"}</td>
                          <td className="px-3 py-2 font-medium text-xs sm:text-xs">{punto.ubicacion || "-"}</td>
                          <td className="px-3 py-2 font-medium text-xs uppercase">{punto.puerto || "-"}</td>
                          <td className="px-3 py-2">
                            <span className={cn("text-xs font-bold uppercase", punto.resultado === 'Aprobado' ? 'text-emerald-600' : 'text-amber-600')}>
                              {punto.resultado?.substring(0, 3) || "-"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {order?.observacionesGenerales && (
              <div className="space-y-2">
                <p className="text-xs uppercase font-black text-muted-foreground pl-1">Observaciones Finales</p>
                <div className="p-3 bg-accent/5 rounded-xl border border-accent/10">
                  <p className="text-xs font-medium text-muted-foreground whitespace-pre-wrap">{order.observacionesGenerales}</p>
                </div>
              </div>
            )}

            {order?.sketchImageUrl && (
              <div className="space-y-2 mt-4">
                <p className="text-xs uppercase font-black text-muted-foreground">Evidencia de Terreno</p>
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted border-2">
                  <Image src={order.sketchImageUrl} alt="Sketch" fill className="object-contain" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* FORMULARIO DE FIRMA */}
        <Card className="shadow-md border-none bg-white overflow-hidden">
          <CardHeader className="border-b bg-muted/10 p-4">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">Recepción de Trabajos</CardTitle>
            <CardDescription className="text-xs font-bold">Por favor, ingrese sus datos para validar la recepción conforme.</CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nombre Completo</Label>
                  <Input
                    placeholder="Ej: Juan Pérez"
                    value={receiverName}
                    onChange={e => setReceiverName(e.target.value)}
                    className="h-12 bg-muted/10 border-none shadow-sm font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">RUT Receptor <span className="opacity-60 lowercase font-medium ml-1 tracking-normal">(ej: 12345678-9)</span></Label>
                  <Input
                    placeholder="12345678-9"
                    value={receiverRut}
                    onChange={e => {
                      const val = e.target.value;
                      import('@/lib/rut-utils').then(m => setReceiverRut(m.formatRut(val)))
                    }}
                    id="rut-receptor"
                    className="h-14 font-black mt-2"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Email (Para envío de comprobante PDF)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={receiverEmail}
                    onChange={e => setReceiverEmail(e.target.value)}
                    className="h-12 bg-muted/10 border-none shadow-sm font-bold pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <SignaturePad
                label="Firma de Recepción Conforme"
                onSave={(dataUrl) => setSignatureUrl(dataUrl)}
              />
              <p className="text-xs text-center text-muted-foreground italic leading-tight">
                Al firmar, usted acepta que los trabajos descritos han sido realizados satisfactoriamente y recibidos a su entera conformidad.
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading || !signatureUrl}
              className="w-full h-16 bg-primary hover:bg-primary/90 text-xl font-black gap-3 shadow-xl rounded-2xl uppercase tracking-tighter"
            >
              <CheckCircle2 size={24} /> Enviar Firma y Finalizar
            </Button>
          </CardContent>
        </Card>
      </main>

      <footer className="mt-12 text-center pb-12 px-6">
        <div className="max-w-xl mx-auto space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed italic">
            La presente Orden de Trabajo y su firma electrónica se encuentran reguladas bajo la Ley 19.799, siendo plenamente válidas como Firma Electrónica Simple para todos los efectos legales.
          </p>
          <div className="flex flex-col items-center">
            <span className="font-black text-lg tracking-tighter text-primary">ICSA</span>
            <span className="text-xs font-bold opacity-40 uppercase tracking-[0.2em]">ingeniería comunicaciones S.A.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function RemoteSignaturePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-black animate-pulse text-primary uppercase tracking-tighter">Cargando firma...</div>}>
      <RemoteSignaturePageContent params={params} />
    </Suspense>
  );
}
