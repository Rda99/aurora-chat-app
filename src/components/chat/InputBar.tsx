import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ArrowUp, Globe, Mic, MicOff, Paperclip, Square, X } from "lucide-react";
import { toast } from "sonner";

export interface InputBarHandle {
  focus: () => void;
}

interface Props {
  onSend: (text: string, images?: string[]) => void;
  onStop?: () => void;
  streaming?: boolean;
  disabled?: boolean;
  modelSupportsVision?: boolean;
}

const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const InputBar = forwardRef<InputBarHandle, Props>(function InputBar(
  { onSend, onStop, streaming, disabled, modelSupportsVision = true },
  ref,
) {
  const [value, setValue] = useState("");
  const [webSearch, setWebSearch] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recogRef = useRef<any>(null);

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

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    if (!modelSupportsVision) {
      toast.error(
        "Current model has no vision support. Switch to a vision-capable model (e.g. gpt-4o, claude-3.5, gemini, llama-3.2-vision) to attach images.",
      );
      return;
    }
    const next: string[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) {
        toast.error(`${f.name} is not an image`);
        continue;
      }
      if (f.size > MAX_IMAGE_BYTES) {
        toast.error(`${f.name} is over 5 MB`);
        continue;
      }
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = () => rej(r.error);
        r.readAsDataURL(f);
      });
      next.push(dataUrl);
    }
    setImages((curr) => [...curr, ...next].slice(0, MAX_IMAGES));
  };

  const removeImage = (i: number) => setImages((curr) => curr.filter((_, idx) => idx !== i));

  const submit = () => {
    const text = value.trim();
    if ((!text && images.length === 0) || disabled) return;
    setValue("");
    const imgs = images;
    setImages([]);
    onSend(text, imgs.length ? imgs : undefined);
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (streaming) return;
      submit();
    }
  };

  const toggleMic = () => {
    const W = window as any;
    const SR = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!SR) {
      toast.error("Voice input not supported in this browser (try Chrome).");
      return;
    }
    if (listening) {
      recogRef.current?.stop();
      return;
    }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-US";
    let finalText = "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t;
        else interim += t;
      }
      setValue((prev) =>
        (
          prev.replace(/\s*\[\.\.\.\].*$/, "").trimEnd() +
          (finalText ? " " + finalText : " [...]" + interim)
        ).trimStart(),
      );
    };
    rec.onend = () => {
      setListening(false);
      setValue((prev) => prev.replace(/\s*\[\.\.\.\].*$/, "").trim());
    };
    rec.onerror = (e: any) => {
      setListening(false);
      if (e.error !== "aborted" && e.error !== "no-speech") {
        toast.error(`Mic error: ${e.error}`);
      }
    };
    recogRef.current = rec;
    setListening(true);
    rec.start();
  };

  const canSend = (value.trim().length > 0 || images.length > 0) && !disabled;

  return (
    <div
      className="px-3 pb-4 pt-2 md:px-6"
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
      }}
    >
      <div className="mx-auto max-w-[760px] rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[var(--chat-bg)] px-3 py-2.5 float-shadow">
        {images.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {images.map((src, i) => (
              <div
                key={i}
                className="relative h-16 w-16 overflow-hidden rounded-md border border-border"
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
                  aria-label="Remove"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
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
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              title="Attach image"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Paperclip size={16} />
            </button>
            <button
              type="button"
              onClick={toggleMic}
              title={listening ? "Stop recording" : "Voice input"}
              className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                listening
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {listening ? <MicOff size={16} /> : <Mic size={16} />}
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
        Enter to send · Shift+Enter for newline · ⌘K to focus · Drag images to attach
      </p>
    </div>
  );
});
