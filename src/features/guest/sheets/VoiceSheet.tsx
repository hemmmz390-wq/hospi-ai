import React, { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, RotateCcw, CheckCircle2, MicOff, Loader2 } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { useI18n } from "../../../i18n";
import { LOCALES, LOCALE_META, Locale } from "../../../i18n/types";
import { ChatMessage } from "../../../types";
import { SPEECH_LANG, TranscriptionOutcome, voiceService } from "../../../services/voiceService";
import { Button, Overlay, Select, Textarea } from "../../../components/ui";
import { cn } from "../../../lib/cn";
import { deptKey } from "../components";

type Phase = "idle" | "recording" | "processing" | "review" | "understanding" | "done" | "unavailable";

/** Contoh ucapan untuk demo, supaya fitur suara bisa dicoba tanpa mikrofon. */
const SAMPLES: Record<string, string[]> = {
  id: ["AC kamar saya tidak dingin.", "Tolong antar dua handuk dan air mineral."],
  en: ["The AC in my room isn't cold.", "Could you send two towels and a bottle of water?"],
  ja: ["部屋のエアコンが効きません。", "タオルを2枚お願いします。"],
  ko: ["방 에어컨이 시원하지 않아요.", "수건 두 장 부탁드립니다."],
  zh: ["房间空调不制冷。", "请送两条毛巾。"],
  ru: ["Кондиционер в номере не охлаждает.", "Принесите, пожалуйста, два полотенца."],
  fr: ["La climatisation ne refroidit pas.", "Pourriez-vous apporter deux serviettes ?"],
  de: ["Die Klimaanlage kühlt nicht.", "Könnten Sie zwei Handtücher bringen?"],
};

function useMicLevel(stream: MediaStream | null) {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (!stream) return;
    let raf = 0;
    let ctx: AudioContext | null = null;
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const v of data) sum += Math.abs(v - 128);
        setLevel(Math.min(1, sum / data.length / 24));
        raf = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      /* visual saja; abaikan bila tidak didukung */
    }
    return () => {
      cancelAnimationFrame(raf);
      ctx?.close().catch(() => {});
    };
  }, [stream]);
  return level;
}

