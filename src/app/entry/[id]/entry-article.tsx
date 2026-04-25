"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

type Props = {
  formattedContent: string | null;
  rawText: string | null;
};

export function EntryArticle({ formattedContent, rawText }: Props) {
  const hasFormatted = !!formattedContent;
  const hasRaw = !!rawText && rawText.trim().length > 0;
  const canToggle = hasFormatted && hasRaw;
  const [showRaw, setShowRaw] = useState(false);

  const display = showRaw ? rawText : formattedContent ?? rawText ?? "";
  const renderRaw = showRaw || !hasFormatted;

  return (
    <div>
      {canToggle && (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={() => setShowRaw((v) => !v)}
            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {showRaw ? "Show organized version" : "View original braindump"}
          </button>
        </div>
      )}

      {renderRaw ? (
        <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 font-mono text-sm leading-6">
          {display || (
            <span className="italic text-muted-foreground">No content.</span>
          )}
        </pre>
      ) : (
        <article
          className="
            max-w-none leading-7
            [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-semibold
            [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold
            [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-medium
            [&_p]:my-3
            [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6
            [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6
            [&_li]:my-1
            [&_a]:text-primary [&_a]:underline
            [&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground/40 [&_blockquote]:pl-4 [&_blockquote]:italic
            [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm
            [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3
          "
        >
          {display ? (
            <ReactMarkdown>{display}</ReactMarkdown>
          ) : (
            <p className="text-muted-foreground italic">No content.</p>
          )}
        </article>
      )}
    </div>
  );
}
