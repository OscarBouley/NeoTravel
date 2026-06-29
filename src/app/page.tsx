"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import ChatDevis from "@/components/chat-devis";

export default function Home() {
  return (
    <div className="min-h-screen bg-navy-950 text-navy-100">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-navy-800/50 bg-navy-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-400 text-sm font-bold text-navy-950">
              N
            </div>
            <span className="text-lg font-bold tracking-tight">
              Neo<span className="text-lime-400">Travel</span>
            </span>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="/" className="border-b-2 border-lime-400 pb-0.5 text-navy-100">
              Accueil
            </a>
            <a href="/dashboard" className="text-navy-400 transition-colors hover:text-navy-100">
              Dashboard
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <span className="hidden rounded-full border border-navy-700 px-4 py-1.5 text-sm font-medium text-navy-100 lg:block">
              09 80 40 04 84
            </span>
            <button className="rounded-full bg-lime-400 px-5 py-2 text-sm font-bold text-navy-950 transition-colors hover:bg-lime-300">
              Devis gratuit
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-col items-center px-4 pt-16 pb-12">
        {/* Badge */}

        {/* Title */}
        <h1 className="mb-5 text-center text-5xl font-extrabold leading-tight tracking-tight md:text-6xl lg:text-7xl">
          Où part votre groupe<span className="text-lime-400"> ?</span>
        </h1>

        {/* Subtitle */}
        <p className="mb-10 max-w-lg text-center text-base leading-relaxed text-navy-400">
          Décrivez votre trajet en une phrase. Notre assistant prépare votre
          devis — un conseiller reprend la main dès que c&apos;est utile.
        </p>

        {/* Chat card */}
        <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl shadow-navy-950/60">
          <ChatDevis />
        </div>

        {/* Social proof */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2 text-sm text-navy-400">
          <span className="flex items-center gap-1.5">
            <span className="text-yellow-400">★★★★★</span>
            <span className="font-medium text-navy-100">4,8/5</span>
            <span>· 600+ avis</span>
          </span>
          <span className="text-navy-700">•</span>
          <span>200+ autocaristes partenaires</span>
          <span className="text-navy-700">•</span>
          <span>Des dizaines de demandes traitées par jour</span>
        </div>
      </main>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-800">
                <svg className="h-5 w-5 text-navy-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
            }
            title="Réponse ultra rapide"
            description="Un devis sur mesure en moins de 5 minutes envoyé directement par mail"
          />
          <FeatureCard
            icon={
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime-400/15">
                <svg className="h-5 w-5 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                </svg>
              </div>
            }
            title="Meilleurs prix négociés"
            description="Les meilleurs autocaristes mis en concurrence"
          />
          <FeatureCard
            icon={
              <div className="flex h-10 w-10 shrink-0 rotate-45 items-center justify-center rounded-xl bg-blue-500/15">
                <svg className="h-5 w-5 -rotate-45 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
            }
            title="Conseil humain"
            description="Un expert compétent disponible pour gérer les demandes complexes"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy-800/50 py-6 text-center text-xs text-navy-500">
        Vos données sont protégées.{" "}
        <Link href="/rgpd" className="text-navy-400 underline underline-offset-2 transition-colors hover:text-lime-400">
          Politique de confidentialité
        </Link>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-navy-800 bg-navy-900 px-5 py-5">
      {icon}
      <div>
        <p className="font-semibold text-navy-100">{title}</p>
        <p className="mt-0.5 text-sm text-navy-400">{description}</p>
      </div>
    </div>
  );
}
