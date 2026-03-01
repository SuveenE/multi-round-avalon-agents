"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface VoiceConfig {
  voice: SpeechSynthesisVoice | null;
  pitch: number;
  rate: number;
}

interface UseSpeechSynthesisReturn {
  voices: SpeechSynthesisVoice[];
  isSpeaking: boolean;
  speak: (text: string, config: VoiceConfig, speedMultiplier?: number) => Promise<void>;
  cancel: () => void;
  assignVoices: (playerNames: string[]) => Record<string, VoiceConfig>;
  narratorConfig: VoiceConfig;
}

// Distinct pitch/rate combos to differentiate players even with few voices
const VOICE_VARIATIONS: { pitch: number; rate: number }[] = [
  { pitch: 1.0, rate: 1.0 },
  { pitch: 1.3, rate: 0.9 },
  { pitch: 0.7, rate: 1.1 },
  { pitch: 1.1, rate: 0.85 },
  { pitch: 0.85, rate: 1.05 },
];

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null);
  const resolveRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) {
        setVoices(available);
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  const speak = useCallback(
    (text: string, config: VoiceConfig, speedMultiplier = 1): Promise<void> => {
      return new Promise((resolve) => {
        if (typeof window === "undefined") {
          resolve();
          return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        if (config.voice) utterance.voice = config.voice;
        utterance.pitch = config.pitch;
        utterance.rate = config.rate * speedMultiplier;

        currentUtterance.current = utterance;
        resolveRef.current = resolve;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
          setIsSpeaking(false);
          currentUtterance.current = null;
          resolveRef.current = null;
          resolve();
        };
        utterance.onerror = (e) => {
          // "interrupted" and "canceled" are expected when we cancel speech
          if (e.error !== "interrupted" && e.error !== "canceled") {
            console.warn("Speech error:", e.error);
          }
          setIsSpeaking(false);
          currentUtterance.current = null;
          resolveRef.current = null;
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      });
    },
    []
  );

  const cancel = useCallback(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    if (resolveRef.current) {
      resolveRef.current();
      resolveRef.current = null;
    }
    currentUtterance.current = null;
  }, []);

  const assignVoices = useCallback(
    (playerNames: string[]): Record<string, VoiceConfig> => {
      // Prefer English voices
      const englishVoices = voices.filter(
        (v) => v.lang.startsWith("en") && !v.name.includes("Compact")
      );
      const pool = englishVoices.length >= 3 ? englishVoices : voices;

      const map: Record<string, VoiceConfig> = {};
      playerNames.forEach((name, i) => {
        const variation = VOICE_VARIATIONS[i % VOICE_VARIATIONS.length];
        map[name] = {
          voice: pool.length > 0 ? pool[i % pool.length] : null,
          pitch: variation.pitch,
          rate: variation.rate,
        };
      });
      return map;
    },
    [voices]
  );

  // Narrator uses a deeper, slower voice
  const narratorConfig: VoiceConfig = {
    voice:
      voices.find(
        (v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("daniel")
      ) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      null,
    pitch: 0.9,
    rate: 0.95,
  };

  return { voices, isSpeaking, speak, cancel, assignVoices, narratorConfig };
}
