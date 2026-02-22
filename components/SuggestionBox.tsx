"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const MAX_LENGTH = 100;

interface SuggestionBoxProps {
  isLoggedIn: boolean;
}

export default function SuggestionBox({ isLoggedIn }: SuggestionBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [issueUrl, setIssueUrl] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && status !== "sending") setIsOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, status]);

  if (!isLoggedIn) {
    return (
      <Link
        href="/auth/login?redirect=/"
        className="block w-full min-h-[36px] sm:min-h-[44px] lg:min-h-[56px] py-2 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-2xl px-4 sm:px-6 bg-[#e8e0f5] text-[#3d2d5c] font-semibold rounded-lg border border-[#c9b8e0] hover:bg-[#ddd2ed] transition-colors [touch-action:manipulation] flex items-center justify-center"
      >
        Suggest a Feature
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          setStatus("idle");
          setText("");
          setErrorMessage("");
        }}
        className="block w-full min-h-[36px] sm:min-h-[44px] lg:min-h-[56px] py-2 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-2xl px-4 sm:px-6 bg-[#e8e0f5] text-[#3d2d5c] font-semibold rounded-lg border border-[#c9b8e0] hover:bg-[#ddd2ed] transition-colors [touch-action:manipulation] flex items-center justify-center"
      >
        Suggest a Feature
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => {
            if (status !== "sending") setIsOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="suggestion-title"
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="suggestion-title" className="text-lg font-bold text-[#1a1a1b] mb-3">
              Suggest a Feature
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              Share your idea (max {MAX_LENGTH} characters). We&apos;ll create a GitHub issue.
            </p>

            {status === "success" ? (
              <div className="space-y-3">
                <p className="text-green-700 font-medium">Success! Your suggestion was submitted.</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 py-2 px-4 bg-[#6aaa64] text-white font-semibold rounded-lg hover:bg-[#5a9a54]"
                  >
                    Close
                  </button>
                  {issueUrl ? (
                    <a
                      href={issueUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-4 bg-[#85c0f9] text-white font-semibold rounded-lg hover:bg-[#75b0e9] text-center"
                    >
                      View issue
                    </a>
                  ) : null}
                </div>
              </div>
            ) : status === "error" ? (
              <div className="space-y-3">
                <p className="text-red-700 font-medium">{errorMessage || "Failed to submit. Please try again later."}</p>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="w-full py-2 px-4 bg-[#d3d6da] text-[#1a1a1b] font-semibold rounded-lg hover:bg-[#e8e9eb]"
                >
                  Try again
                </button>
              </div>
            ) : (
              <>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
                  placeholder="Your suggestion..."
                  maxLength={MAX_LENGTH}
                  rows={3}
                  disabled={status === "sending"}
                  className="w-full px-3 py-2 border border-[#d3d6da] rounded-lg focus:ring-2 focus:ring-[#6aaa64] focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mb-4">
                  {text.length}/{MAX_LENGTH}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    disabled={status === "sending"}
                    className="flex-1 py-2 px-4 bg-[#e8e9eb] text-[#1a1a1b] font-semibold rounded-lg hover:bg-[#d3d6da] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={status === "sending" || text.trim().length === 0}
                    onClick={async () => {
                      setStatus("sending");
                      setErrorMessage("");
                      try {
                        const res = await fetch("/api/suggestions", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ text: text.trim() }),
                          credentials: "include",
                        });
                        const json = await res.json();

                        if (json.success) {
                          setIssueUrl(json.issueUrl ?? "");
                          setStatus("success");
                        } else {
                          setErrorMessage(json.error || "Failed to submit.");
                          setStatus("error");
                        }
                      } catch {
                        setErrorMessage("Network error. Please try again.");
                        setStatus("error");
                      }
                    }}
                    className="flex-1 py-2 px-4 bg-[#6aaa64] text-white font-semibold rounded-lg hover:bg-[#5a9a54] disabled:opacity-50"
                  >
                    {status === "sending" ? "Sending..." : "Submit"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
