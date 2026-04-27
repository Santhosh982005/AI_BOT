import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { type Language } from "./LanguageSelect";

// Use legacy build to avoid worker hassles in Vite
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
// @ts-ignore
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerSrc;

interface Props { language: Language }

export const PdfPanel = ({ language }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (f.type !== "application/pdf") {
      toast({ title: "PDF only", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }
    if (f.size > 25 * 1024 * 1024) {
      toast({ title: "Too large", description: "Please keep under 25 MB.", variant: "destructive" });
      return;
    }
    setFile(f);
    setSummary("");
  };

  const summarize = async () => {
    if (!file) return;
    setLoading(true);
    setSummary("");
    try {
      setProgress("Reading PDF...");
      const buf = await file.arrayBuffer();
      const pdf = await (pdfjsLib as any).getDocument({ data: buf }).promise;
      const totalPages = Math.min(pdf.numPages, 100);
      let fullText = "";
      for (let i = 1; i <= totalPages; i++) {
        setProgress(`Reading page ${i} of ${totalPages}...`);
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((it: any) => it.str).join(" ");
        fullText += `\n\n[Page ${i}]\n${pageText}`;
      }
      if (!fullText.trim()) {
        toast({ title: "No text found", description: "This PDF may be scanned images. OCR is not supported yet.", variant: "destructive" });
        setLoading(false);
        return;
      }

      setProgress("Asking AI to simplify...");
      const { data, error } = await supabase.functions.invoke("summarize-legal-doc", {
        body: { text: fullText, language, filename: file.name },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setSummary((data as any).summary);
      setProgress("");
    } catch (e: any) {
      console.error(e);
      toast({ title: "Could not summarize", description: e?.message ?? "Try again.", variant: "destructive" });
      setProgress("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="document" className="bg-secondary/40 border-y border-border">
      <div className="container py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-accent text-xs font-semibold uppercase tracking-widest">
            <FileText className="h-3.5 w-3.5" /> Document summarizer
          </div>
          <h2 className="mt-2 font-serif text-3xl md:text-4xl font-bold text-foreground">
            Upload a legal PDF
          </h2>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Court notice, rental agreement, employment contract, FIR copy — get a plain-language
            summary with risks, deadlines, and action steps.
          </p>

          <div className="mt-8 grid lg:grid-cols-2 gap-6">
            {/* Upload card */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              className="gradient-card rounded-2xl border-2 border-dashed border-border p-8 shadow-soft flex flex-col items-center justify-center text-center min-h-[260px]"
            >
              {!file ? (
                <>
                  <div className="h-12 w-12 rounded-full bg-accent-soft flex items-center justify-center text-primary mb-4">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="font-medium text-foreground">Drop your PDF here</p>
                  <p className="text-sm text-muted-foreground mt-1">or click to browse · max 100 pages</p>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                  <Button onClick={() => inputRef.current?.click()} className="mt-5 gradient-gold text-primary font-semibold hover:opacity-90">
                    Choose PDF
                  </Button>
                </>
              ) : (
                <div className="w-full space-y-4">
                  <div className="flex items-center gap-3 rounded-lg bg-background border border-border p-3 text-left">
                    <FileText className="h-8 w-8 text-accent shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => { setFile(null); setSummary(""); }}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={summarize}
                    disabled={loading}
                    className="w-full gradient-gold text-primary font-semibold hover:opacity-90"
                  >
                    {loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {progress || "Working..."}</>
                    ) : (
                      "Summarize in simple language"
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Output card */}
            <div className="gradient-card rounded-2xl border border-border p-6 shadow-soft min-h-[260px]">
              {summary ? (
                <div className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:text-foreground prose-strong:text-foreground prose-p:text-foreground/90 prose-li:text-foreground/90">
                  <ReactMarkdown>{summary}</ReactMarkdown>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-10">
                  <FileText className="h-10 w-10 mb-3 opacity-50" />
                  <p className="text-sm">Your simple summary will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
