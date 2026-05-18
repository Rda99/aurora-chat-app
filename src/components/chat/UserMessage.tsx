import type { Message } from "@/lib/chat/types";

export function UserMessage({ message }: { message: Message }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="msg-enter group flex justify-end px-4 md:px-6 py-3">
      <div className="flex max-w-[85%] md:max-w-[70%] flex-col items-end">
        <div
          className="whitespace-pre-wrap break-words bg-[var(--bubble)] px-4 py-3 text-[15px]"
          style={{ borderRadius: "18px 18px 4px 18px" }}
        >
          {message.content}
        </div>
        <span className="mt-1 text-[11px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          {time}
        </span>
      </div>
    </div>
  );
}
