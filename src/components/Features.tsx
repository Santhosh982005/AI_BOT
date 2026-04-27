import { Brain, FileSearch, Globe2, Mic, ScrollText, ShieldCheck } from "lucide-react";

const features = [
  { icon: Brain, title: "Gemini-powered reasoning", desc: "NLP + LLM understands your question and gives a meaningful, context-aware answer." },
  { icon: Globe2, title: "Multilingual", desc: "Ask and read answers in English, Hindi, or Tamil — no translation needed." },
  { icon: ScrollText, title: "Plain-language answers", desc: "Complex legal terms are converted into easy, everyday words anyone can follow." },
  { icon: FileSearch, title: "PDF summarization", desc: "Upload notices, contracts, or judgments. Get a 7-section simple summary." },
  { icon: Mic, title: "Voice friendly", desc: "Speak your question and listen to the answer — perfect for low-literacy users." },
  { icon: ShieldCheck, title: "Safe & responsible", desc: "Provides general guidance only and points users to qualified lawyers and State Legal Services Authorities." },
];

export const Features = () => {
  return (
    <section id="features" className="container py-20">
      <div className="max-w-2xl">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">Built for everyone</h2>
        <p className="mt-3 text-muted-foreground">
          Nyaya Mitra combines NLP, the Gemini API, and live retrieval to make Indian law
          accessible — even if you've never read a legal document before.
        </p>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="group relative gradient-card rounded-xl border border-border p-6 shadow-soft transition-smooth hover:shadow-elegant hover:-translate-y-0.5"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent-soft text-primary">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
