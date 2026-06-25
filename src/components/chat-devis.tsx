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

export default function ChatDevis() {
  const { messages, sendMessage, status, error } = useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isLoading = status === "streaming" || status === "submitted";

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

  return (
    <div className="flex flex-col gap-4">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-1"
      >
        {messages.length === 0 && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl bg-navy-800 px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-navy-100">
              {`Bonjour et bienvenue chez NeoTravel ! 😊

Je suis là pour vous aider avec votre projet de transport de groupe. Nous proposons des solutions en bus, autocar et minibus avec chauffeur.

Pouvez-vous me dire quel type de déplacement vous envisagez ?

Aller simple, aller-retour ou circuit avec plusieurs étapes ?

Et pour combien de personnes environ ?`}
            </div>
          </div>
        )}

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
                    ? "bg-lime-400/15 text-lime-400"
                    : "bg-navy-800 text-navy-100"
                }`}
              >
                {text}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-navy-800 px-4 py-2.5">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-navy-400 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-navy-400 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-navy-400 [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
          Erreur de connexion — réessayez ou passez par le formulaire.
        </p>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ex: On est 45, départ Lyon le 14 mars..."
          className="flex-1 rounded-xl border border-navy-700 bg-navy-800 px-4 py-2.5 text-sm text-navy-100 placeholder:text-navy-400/60 focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400/30"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="shrink-0 rounded-xl bg-lime-400 px-4 py-2.5 text-sm font-bold text-navy-950 transition-colors hover:bg-lime-300 disabled:opacity-40"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
          </svg>
        </button>
      </form>
    </div>
  );
}
