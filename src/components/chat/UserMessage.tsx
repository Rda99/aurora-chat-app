import { useState } from "react";
import type { Message } from "@/lib/chat/types";
import { Pencil, X, Check } from "lucide-react";

interface Props {
  message: Message;
  onEdit?: (newContent: string) => void;
}

export function UserMessage({ message, onEdit }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const commit = () => {
    const t = draft.trim();
    if (t && t !== message.content && onEdit) onEdit(t);
    setEditing(false);
  };

  return (
    <div className="msg-enter group flex justify-end px-4 md:px-6 py-3">
      <div className="flex max-w-[85%] md:max-w-[70%] flex-col items-end">
        {message.images && message.images.length > 0 && (
          <div className="mb-2 flex flex-wrap justify-end gap-2">
            {message.images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Attachment ${i + 1}`}
                className="max-h-48 rounded-lg border border-border object-cover"
              />
            ))}
          </div>
        )}
        {editing ? (
          <div className="w-full rounded-2xl border border-primary/40 bg-[var(--bubble)] p-2">
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={Math.min(8, Math.max(2, draft.split("\n").length))}
              className="w-full resize-none bg-transparent text-[15px] text-foreground focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  commit();
                }
                if (e.key === "Escape") setEditing(false);
              }}
            />
            <div className="mt-1 flex justify-end gap-1">
              <button
                onClick={() => setEditing(false)}
                className="flex h-7 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:bg-accent"
              >
                <X size={12} /> Cancel
              </button>
              <button
                onClick={commit}
                className="flex h-7 items-center gap-1 rounded-md bg-primary px-2.5 text-xs text-primary-foreground hover:opacity-90"
              >
                <Check size={12} /> Send
              </button>
            </div>
          </div>
        ) : (
          <div
            className="whitespace-pre-wrap break-words bg-[var(--bubble)] px-4 py-3 text-[15px]"
            style={{ borderRadius: "18px 18px 4px 18px" }}
          >
            {message.content}
          </div>
        )}
        <div className="mt-1 flex items-center gap-2">
          {!editing && onEdit && (
            <button
              onClick={() => {
                setDraft(message.content);
                setEditing(true);
              }}
              className="flex h-5 items-center gap-1 rounded text-[11px] text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
              title="Edit & resend"
            >
              <Pencil size={11} /> Edit
            </button>
          )}
          <span className="text-[11px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
            {time}
          </span>
        </div>
      </div>
    </div>
  );
}
