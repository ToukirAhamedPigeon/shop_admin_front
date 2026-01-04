import React, { useMemo, useState } from "react";

interface ExpandableTextProps {
  text?: string | null;
  wordLimit?: number;
  className?: string;
  emptyText?: string;
}

export const ExpandableText: React.FC<ExpandableTextProps> = ({
  text,
  wordLimit = 30,
  className = "",
  emptyText = "-",
}) => {
  const [expanded, setExpanded] = useState(false);

  // ✅ normalize text
  const safeText = typeof text === "string" ? text : "";

  const words = useMemo(() => {
    if (!safeText) return [];
    return safeText.split(/\s+/);
  }, [safeText]);

  const isTruncated = words.length > wordLimit;

  const displayText = expanded
    ? safeText
    : words.slice(0, wordLimit).join(" ");

  if (!safeText) {
    return <span className="text-gray-400 text-sm">{emptyText}</span>;
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <pre className="whitespace-pre-wrap text-sm leading-relaxed">
        {displayText}
        {!expanded && isTruncated && " ..."}
      </pre>

      {isTruncated && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-blue-400 hover:text-blue-300 text-xs font-medium dark:text-blue-300 dark:hover:text-blue-200 cursor-pointer"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
};
