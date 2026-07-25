import { useEffect, useRef, useState } from "react";
import {
  startChatRequest,
  sendMessageRequest,
} from "../api/chatbotApi";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");

  const scrollRef = useRef(null);

  // Notun message ashle automatically nichey scroll kore
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleStartChat = async () => {
    setIsStarting(true);
    setError("");
    try {
      const data = await startChatRequest();
      setSessionId(data.session_id);
      setMessages([{ sender: "bot", text: data.message }]);
    } catch {
      setError("Couldn't start the chat right now. Please try again.");
    } finally {
      setIsStarting(false);
    }
  };

  // Widget-e prothom-bar click korle (session na thakle) chat shuru kore, tarpor toggle kore
  const handleToggle = () => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);
    if (willOpen && !sessionId) {
      handleStartChat();
    }
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || isSending) return;

    setMessages((prev) => [...prev, { sender: "user", text }]);
    setDraft("");
    setIsSending(true);
    setError("");

    try {
      const data = await sendMessageRequest({ sessionId, text });
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: data.message,
          escalated: data.type === "escalated",
          ticketId: data.ticket_id,
          confidence: data.confidence,
        },
      ]);
    } catch {
      setError("Message couldn't be sent. Please try again.");
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Sorry, something went wrong on my end.", isError: true },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div
          className="mb-3 flex h-[28rem] w-80 flex-col overflow-hidden rounded-2xl border
            border-gray-200 bg-white shadow-2xl sm:w-96"
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-gray-900 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <p className="text-sm font-medium text-white">CampusConnect Assistant</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="text-gray-300 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-3 py-4">
            {isStarting && (
              <p className="text-center text-xs text-gray-400">Connecting…</p>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-snug ${
                    msg.sender === "user"
                      ? "rounded-br-sm bg-gray-900 text-white"
                      : msg.isError
                      ? "rounded-bl-sm bg-red-50 text-red-700 ring-1 ring-red-200"
                      : "rounded-bl-sm bg-white text-gray-800 ring-1 ring-gray-200"
                  }`}
                >
                  <p>{msg.text}</p>
                  {msg.escalated && (
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                      Ticket #{msg.ticketId} opened
                    </span>
                  )}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-white px-3.5 py-2.5 ring-1 ring-gray-200">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
                </div>
              </div>
            )}

            {error && <p className="text-center text-xs text-red-500">{error}</p>}
          </div>

          {/* Input */}
          <div className="flex items-end gap-2 border-t border-gray-200 bg-white p-2.5">
            <textarea
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question…"
              disabled={isStarting}
              className="max-h-24 flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2
                text-sm text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={isSending || isStarting || !draft.trim()}
              aria-label="Send message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                bg-gray-900 text-white transition hover:bg-gray-700
                disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.897 28.897 0 0015.293-7.155.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating toggle icon */}
      <button
        onClick={handleToggle}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-900
          text-white shadow-lg transition hover:bg-gray-700 hover:scale-105"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
            <path
              fillRule="evenodd"
              d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>
    </div>
  );
}