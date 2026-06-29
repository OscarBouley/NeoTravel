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

function useSmoothText(targetText: string, isStreaming: boolean): string {
  const [displayed, setDisplayed] = useState(targetText);
  const targetRef = useRef(targetText);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    targetRef.current = targetText;
  }, [targetText]);

  useEffect(() => {
    if (!isStreaming) {
      cancelAnimationFrame(rafRef.current);
      setDisplayed(targetRef.current);
      return;
    }

    function tick() {
      setDisplayed((prev) => {
        const target = targetRef.current;
        const remaining = target.length - prev.length;
        if (remaining <= 0) return prev;
        const chars = Math.max(1, Math.ceil(remaining / 12));
        return target.slice(0, prev.length + chars);
      });
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isStreaming]);

  return displayed;
}

function AssistantBubble({ text, isStreaming }: { text: string; isStreaming: boolean }) {
  const smoothText = useSmoothText(text, isStreaming);
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl bg-gray-100 px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-gray-900">
        {smoothText}
      </div>
    </div>
  );
}

const CHIPS = [
  { label: "Sortie scolaire", text: "J'aurais besoin d'un bus pour une sortie scolaire", emoji: "🎒" },
  { label: "Séminaire entreprise", text: "J'aurais besoin d'un bus pour un séminaire d'entreprise", emoji: "💼" },
  { label: "Mariage / événement", text: "J'aurais besoin d'un bus pour un mariage", emoji: "💍" },
  { label: "Compétition sportive", text: "J'aurais besoin d'un bus pour une compétition sportive", emoji: "🏆" },
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

  function handleChip(text: string) {
    sendMessage({ text });
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
          {messages.map((msg, i) => {
            const text = getTextContent(msg);
            if (msg.role === "assistant" && !text) return null;

            if (msg.role === "assistant") {
              const isLast = i === messages.length - 1;
              return (
                <AssistantBubble
                  key={msg.id}
                  text={text}
                  isStreaming={isLast && status === "streaming"}
                />
              );
            }

            return (
              <div
                key={msg.id}
                className="flex justify-end"
              >
                <div className="max-w-[85%] rounded-2xl bg-navy-950 px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-white">
                  {text}
                </div>
              </div>
            );
          })}

          {status === "submitted" && (
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
                onClick={() => handleChip(chip.text)}
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
