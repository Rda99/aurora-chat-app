import { Logo } from "./Logo";

const SUGGESTIONS = [
  "Write a Python script to rename files in a folder",
  "Explain quantum computing in simple terms",
  "Draft a polite follow-up email to a client",
  "Compare React Server Components and SSR",
];

export function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-6">
      <div className="mb-6">
        <Logo size={56} />
      </div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">How can I help today?</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Multi-provider chat — connect any OpenAI-compatible model.
      </p>
      <div className="grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-foreground/90 transition-colors hover:bg-accent"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
