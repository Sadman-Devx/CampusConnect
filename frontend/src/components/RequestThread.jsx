import { useState } from "react";
import { postRequestComment, uploadRequestAttachment } from "../api/serviceRequestsApi";

function formatDateTime(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/**
 * Shared attachment + comment thread, used on both the student's own
 * request card and the staff inbox card -- previously a request was a
 * dead end after submission: one subject/description in, one staff_note
 * out, no back-and-forth and no way to attach evidence.
 */
export default function RequestThread({ request: req, currentUsername, onUpdate }) {
  const [commentDraft, setCommentDraft] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [threadError, setThreadError] = useState("");

  const handlePostComment = async () => {
    const text = commentDraft.trim();
    if (!text) return;
    setIsPosting(true);
    setThreadError("");
    try {
      const comment = await postRequestComment(req.id, text);
      setCommentDraft("");
      onUpdate({ ...req, comments: [...req.comments, comment] });
    } catch {
      setThreadError("Couldn't send that reply. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setThreadError("");
    try {
      const attachment = await uploadRequestAttachment(req.id, file);
      onUpdate({ ...req, attachments: [...req.attachments, attachment] });
    } catch (err) {
      setThreadError(err.response?.data?.file?.[0] || "Couldn't upload that file.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      {req.attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {req.attachments.map((a) => (
            <a
              key={a.id}
              href={a.file_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-600 transition-colors hover:border-green-300 hover:bg-green-50 hover:text-green-700"
            >
              {"\u{1F4CE}"} {a.original_filename}
            </a>
          ))}
        </div>
      )}

      {req.comments.length > 0 && (
        <ul className="mb-2 space-y-1.5">
          {req.comments.map((c) => (
            <li
              key={c.id}
              className={
                c.author_username === currentUsername
                  ? "rounded-lg px-3 py-2 text-sm bg-green-50 text-green-900"
                  : "rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700"
              }
            >
              <p>
                <span className="font-medium">{c.author_username}</span>{" "}
                <span className="text-xs text-gray-400">{formatDateTime(c.created_at)}</span>
              </p>
              <p className="mt-0.5 whitespace-pre-wrap">{c.text}</p>
            </li>
          ))}
        </ul>
      )}

      {threadError && <p className="mb-1.5 text-xs text-red-600">{threadError}</p>}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={commentDraft}
          onChange={(e) => setCommentDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handlePostComment()}
          placeholder="Write a reply..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        <button
          type="button"
          disabled={isPosting || !commentDraft.trim()}
          onClick={handlePostComment}
          className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:bg-gray-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          Send
        </button>
        <label className="cursor-pointer whitespace-nowrap rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-all duration-200 hover:border-green-300 hover:bg-green-50 hover:text-green-700">
          {isUploading ? "Uploading..." : "Attach"}
          <input type="file" onChange={handleFileChange} disabled={isUploading} className="hidden" />
        </label>
      </div>
    </div>
  );
}