export function VoiceSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { sendChatMessage, isAiProcessing } = useApp();
  const { t, locale } = useI18n();
  const [phase, setPhase] = useState<Phase>("idle");
  const [lang, setLang] = useState<Locale>(locale);
  const [transcript, setTranscript] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ChatMessage | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const level = useMicLevel(stream);

  const transcriptRef = useRef("");
  const recognitionRef = useRef<any>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    try {
      recognitionRef.current?.stop();
    } catch {
      /* sudah berhenti */
    }
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.stop();
      } catch {
        /* sudah berhenti */
      }
    }
    setStream((s) => {
      s?.getTracks().forEach((tr) => tr.stop());
      return null;
    });
  }, []);

  useEffect(() => {
    if (open) {
      setPhase(voiceService.microphoneSupported() || voiceService.browserRecognitionSupported() ? "idle" : "unavailable");
      setTranscript("");
      transcriptRef.current = "";
      setSeconds(0);
      setError(null);
      setResult(null);
      setLang(locale);
    } else {
      cleanup();
    }
  }, [open, locale, cleanup]);

  useEffect(() => () => cleanup(), [cleanup]);

  const start = async () => {
    setError(null);
    setTranscript("");
    transcriptRef.current = "";
    setSeconds(0);
    chunksRef.current = [];

    const recognition = voiceService.createRecognition(SPEECH_LANG[lang]);
    if (recognition) {
      recognition.onresult = (e: any) => {
        let text = "";
        for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
        transcriptRef.current = text;
        setTranscript(text);
      };
      recognition.onerror = () => {};
      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch {
        /* sudah berjalan */
      }
    }

    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(s);
      const rec = new MediaRecorder(s);
      recorderRef.current = rec;
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        s.getTracks().forEach((tr) => tr.stop());
        setStream(null);
        if (transcriptRef.current.trim()) {
          setPhase("review");
          return;
        }
        // Browser tidak menangkap teks: coba transkripsi server (butuh API key).
        setPhase("processing");
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const out: TranscriptionOutcome = blob.size > 0 ? await voiceService.transcribeOnServer(blob, SPEECH_LANG[lang]) : { ok: false as const, reason: "transcription_error" as const };
        // tsconfig tidak memakai strict, jadi penyempitan lewat `ok` tidak berlaku.
        if ("reason" in out) {
          setError(out.reason === "no_api_key" ? t("g.voice.noTranscriber") : t("g.voice.notCaught"));
        } else {
          transcriptRef.current = out.text;
          setTranscript(out.text);
        }
        setPhase("review");
      };
      rec.start(250);
    } catch {
      cleanup();
      setError(t("g.voice.micBlocked"));
      setPhase("review");
      return;
    }

    setPhase("recording");
    timerRef.current = setInterval(() => setSeconds((n) => n + 1), 1000);
  };

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    try {
      recognitionRef.current?.stop();
    } catch {
      /* sudah berhenti */
    }
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    else setPhase("review");
  };

  const send = async (text: string) => {
    if (!text.trim()) return;
    setPhase("understanding");
    const reply = await sendChatMessage(text.trim(), { isVoiceMessage: true, audioDurationSec: Math.max(1, seconds) });
    setResult(reply);
    setPhase("done");
  };

  if (!open) return null;

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const bars = Array.from({ length: 24 }, (_, i) => {
    const wave = Math.sin((i / 24) * Math.PI);
    return 6 + Math.round(wave * level * 42 * (0.6 + ((i * 7) % 5) / 10));
  });

  return (
    <Overlay
      open
      onClose={() => {
        cleanup();
        onClose();
      }}
      title={t("g.voice.title")}
      description={phase === "idle" ? t("g.voice.subtitle") : undefined}
      footer={
        phase === "review" ? (
          <>
            <Button variant="ghost" icon={<RotateCcw className="h-4 w-4" />} onClick={start}>
              {t("g.voice.again")}
            </Button>
            <Button variant="primary" disabled={!transcript.trim()} onClick={() => send(transcript)}>
              {t("g.voice.send")}
            </Button>
          </>
        ) : phase === "done" || phase === "unavailable" ? (
          <Button variant="primary" onClick={onClose}>
            {t("a.done")}
          </Button>
        ) : undefined
      }
    >
      <div className="flex min-h-[260px] flex-col" aria-live="polite">
        {phase === "unavailable" && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <MicOff className="h-8 w-8 text-muted" />
            <p className="mt-3 text-sm font-semibold">{t("g.voice.unavailableTitle")}</p>
            <p className="mt-1 max-w-xs text-[0.8125rem] text-muted">{t("g.voice.unavailableBody")}</p>
          </div>
        )}

        {phase === "idle" && (
          <div className="flex flex-1 flex-col items-center">
            <button
              type="button"
              onClick={start}
              aria-label={t("g.voice.start")}
              className="mt-4 flex h-20 w-20 items-center justify-center rounded-full bg-fg text-inverse transition-transform active:scale-95"
            >
              <Mic className="h-8 w-8" />
            </button>
            <p className="mt-3 text-sm font-medium">{t("g.voice.tap")}</p>
            <div className="mt-5 w-full max-w-xs">
              <label htmlFor="voice-lang" className="mb-1 block text-center text-xs text-muted">
                {t("g.voice.language")}
              </label>
              <Select id="voice-lang" value={lang} onChange={(e) => setLang(e.target.value as Locale)}>
                {LOCALES.map((l) => (
                  <option key={l} value={l}>
                    {LOCALE_META[l].nativeName}
                  </option>
                ))}
              </Select>
            </div>
            <div className="mt-6 w-full">
              <p className="mb-2 text-xs text-muted">{t("g.voice.samples")}</p>
              <div className="flex flex-col gap-2">
                {(SAMPLES[lang] || SAMPLES.en).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      transcriptRef.current = s;
                      setTranscript(s);
                      setSeconds(3);
                      setError(null);
                      setPhase("review");
                    }}
                    className="rounded-lg border border-line px-3 py-2 text-left text-[0.8125rem] hover:bg-sunken"
                  >
                    “{s}”
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {phase === "recording" && (
          <div className="flex flex-1 flex-col items-center">
            <p className="mt-2 text-sm font-medium">{t("g.voice.listening")}</p>
            <p className="text-xs tabular-nums text-muted">{mmss}</p>
            <div className="mt-6 flex h-14 items-center gap-[3px]" aria-hidden>
              {bars.map((h, i) => (
                <span key={i} className="w-1 rounded-full bg-fg transition-[height] duration-75" style={{ height: h }} />
              ))}
            </div>
            <p className={cn("mt-5 min-h-[44px] max-w-sm text-center text-sm", transcript ? "text-fg" : "text-subtle")}>{transcript || t("g.voice.speakNow")}</p>
            <button type="button" onClick={stop} aria-label={t("g.voice.stop")} className="mt-4 flex h-14 w-14 items-center justify-center rounded-full border border-line hover:bg-sunken">
              <Square className="h-5 w-5 fill-current" />
            </button>
          </div>
        )}

        {phase === "processing" && (
          <div className="flex flex-1 flex-col items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted" />
            <p className="mt-3 text-sm">{t("g.voice.processing")}</p>
          </div>
        )}

        {phase === "review" && (
          <div className="space-y-3">
            {error && <p className="rounded-lg bg-warn-soft p-3 text-[0.8125rem] text-warn">{error}</p>}
            <label htmlFor="voice-text" className="block text-[0.8125rem] font-medium">
              {t("g.voice.check")}
            </label>
            <Textarea id="voice-text" value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder={t("g.voice.typeInstead")} className="min-h-[110px]" />
          </div>
        )}

        {phase === "understanding" && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted" />
            <p className="mt-3 text-sm font-medium">{t("g.voice.understanding")}</p>
            <p className="mt-1 max-w-xs text-[0.8125rem] text-muted">“{transcript}”</p>
          </div>
        )}

        {phase === "done" && (
          <div className="flex flex-1 flex-col items-center justify-center text-center animate-enter">
            <CheckCircle2 className="h-10 w-10 text-ok" />
            {result?.ticket ? (
              <>
                <p className="mt-3 text-base font-semibold">{t("g.qr.sentTitle", { dept: t(deptKey(result.ticket.dept)) })}</p>
                <p className="mt-1 text-[0.8125rem] text-muted">{t("g.qr.sentBody", { id: result.ticket.id, min: result.ticket.sla.done_min })}</p>
              </>
            ) : (
              <p className="mt-3 max-w-sm text-sm">{result?.text || t("g.voice.answered")}</p>
            )}
            {isAiProcessing && <p className="mt-2 text-xs text-muted">{t("g.voice.understanding")}</p>}
          </div>
        )}
      </div>
    </Overlay>
  );
}
