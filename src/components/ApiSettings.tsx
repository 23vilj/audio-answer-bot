import { useState } from "react";
import { ApiConfig, defaultApiConfig } from "@/config/api";
import { Settings, ChevronDown, ChevronUp } from "lucide-react";

interface ApiSettingsProps {
  config: ApiConfig;
  onChange: (config: ApiConfig) => void;
}

export function ApiSettings({ config, onChange }: ApiSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-surface hover:bg-surface-hover transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-display text-muted-foreground">API Endpoints</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isOpen && (
        <div className="p-4 space-y-3 bg-card animate-float-up">
          {([
            { key: "sttEndpoint" as const, label: "Speech-to-Text" },
            { key: "aiEndpoint" as const, label: "AI Model" },
            { key: "ttsEndpoint" as const, label: "Text-to-Speech" },
          ]).map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs font-display text-muted-foreground mb-1">{label}</label>
              <input
                type="url"
                value={config[key]}
                onChange={(e) => onChange({ ...config, [key]: e.target.value })}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm font-display text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                placeholder={defaultApiConfig[key]}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
