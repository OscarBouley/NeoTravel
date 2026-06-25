"use client";

import { useState } from "react";
import DevisForm from "@/components/devis-form";
import ChatDevis from "@/components/chat-devis";

type Mode = "chat" | "formulaire";

export default function Home() {
  const [mode, setMode] = useState<Mode>("chat");

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-navy-950 text-navy-100">
      {/* Navbar */}
      <header className="shrink-0 border-b border-navy-700/50 bg-navy-900/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <span className="text-xl font-bold tracking-tight">
            Neo<span className="text-lime-400">Travel</span>
          </span>
          <nav className="hidden items-center gap-6 text-sm font-medium text-navy-400 md:flex">
            <a href="/" className="text-navy-100">Accueil</a>
            <a href="/dashboard" className="transition-colors hover:text-navy-100">Dashboard</a>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-navy-400 lg:block">
              09 80 40 04 84
            </span>
            <button className="rounded-lg bg-lime-400/15 px-4 py-2 text-sm font-bold text-lime-400 transition-colors hover:bg-lime-400/25">
              Devis gratuit
            </button>
          </div>
        </div>
      </header>

      {/* Main — two columns */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left — hero text */}
        <section className="hidden w-[45%] shrink-0 flex-col justify-center px-12 xl:px-20 lg:flex">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-lime-400">
            Transport premium avec chauffeur
          </p>
          <h1 className="text-4xl font-bold leading-tight xl:text-5xl">
            Votre devis transport de groupe{" "}
            <span className="text-lime-400">en quelques minutes</span>
          </h1>
          <p className="mt-4 max-w-md text-base text-navy-400">
            Location de bus, autocar et minibus avec chauffeur.
            Devis gratuit et rappel commercial rapide.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {["Devis gratuit", "Réponse sous 2h", "Sans engagement"].map(
              (badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-navy-700 bg-navy-800/60 px-4 py-1.5 text-xs font-medium text-navy-100"
                >
                  {badge}
                </span>
              ),
            )}
          </div>
          <div className="mt-8 flex items-center gap-2 text-sm text-navy-400">
            <span className="h-2 w-2 rounded-full bg-lime-400" />
            En ligne — Réponse sous 2h — Lun-Sam
          </div>
        </section>

        {/* Right — content */}
        <section className="flex flex-1 flex-col items-center justify-center overflow-y-auto bg-navy-900/40 px-6 py-4 lg:px-12">
          {/* Mobile-only title */}
          <div className="mb-3 text-center lg:hidden">
            <h1 className="text-2xl font-bold">
              Votre devis <span className="text-lime-400">en quelques minutes</span>
            </h1>
          </div>

          {/* Content card */}
          <div className="w-full max-w-xl rounded-2xl border border-navy-700/50 bg-navy-900 p-5 shadow-2xl shadow-navy-950/50 sm:p-7">
            {mode === "chat" ? <ChatDevis /> : <DevisForm />}
          </div>

          {/* Toggle button */}
          <button
            onClick={() => setMode(mode === "chat" ? "formulaire" : "chat")}
            className="mt-4 flex items-center gap-2 text-sm text-navy-400 transition-colors hover:text-navy-100"
          >
            {mode === "chat" ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
                </svg>
                Je préfère réserver via un formulaire
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                </svg>
                Je préfère réserver via l&apos;assistant IA
              </>
            )}
          </button>
        </section>
      </main>
    </div>
  );
}
