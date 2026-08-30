"use client";

import React from "react";
import { CheckCircle2, ChevronRight, AlertCircle, Info, Sparkles } from "lucide-react";

interface FormattedMarkdownProps {
  content: string;
}

export const FormattedMarkdown: React.FC<FormattedMarkdownProps> = ({ content }) => {
  if (!content) return null;

  // Split content by lines
  const lines = content.split("\n");

  const elements: React.ReactNode[] = [];
  let currentBullets: string[] = [];
  let keyIndex = 0;

  const flushBullets = () => {
    if (currentBullets.length > 0) {
      elements.push(
        <div key={`bullets-${keyIndex++}`} className="space-y-1.5 my-2">
          {currentBullets.map((b, bIdx) => {
            // Check for format: "- **Key**: **Value** text" or "- **Key**: Value"
            const cleanText = b.replace(/^[-*•]\s*/, "");
            
            // Format bold tags: **text**
            const parts = cleanText.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

            return (
              <div key={bIdx} className="flex items-start space-x-2.5 text-xs text-[#334155] dark:text-[#D4D4D8]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0B72E7] mt-1.5 flex-shrink-0" />
                <div className="flex-1 leading-relaxed">
                  {parts.map((part, pIdx) => {
                    if (part.startsWith("**") && part.endsWith("**")) {
                      return (
                        <strong key={pIdx} className="font-semibold text-[#0F172A] dark:text-white">
                          {part.slice(2, -2)}
                        </strong>
                      );
                    }
                    if (part.startsWith("`") && part.endsWith("`")) {
                      return (
                        <code key={pIdx} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[#0B72E7] dark:text-[#3395FF] font-mono text-[11px]">
                          {part.slice(1, -1)}
                        </code>
                      );
                    }
                    return <span key={pIdx}>{part}</span>;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      );
      currentBullets = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      flushBullets();
      continue;
    }

    // Heading 3: ### Title
    if (line.startsWith("###")) {
      flushBullets();
      const headingText = line.replace(/^###\s*/, "").replace(/\*\*/g, "");
      elements.push(
        <div key={`h3-${keyIndex++}`} className="flex items-center space-x-2 pt-1 pb-1 text-xs font-bold text-[#0F172A] dark:text-white border-b border-[#E2E8F0] dark:border-[#262626] mb-2">
          <Sparkles className="w-3.5 h-3.5 text-[#0B72E7]" />
          <span>{headingText}</span>
        </div>
      );
      continue;
    }

    // Heading 2: ## Title
    if (line.startsWith("##")) {
      flushBullets();
      const headingText = line.replace(/^##\s*/, "").replace(/\*\*/g, "");
      elements.push(
        <div key={`h2-${keyIndex++}`} className="text-sm font-bold text-[#0F172A] dark:text-white pt-2 pb-1">
          {headingText}
        </div>
      );
      continue;
    }

    // Bullet List Item
    if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ")) {
      currentBullets.push(line);
      continue;
    }

    // Regular Paragraph
    flushBullets();
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
    elements.push(
      <p key={`p-${keyIndex++}`} className="text-xs text-[#334155] dark:text-[#D4D4D8] leading-relaxed my-1.5">
        {parts.map((part, pIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={pIdx} className="font-semibold text-[#0F172A] dark:text-white">
                {part.slice(2, -2)}
              </strong>
            );
          }
          if (part.startsWith("`") && part.endsWith("`")) {
            return (
              <code key={pIdx} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[#0B72E7] dark:text-[#3395FF] font-mono text-[11px]">
                {part.slice(1, -1)}
              </code>
            );
          }
          if (part.startsWith("*") && part.endsWith("*")) {
            return <em key={pIdx} className="italic text-[#64748B] dark:text-[#A1A1AA]">{part.slice(1, -1)}</em>;
          }
          return <span key={pIdx}>{part}</span>;
        })}
      </p>
    );
  }

  flushBullets();

  return <div className="space-y-1.5 font-sans leading-normal">{elements}</div>;
};
