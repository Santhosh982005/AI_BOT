import { useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ChatPanel } from "@/components/ChatPanel";
import { PdfPanel } from "@/components/PdfPanel";
import { Footer } from "@/components/Footer";
import type { Language } from "@/components/LanguageSelect";

const Index = () => {
  const [language, setLanguage] = useState<Language>("en");
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header language={language} onLanguageChange={setLanguage} />
      <main className="flex-1">
        <Hero />
        <ChatPanel language={language} />
        <PdfPanel language={language} />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
