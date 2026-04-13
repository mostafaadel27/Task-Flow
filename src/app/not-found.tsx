"use client";

import Link from "next/link";
import { MoveLeft, Ghost, Layers } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-[0.03]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[40vw] font-black leading-none pointer-events-none">
          404
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.8 }}
        className="relative z-10 space-y-12 max-w-lg"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Layers className="w-8 h-8 text-foreground" />
            <span className="font-mono text-xs uppercase tracking-[0.5em] text-muted-foreground">TaskFlow Protocol</span>
          </div>
          
          <h1 className="text-8xl md:text-[10rem] font-black tracking-tighter leading-none uppercase">
            404
          </h1>
          
          <div className="space-y-2">
            <p className="text-2xl font-black uppercase tracking-tight italic">
              Objective Not Found
            </p>
            <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest">
              The requested signal has been lost in the grid.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild variant="default" size="lg" className="rounded-none h-14 px-10 group bg-foreground text-background hover:bg-foreground/90 transition-all font-bold uppercase tracking-widest text-xs">
            <Link href="/">
              <MoveLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Return to Base
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="lg" className="rounded-none h-14 px-10 border-border/50 hover:bg-muted/30 transition-all font-mono uppercase tracking-[0.2em] text-[10px]">
            <Link href="/support">
              Report Anomaly
            </Link>
          </Button>
        </div>

        <div className="pt-12">
          <div className="flex items-center justify-center gap-6 opacity-30">
            <div className="w-12 h-px bg-foreground" />
            <span className="text-[10px] font-mono uppercase tracking-[0.4em]">Grid Status: Neutral</span>
            <div className="w-12 h-px bg-foreground" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
