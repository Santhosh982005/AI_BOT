import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, Mic, MicOff, Send, Sparkles, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { type Language, LANGUAGES } from "./LanguageSelect";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant"; content: string };
const normalizeBrandName = (text: string) => text.replace(/Nyaya\s+Sahay/gi, "Nyaya Mitra");

const SUGGESTIONS: Record<Language, string[]> = {
  en: [
    "What are my rights if police arrest me?",
    "How do I file a consumer complaint online?",
    "What is the procedure for a no-fault divorce in India?",
    "My landlord won't return my deposit. What can I do?",
  ],
  hi: [
    "अगर पुलिस मुझे गिरफ्तार करे तो मेरे क्या अधिकार हैं?",
    "उपभोक्ता शिकायत ऑनलाइन कैसे दर्ज करें?",
    "तलाक की प्रक्रिया क्या है?",
    "मकान मालिक जमा राशि नहीं लौटा रहा, क्या करूँ?",
  ],
  ta: [
    "காவல்துறை என்னை கைது செய்தால் என் உரிமைகள் என்ன?",
    "நுகர்வோர் புகாரை எப்படி பதிவு செய்வது?",
    "விவாகரத்து செயல்முறை என்ன?",
    "வீட்டு உரிமையாளர் வைப்புத்தொகையை திருப்பித் தரவில்லை, என்ன செய்வது?",
  ],
};

interface Props { language: Language }

export const ChatPanel = ({ language }: Props) => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || isStreaming) return;
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setIsStreaming(true);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/legal-chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next, language }),
      });

      if (resp.status === 429) {
        toast({ title: "Slow down", description: "Too many requests. Please wait a moment.", variant: "destructive" });
        setIsStreaming(false);
        return;
      }
      if (resp.status === 402) {
        toast({ title: "AI credits exhausted", description: "Please add credits to continue.", variant: "destructive" });
        setIsStreaming(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantSoFar = "";
      let streamDone = false;
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantSoFar += delta;
              setMessages((prev) => prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content: normalizeBrandName(assistantSoFar) } : m
              ));
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsStreaming(false);
    }
  };

  const toggleListening = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast({ title: "Voice input not supported", description: "Try Chrome or Edge browser.", variant: "destructive" });
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = language === "hi" ? "hi-IN" : language === "ta" ? "ta-IN" : "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t; else interim += t;
      }
      setInput(finalText + interim);
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    rec.start();
    recognitionRef.current = rec;
    setIsListening(true);
  };

  const speakLast = async () => {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (!last) return;
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    try {
      const { data, error } = await supabase.functions.invoke("text-to-speech", {
        body: { text: normalizeBrandName(last.content).replace(/[#*_`>]/g, "") },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const audio = new Audio(`data:audio/mpeg;base64,${(data as any).audioContent}`);
      audioRef.current = audio;
      audio.onended = () => setSpeaking(false);
      audio.onerror = () => setSpeaking(false);
      await audio.play();
    } catch (e: any) {
      console.error(e);
      toast({ title: "Voice playback failed", description: e?.message ?? "Try again later.", variant: "destructive" });
      setSpeaking(false);
    }
  };

  const placeholder = language === "hi"
    ? "अपना कानूनी सवाल यहाँ लिखें..."
    : language === "ta"
    ? "உங்கள் சட்ட கேள்வியை இங்கே எழுதுங்கள்..."
    : "Type your legal question here...";

  return (
    <section id="chat" className="container py-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 text-accent text-xs font-semibold uppercase tracking-widest">
          <Sparkles className="h-3.5 w-3.5" /> Ask the assistant
        </div>
        <h2 className="mt-2 font-serif text-3xl md:text-4xl font-bold text-foreground">
          Have a legal question?
        </h2>
        <p className="mt-2 text-muted-foreground">
          Get a clear answer in {LANGUAGES.find((l) => l.value === language)?.native}. Type or use voice.
        </p>

        <div className="mt-8 gradient-card border border-border rounded-2xl shadow-elegant overflow-hidden">
          <div ref={scrollRef} className="h-[420px] overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="h-14 w-14 rounded-full gradient-gold flex items-center justify-center shadow-gold mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <p className="text-muted-foreground mb-5 max-w-sm">
                  Try one of these questions to get started:
                </p>
                <div className="grid sm:grid-cols-2 gap-2.5 w-full max-w-2xl">
                  {SUGGESTIONS[language].map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left text-sm rounded-lg border border-border bg-background hover:border-accent hover:bg-accent-soft/40 transition-smooth px-4 py-3 text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[85%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-2.5 shadow-soft"
                        : "max-w-[90%] rounded-2xl rounded-bl-sm bg-secondary text-secondary-foreground px-5 py-3.5 shadow-soft"
                    }
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-li:text-foreground/90 prose-ol:my-2 prose-ul:my-2">
                        {m.content ? (
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        ) : (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-border bg-background/60 p-3">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder}
                rows={1}
                className="resize-none min-h-[44px] max-h-32 bg-background"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <Button
                size="icon"
                variant={isListening ? "destructive" : "outline"}
                onClick={toggleListening}
                title="Voice input"
                className={isListening ? "animate-pulse-glow" : ""}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              {messages.some((m) => m.role === "assistant" && m.content) && (
                <Button size="icon" variant="outline" onClick={speakLast} title="Listen to answer">
                  {speaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              )}
              <Button onClick={() => send()} disabled={isStreaming || !input.trim()} className="gradient-gold text-primary hover:opacity-90 font-semibold">
                {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground px-1">
              ⚠️ General information only. For serious matters, consult a qualified lawyer or contact your State Legal Services Authority for free legal aid.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
