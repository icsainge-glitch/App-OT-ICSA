
"use client";

import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface PhotoUploadProps {
    photos: string[];
    onChange: (photos: string[]) => void;
    maxPhotos?: number;
}

export function PhotoUpload({ photos, onChange, maxPhotos = 8 }: PhotoUploadProps) {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (photos.length + files.length > maxPhotos) {
            toast({
                variant: "destructive",
                title: "Límite de fotos",
                description: `Solo puedes subir hasta ${maxPhotos} fotos por orden.`
            });
            return;
        }

        setIsUploading(true);
        try {
            const newPhotos = await Promise.all(
                files.map(file => {
                    return new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const img = new window.Image();
                            img.onload = () => {
                                const canvas = document.createElement("canvas");
                                const maxDim = 800; // Cap image size to 800px on the longest side
                                let width = img.width;
                                let height = img.height;

                                if (width > height && width > maxDim) {
                                    height = Math.round((height * maxDim) / width);
                                    width = maxDim;
                                } else if (height > maxDim) {
                                    width = Math.round((width * maxDim) / height);
                                    height = maxDim;
                                }

                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext("2d");
                                if (ctx) {
                                    ctx.drawImage(img, 0, 0, width, height);
                                    // Compress to WebP (or JPEG if WebP unsupported) at 60% quality
                                    resolve(canvas.toDataURL("image/webp", 0.6));
                                } else {
                                    resolve(e.target?.result as string);
                                }
                            };
                            img.onerror = reject;
                            img.src = e.target?.result as string;
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });
                })
            );
            onChange([...photos, ...newPhotos]);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudieron procesar las imágenes."
            });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removePhoto = (index: number) => {
        const updated = photos.filter((_, i) => i !== index);
        onChange(updated);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <label className="text-xs font-black text-primary uppercase tracking-[0.2em]">Fotos del Trabajo / Evidencia</label>
                <span className="text-xs font-bold text-muted-foreground uppercase">{photos.length} / {maxPhotos}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {photos.map((photo, index) => (
                    <div key={index} className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-primary/5 bg-muted/20 shadow-sm transition-all hover:scale-[1.02]">
                        <Image
                            src={photo}
                            alt={`Foto ${index + 1}`}
                            fill
                            className="object-cover"
                        />
                        <button
                            onClick={() => removePhoto(index)}
                            className="absolute top-2 right-2 bg-destructive/80 text-white p-1.5 rounded-full backdrop-blur-sm transition-all shadow-lg active:scale-90 z-10"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}

                {photos.length < maxPhotos && (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className={cn(
                            "aspect-square rounded-2xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center gap-2 transition-all hover:border-primary/40 hover:bg-primary/5",
                            isUploading && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {isUploading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        ) : (
                            <>
                                <div className="bg-primary/10 p-3 rounded-full">
                                    <Camera className="h-6 w-6 text-primary" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-tighter text-muted-foreground">Añadir Foto</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                className="hidden"
            />

            {photos.length === 0 && !isUploading && (
                <div className="py-8 border-2 border-dashed border-primary/5 rounded-3xl flex flex-col items-center justify-center opacity-40">
                    <ImageIcon size={32} className="text-primary mb-2" />
                    <p className="text-xs font-bold uppercase tracking-widest">Sin fotos registradas</p>
                </div>
            )}
        </div>
    );
}
