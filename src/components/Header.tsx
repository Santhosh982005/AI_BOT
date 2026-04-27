import { Scale } from "lucide-react";
import { LanguageSelect, type Language } from "./LanguageSelect";

interface Props {
  language: Language;
  onLanguageChange: (l: Language) => void;
}

export const Header = ({ language, onLanguageChange }: Props) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-gold shadow-soft">
            <Scale className="h-5 w-5 text-primary" />
          </div>
          <div className="leading-tight">
            <div className="font-serif text-lg font-bold text-foreground">Nyaya Mitra</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">AI Legal Assistant</div>
          </div>
        </a>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <a href="#chat" className="hover:text-foreground transition-smooth">Ask</a>
          <a href="#document" className="hover:text-foreground transition-smooth">Summarize PDF</a>
          <a href="#features" className="hover:text-foreground transition-smooth">Features</a>
        </nav>
        <LanguageSelect value={language} onChange={onLanguageChange} />
      </div>
    </header>
  );
};
