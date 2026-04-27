import { Globe } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type Language = "en" | "hi" | "ta";

export const LANGUAGES: { value: Language; label: string; native: string }[] = [
  { value: "en", label: "English", native: "English" },
  { value: "hi", label: "Hindi", native: "हिन्दी" },
  { value: "ta", label: "Tamil", native: "தமிழ்" },
];

interface Props {
  value: Language;
  onChange: (v: Language) => void;
}

export const LanguageSelect = ({ value, onChange }: Props) => {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Language)}>
      <SelectTrigger className="w-[140px] gap-2 bg-card border-border/80">
        <Globe className="h-4 w-4 text-accent" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((l) => (
          <SelectItem key={l.value} value={l.value}>
            {l.native} <span className="text-muted-foreground text-xs ml-1">({l.label})</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
