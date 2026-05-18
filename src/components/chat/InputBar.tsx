import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { ArrowUp, Globe, Paperclip, Square } from "lucide-react";

export interface InputBarHandle {
  focus: () => void;
}

interface Props {
  onSend: (text: string) => void;
  onStop?: () => void;
  streaming?: boolean;
  disabled?: boolean;
}

export const InputBar = forwardRef<InputBarHandle, Props>(function InputBar(
  { onSend, onStop, streaming, disabled },
  ref,
) {
  const [value, setValue] = useState("");
  const [webSearch, setWebSearch] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => taRef.current?.focus(),
  }));

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = 22;
    const maxHeight = lineHeight * 6 + 8;
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
  }, [value]);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    setValue("");
    onSend(text);
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (streaming) return;
      submit();
    }
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="px-3 pb-4 pt-2 md:px-6">
      <div className="mx-auto max-w-[760px] rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[var(--chat-bg)] px-3 py-2.5 float-shadow">
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          rows={1}
          placeholder="Ask anything..."
          className="block w-full resize-none border-0 bg-transparent px-1 py-1 text-[15px] leading-[22px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
        />
        <div className="mt-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Attach file"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Paperclip size={16} />
            </button>
            <button
              type="button"
              onClick={() => setWebSearch((v) => !v)}
              className={`flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs transition-colors ${
                webSearch
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Globe size={13} />
              Web search
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground/60">
              {value.length > 0 ? value.length : ""}
            </span>
            {streaming ? (
              <button
                type="button"
                onClick={onStop}
                title="Stop generating"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Square size={14} fill="currentColor" />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={!canSend}
                title="Send"
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                  canSend
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "bg-[var(--bubble)] text-muted-foreground/60"
                }`}
              >
                <ArrowUp size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted-foreground/60">
        Enter to send · Shift+Enter for newline · ⌘K to focus
      </p>
    </div>
  );
});
