import { Logo } from "./Logo";

export function TypingIndicator() {
  return (
    <div className="msg-enter flex gap-3 px-4 md:px-6 py-3">
      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center">
        <Logo size={22} />
      </div>
      <div className="flex h-6 items-center gap-1.5">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}
