"use client";

import Link from "next/link";
import { ArrowRight, Layers, MoveRight, Moon, Sun, ShieldCheck, Activity, Users, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function LandingPage() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const fadeUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const stagger = {
    animate: { transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-foreground selection:text-background w-full">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
        className="fixed top-0 w-full z-50 mix-blend-difference text-white"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6" aria-hidden="true" />
            <span className="font-bold tracking-tight text-lg">TaskFlow</span>
          </div>
          <nav className="flex items-center gap-6 font-bold">
            <div className="w-10 h-10 flex items-center justify-center">
              {mounted && (
                <button 
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="hover:scale-110 active:scale-95 transition-transform p-2 rounded-full border border-current hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white"
                  aria-label="Toggle Theme"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              )}
            </div>
            <Link href="#features" className="hover:opacity-70 transition-opacity hidden sm:block text-sm">Features</Link>
            <Link href="/login" className="hover:opacity-70 transition-opacity text-sm">Log in</Link>
            <Button asChild size="sm" className="bg-white text-black hover:bg-white/90 rounded-full px-6 transition-transform hover:scale-105 duration-300">
              <Link href="/register">Get started</Link>
            </Button>
          </nav>
        </div>
      </motion.header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative min-h-screen flex flex-col justify-end pb-24 md:pb-32 px-6 pt-32">
          <motion.div 
            style={{ y }}
            className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-muted/50 via-background to-background" 
          />
          
          <motion.div 
            variants={stagger}
            initial="initial"
            animate="animate"
            className="max-w-7xl mx-auto w-full relative z-10"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b-2 border-foreground/10 pb-12">
              <motion.h1 variants={fadeUp} className="text-[clamp(3.5rem,8vw,9rem)] font-extrabold tracking-tighter leading-[0.85] uppercase max-w-5xl">
                Collaborative<br />Workflows<br />
                <span className="text-muted-foreground">Built for teams</span>
              </motion.h1>
              
              <motion.div variants={fadeUp} className="flex flex-col gap-8 max-w-sm mb-2">
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium">
                  The ultimate SaaS platform for team accountability. Track every move, assign with precision, and scale your momentum.
                </p>
                <div className="flex items-center gap-4">
                  <Button asChild size="lg" className="rounded-full px-8 h-14 text-base font-bold group hover:scale-[1.02] transition-transform duration-300 shadow-xl">
                    <Link href="/register">
                      Launch Workspace 
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300 ease-out" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Features - Asymmetric Layout */}
        <section id="features" className="px-6 py-32 bg-background border-t border-border">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="mb-32"
            >
              <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-8 border-b border-border pb-4 inline-block">The Service Model</h2>
              <p className="text-[clamp(2.5rem,5vw,5rem)] font-bold tracking-tight max-w-4xl leading-[1.1] uppercase">
                A Complete Team <br />
                <span className="text-muted-foreground">Control Center.</span>
              </p>
            </motion.div>
            
            <div className="flex flex-col gap-px bg-border">
              {[
                { 
                  title: "Hierarchical Roles", 
                  desc: "Structure your team with Leader and Employee roles. Fine-grained permissions keep the right people in control.",
                  icon: <ShieldCheck className="w-12 h-12 mb-4 text-muted-foreground/50" />
                },
                { 
                  title: "Immutable Audit Logs", 
                  desc: "Total transparency. Every task creation, status change, and team update is recorded in a real-time activity trail.",
                  icon: <Activity className="w-12 h-12 mb-4 text-muted-foreground/50" />
                },
                { 
                  title: "Unified Team Hub", 
                  desc: "Onboard employees via secure email validation. Manage your entire roster from a centralized command dashboard.",
                  icon: <Users className="w-12 h-12 mb-4 text-muted-foreground/50" />
                },
                { 
                  title: "Precision Boards", 
                  desc: "Dynamic Kanban boards built for speed. High-fidelity task tracking that adapts to your team's unique rhythm.",
                  icon: <Layout className="w-12 h-12 mb-4 text-muted-foreground/50" />
                },
              ].map((feature, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="bg-background flex flex-col md:flex-row gap-6 md:gap-8 lg:items-center py-12 md:py-24 group hover:-translate-y-2 transition-transform duration-500 cursor-default relative origin-bottom"
                >
                  <div className="w-24 shrink-0">
                    <span className="text-2xl font-mono text-muted-foreground/30 transition-colors group-hover:text-primary">
                      0{i + 1}
                    </span>
                    <div className="mt-4 hidden md:block">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-3xl md:text-5xl font-extrabold tracking-tight w-full md:w-[40%] shrink-0 uppercase">
                    {feature.title}
                  </h3>
                  <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <p className="text-lg md:text-2xl font-medium text-muted-foreground leading-relaxed max-w-lg">
                      {feature.desc}
                    </p>
                    <MoveRight className="w-10 h-10 text-transparent group-hover:text-foreground transition-all duration-500 -translate-x-8 group-hover:translate-x-0 hidden md:block" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Manifesto - Editorial Layout */}
        <section className="px-6 py-48 border-y border-border bg-background">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-16 md:gap-32">
            <h2 className="text-sm font-mono uppercase tracking-widest w-48 shrink-0 text-muted-foreground">The Philosophy</h2>
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="flex-1 max-w-4xl"
            >
              <p className="text-[clamp(2rem,5vw,4.5rem)] font-bold tracking-tighter leading-[1.1] uppercase">
                We replaced management <span className="text-muted-foreground">complexity</span> with focused orchestration. No bloated features. No vanity metrics. 
                <br /><br />
                <span className="text-muted-foreground/50 italic font-serif">Just clear roles and pure execution.</span>
              </p>
            </motion.div>
          </div>
        </section>

        {/* Pricing - Typographic Brutalism */}
        <section className="px-6 py-48 bg-background border-b border-border">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
            <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-16">Enterprise Grade for Everyone</h2>
            <div className="flex flex-col items-center">
              <span className="text-[clamp(6rem,15vw,12rem)] font-extrabold tracking-tighter leading-none mb-12">
                SaaS.
              </span>
              <p className="text-xl md:text-3xl font-bold uppercase tracking-tight max-w-2xl text-muted-foreground leading-relaxed mb-16">
                Unlimited team members. Full activity history. Secure workspace isolation. Built for the modern professional firm.
              </p>
              <Button asChild size="lg" className="rounded-none px-16 h-20 text-xl font-black uppercase tracking-widest border-4 border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background transition-colors">
                <Link href="/register">Join the Flow</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-24 px-6 bg-background">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-12">
          <div className="flex flex-col gap-6 items-center">
            <div className="flex items-center gap-3 font-extrabold uppercase tracking-widest text-2xl">
              <Layers className="w-8 h-8" aria-hidden="true" />
              <span>TaskFlow</span>
            </div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground max-w-sm leading-relaxed">
              Orchestrated for teams. Engineered for accountability. Delivered via the cloud.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-24 font-bold text-sm tracking-widest uppercase text-center w-full max-w-3xl border-t border-border pt-12 text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">Platform</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Security</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Legal</Link>
          </div>

          <div className="mt-24 text-[20vw] font-black tracking-tighter leading-none opacity-10 dark:opacity-[0.03] select-none pointer-events-none">
            TASKFLOW
          </div>
        </div>
      </footer>
    </div>
  );
}
