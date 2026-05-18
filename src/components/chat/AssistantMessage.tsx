import { useState } from "react";
import type { Message } from "@/lib/chat/types";
import { Markdown } from "./Markdown";
import { Logo } from "./Logo";
import { Check, Copy, RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";

interface Props {
  message: Message;
  streaming?: boolean;
  onRegenerate?: () => void;
}

export function AssistantMessage({ message, streaming, onRegenerate }: Props) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group msg-enter flex gap-3 px-4 md:px-6 py-3">
      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center">
        <Logo size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <div className={streaming && !message.content ? "" : streaming ? "cursor-blink" : ""}>
          <Markdown>{message.content || ""}</Markdown>
        </div>
        {!streaming && message.content && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <IconBtn
                onClick={copy}
                label={copied ? "Copied" : "Copy"}
                icon={copied ? <Check size={14} /> : <Copy size={14} />}
              />
              {onRegenerate && (
                <IconBtn
                  onClick={onRegenerate}
                  label="Regenerate"
                  icon={<RefreshCw size={14} />}
                />
              )}
              <IconBtn
                onClick={() => setFeedback(feedback === "up" ? null : "up")}
                label="Good response"
                active={feedback === "up"}
                icon={<ThumbsUp size={14} />}
              />
              <IconBtn
                onClick={() => setFeedback(feedback === "down" ? null : "down")}
                label="Bad response"
                active={feedback === "down"}
                icon={<ThumbsDown size={14} />}
              />
            </div>
            {message.usage && (
              <span className="text-[11px] text-muted-foreground/70 opacity-0 transition-opacity group-hover:opacity-100">
                {message.usage.prompt} in · {message.usage.completion} out · {message.usage.total} tokens
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function IconBtn({
  onClick,
  label,
  icon,
  active,
}: {
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${active ? "text-primary" : ""}`}
    >
      {icon}
    </button>
  );
}
