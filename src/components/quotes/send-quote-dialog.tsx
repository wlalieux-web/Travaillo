"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Send, ExternalLink } from "lucide-react";
import { sendQuote } from "@/lib/quotes/actions";
import { useRouter } from "next/navigation";

interface Props {
  quoteId: string;
  quoteNumber: string;
  currentToken?: string;
  currentStatus: string;
  onClose: () => void;
}

export function SendQuoteDialog({ quoteId, quoteNumber, currentToken, currentStatus, onClose }: Props) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(currentStatus !== "draft" ? currentToken ?? null : null);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl = token
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/quote/${token}`
    : null;

  async function handleSend() {
    setSending(true);
    try {
      const { publicToken } = await sendQuote(quoteId);
      setToken(publicToken);
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  function copyLink() {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-[#0d1f10] border border-emerald-900/30 rounded-2xl shadow-2xl p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold">Envoyer le devis {quoteNumber}</h3>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {!token ? (
            <>
              <p className="text-white/50 text-sm mb-6 leading-relaxed">
                Le devis sera marqué comme <strong className="text-blue-400">Envoyé</strong> et un lien public sera généré pour que votre client puisse l'approuver en ligne.
              </p>
              <button
                onClick={handleSend}
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm disabled:opacity-60 transition-opacity"
              >
                <Send className="h-4 w-4" />
                {sending ? "Envoi en cours..." : "Générer le lien et envoyer"}
              </button>
            </>
          ) : (
            <>
              <p className="text-white/50 text-sm mb-4">
                Copiez ce lien et partagez-le avec votre client par email ou SMS.
              </p>
              <div className="flex items-center gap-2 bg-white/[0.04] border border-emerald-900/20 rounded-lg px-3 py-2.5 mb-4">
                <span className="text-white/60 text-xs truncate flex-1 font-mono">{publicUrl}</span>
                <button
                  onClick={copyLink}
                  className="flex-shrink-0 text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={copyLink}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-600/30 transition-colors"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copié !" : "Copier le lien"}
                </button>
                <a
                  href={publicUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/60 text-sm font-medium hover:bg-white/[0.08] transition-colors"
                >
                  <ExternalLink className="h-4 w-4" /> Prévisualiser
                </a>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
