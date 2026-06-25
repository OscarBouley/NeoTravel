"use client";

import { useChat } from "@ai-sdk/react";
import { type UIMessage } from "ai";
import { useRef, useEffect, useState } from "react";

function getTextContent(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

const CHIPS = [
  { label: "Sortie scolaire", emoji: "🎒" },
  { label: "Séminaire entreprise", emoji: "💼" },
  { label: "Mariage / événement", emoji: "💍" },
  { label: "Compétition sportive", emoji: "🏆" },
];

export default function ChatDevis() {
  const { messages, sendMessage, status, error } = useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isLoading = status === "streaming" || status === "submitted";
  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  }

  function handleChip(label: string) {
    setInput(label);
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-950 text-sm font-bold text-lime-400">
          N
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">
            Assistant NeoTravel
          </span>
          <span className="flex items-center gap-1 text-xs text-emerald-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            en ligne
          </span>
        </div>
      </div>

      {/* Messages */}
      {hasMessages && (
        <div
          ref={scrollRef}
          className="flex max-h-[320px] flex-col gap-3 overflow-y-auto px-5 py-4"
        >
          {messages.map((msg) => {
            const text = getTextContent(msg);
            if (msg.role === "assistant" && !text) return null;

            return (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-navy-950 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {text}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-gray-100 px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input + chips */}
      <div className={`${hasMessages ? "border-t border-gray-100" : ""} px-5 py-4`}>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex : un car pour 45 personnes, Lyon → Bordeaux, le 14 juillet..."
            className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-lime-400 text-navy-950 transition-colors hover:bg-lime-300 disabled:opacity-40"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
            </svg>
          </button>
        </form>

        {!hasMessages && (
          <div className="mt-3 flex flex-wrap gap-2">
            {CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleChip(chip.label)}
                className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 transition-all hover:border-lime-400 hover:text-lime-600"
              >
                <span>{chip.emoji}</span>
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className="mt-2 text-xs text-red-500">
            Erreur de connexion — réessayez.
          </p>
        )}
      </div>
    </div>
  );
}
