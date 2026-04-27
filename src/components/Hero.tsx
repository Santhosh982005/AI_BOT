import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Sparkles } from "lucide-react";

export const Hero = () => {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero" />
      <div className="relative container py-20 md:py-28">
        <div className="max-w-3xl">
          <h1 className="font-serif text-4xl md:text-6xl font-bold leading-[1.05] text-primary-foreground animate-fade-in">
            Understand Indian Law<br />
            <span className="bg-gradient-to-r from-accent to-[hsl(36_75%_65%)] bg-clip-text text-transparent">
              In Simple Words.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-base md:text-lg text-primary-foreground/80 leading-relaxed animate-fade-in">
            Ask any legal question or upload a document. Get clear, step-by-step guidance in
            English, Hindi, or Tamil — built for everyone, not just lawyers.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3 animate-fade-in">
            <Button asChild size="lg" className="gradient-gold text-primary hover:opacity-90 shadow-gold font-semibold">
              <a href="#chat">
                Ask a Question <ArrowRight className="ml-1.5 h-4 w-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <a href="#document">
                <FileText className="mr-1.5 h-4 w-4" /> Summarize a PDF
              </a>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-primary-foreground/70">
            <Stat label="Languages" value="3+" />
            <Stat label="Voice support" value="Yes" />
            <Stat label="PDF pages" value="Up to 100" />
          </div>
        </div>
      </div>
    </section>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline gap-2">
    <span className="text-accent font-semibold">{value}</span>
    <span>{label}</span>
  </div>
);
