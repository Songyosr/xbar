import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * XBAR — Code Bar MVP Homepage (Export)
 * Minimal, white background, navy + orange accents, subtle coding vibe.
 * Ready to drop into a Next.js/React route (e.g., app/page.tsx or pages/index.tsx).
 */

// Local keyframes for blinking cursor
const BLINK = `@keyframes blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }`;

const Blink = () => (
  <span
    aria-hidden
    className="inline-block w-[0.6ch] h-[1em] align-[-0.15em] bg-[#001524] ml-1 animate-[blink_1.15s_steps(1)_infinite]"
  />
);

export default function XbarHomeCodeBar() {
  return (
    <div className="min-h-screen bg-white text-[#001524]">
      <style>{BLINK}</style>
      <div className="mx-auto max-w-[1140px] px-4 py-6">
        <Header />
        <Hero />
        <WhatsOnTap />
        <BartendersNotes />
        <Footer />
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="mb-8 flex items-center justify-between">
      <Logo />
      <nav className="hidden md:flex items-center gap-4 text-sm text-[#475569]">
        <a className="hover:text-[#FF7D00]" href="#applets">Applets</a>
        <a className="hover:text-[#FF7D00]" href="#docs">Docs</a>
        <a className="hover:text-[#FF7D00]" href="#github">GitHub</a>
      </nav>
    </header>
  );
}

function Logo() {
  return (
    <motion.a
      href="#"
      className="group inline-flex items-center gap-2 font-bold tracking-tight"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <span className="text-xl md:text-2xl">
        <span className="text-[#15616D]">[</span>xbar
        <span className="text-[#FF7D00]">]</span>
      </span>
      <span className="text-[#FF7D00]"><Blink /></span>
      <span className="sr-only">xbar home</span>
    </motion.a>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden rounded-2xl border bg-white p-8 md:p-12 shadow-sm">
      <motion.h1
        className="text-3xl md:text-5xl font-extrabold tracking-tight"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        xbar — where stat serves cool <span className="text-[#FF7D00]">_</span>
      </motion.h1>
      <p className="mt-3 max-w-[60ch] text-[#475569]">
        Minimal, responsive, accessible stat applets you can embed anywhere. Built with
        React + TypeScript, Tailwind, shadcn/ui, Recharts, and Framer Motion.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button className="bg-[#FF7D00] hover:bg-[#e96e00] text-white" asChild>
          <a href="#applets">Browse Applets</a>
        </Button>
        <Button variant="outline" className="border-[#15616D] text-[#15616D] hover:bg-[#f0fdfa]" asChild>
          <a href="#docs">View Docs</a>
        </Button>
        <Button variant="ghost" className="text-[#475569]" asChild>
          <a href="#github">GitHub</a>
        </Button>
      </div>

      {/* Subtle code accent */}
      <motion.div
        className="pointer-events-none absolute -right-2 -bottom-2 select-none opacity-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ delay: 0.4 }}
      >
        <pre className="m-0 whitespace-pre text-sm leading-tight text-[#15616D]">
{`const x̄ = mean(sample) // average drinks, standard error`}
        </pre>
      </motion.div>
    </section>
  );
}

function WhatsOnTap() {
  return (
    <section id="applets" className="mt-12">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">What's on Tap</h2>
          <p className="text-sm text-[#475569]">Interactive applets</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-[#475569]">
          <span className="text-[#15616D]">[</span>
          <span>beta</span>
          <span className="text-[#FF7D00]">]</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <AppletCard
          title="CLT Lab"
          status="available"
          desc="See sampling distributions build up, with smart parameter lines and SE overlays."
          href="#clt"
        />
        <AppletCard
          title="Confidence Intervals"
          status="coming"
          desc="Simulate coverage, tweak n & σ, and watch intervals catch μ."
          href="#ci"
        />
        <AppletCard
          title="p‑values"
          status="coming"
          desc="Explore null distributions and error rates without the drama."
          href="#pvals"
        />
      </div>
    </section>
  );
}

function AppletCard({ title, desc, status, href }: { title: string; desc: string; status: "available" | "coming"; href?: string }) {
  const badge = status === "available"
    ? <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Available</Badge>
    : <Badge variant="outline" className="border-amber-400 text-amber-700">Coming soon</Badge>;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      <Card className="h-full rounded-xl border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{title}</CardTitle>
            {badge}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#475569]">{desc}</p>
          <div className="mt-4 flex gap-2">
            <Button size="sm" className="bg-[#FF7D00] hover:bg-[#e96e00] text-white" asChild>
              <a href={href || "#"}>Launch</a>
            </Button>
            <Button size="sm" variant="outline" className="border-[#15616D] text-[#15616D] hover:bg-[#f0fdfa]" asChild>
              <a href="#docs">Read</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function BartendersNotes() {
  return (
    <section id="docs" className="mt-12">
      <Card className="rounded-xl border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Bartender’s Notes</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-semibold">Design System</h3>
            <p className="text-sm text-[#475569]">Unified color, spacing, and motion for all applets. Copy‑pasteable components.</p>
          </div>
          <div>
            <h3 className="font-semibold">Embedding Guide</h3>
            <p className="text-sm text-[#475569]">Drop an applet into Bookdown/slides with one import. No build steps.</p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-12 border-t pt-6 text-sm text-[#475569]">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p>
          average drinks, <span className="font-semibold text-[#001524]">standard error</span>
        </p>
        <div className="flex items-center gap-3">
          <a className="hover:text-[#FF7D00]" href="#docs">Docs</a>
          <a className="hover:text-[#FF7D00]" href="#github">GitHub</a>
          <a className="hover:text-[#FF7D00]" href="#contact">Contact</a>
        </div>
      </div>
    </footer>
  );
}
