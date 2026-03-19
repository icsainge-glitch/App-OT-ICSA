
"use client";

import React, { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { RotateCcw, Check, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface SignaturePadProps {
  label: string;
  onSave: (dataUrl: string) => void;
  className?: string;
  initialValue?: string;
}

export function SignaturePad({ label, onSave, className, initialValue }: SignaturePadProps) {
  const { toast } = useToast();
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialValue && sigCanvas.current) {
      sigCanvas.current.fromDataURL(initialValue);
      setHasSignature(true);
      setIsConfirmed(true);
    }
  }, [initialValue]);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const clear = () => {
    sigCanvas.current?.clear();
    setHasSignature(false);
    setIsConfirmed(false);
    onSave("");
  };

  const handleBegin = () => {
    setHasSignature(true);
    setIsConfirmed(false);
  };

  const handleConfirm = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
      onSave(dataUrl);
      setIsConfirmed(true);
      toast({
        title: "Firma capturada",
        description: "La firma se ha registrado correctamente.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Pad vacío",
        description: "Por favor, realice su firma antes de intentar confirmar.",
      });
    }
  };

  return (
    <div className={cn("space-y-4", className)} ref={containerRef}>
      <div className="flex items-center justify-between px-1">
        <label className="text-xs font-black text-primary uppercase tracking-[0.2em]">{label}</label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clear}
          className="h-10 text-[10px] gap-2 font-black text-muted-foreground hover:text-destructive uppercase tracking-widest transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Limpiar / Cambiar
        </Button>
      </div>

      <div className={cn(
        "relative border-2 rounded-3xl bg-white overflow-hidden touch-none shadow-inner min-h-[220px] transition-all duration-300",
        isConfirmed ? "border-accent bg-accent/5" : "border-primary/10"
      )}>
        <SignatureCanvas
          ref={sigCanvas}
          onBegin={handleBegin}
          canvasProps={{
            width: containerWidth,
            height: 220,
            className: "signature-canvas w-full",
          }}
          velocityFilterWeight={0.1}
          minWidth={1.5}
          maxWidth={4.5}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 px-8 text-center">
            <p className="text-sm font-black uppercase tracking-[0.4em] text-primary rotate-[-5deg]">Dibuje su firma aquí</p>
          </div>
        )}
        {isConfirmed && (
          <div className="absolute top-3 right-3 flex items-center gap-2 bg-accent text-primary px-4 py-1.5 rounded-full shadow-lg border border-primary/10 animate-in fade-in zoom-in duration-300">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-tight">Firma Registrada</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {!isConfirmed ? (
          <Button
            type="button"
            disabled={!hasSignature}
            onClick={handleConfirm}
            className="w-full h-16 rounded-2xl gap-3 shadow-lg bg-accent hover:bg-accent/90 text-primary uppercase tracking-tighter text-lg font-black transition-all active:scale-95"
          >
            <Check size={24} /> Confirmar Firma
          </Button>
        ) : (
          <div className="w-full h-16 rounded-2xl border-2 border-accent/30 bg-accent/5 flex items-center justify-center gap-3 text-primary font-black uppercase tracking-tighter">
            <CheckCircle2 size={24} className="text-accent" /> Firma Registrada
          </div>
        )}
        <p className="text-[9px] text-center text-muted-foreground font-bold uppercase tracking-widest opacity-60">
          Esta firma será utilizada para la documentación oficial.
        </p>
      </div>
    </div>
  );
}

