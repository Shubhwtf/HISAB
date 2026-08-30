"use client";

import React, { useEffect, useRef, useState } from "react";
import { ZoomIn, X, Maximize2 } from "lucide-react";

interface MermaidViewerProps {
  chart: string;
  id?: string;
  title?: string;
}

export const MermaidViewer: React.FC<MermaidViewerProps> = ({ chart, id = "mermaid-chart", title = "Flowchart Diagram" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isZoomOpen, setIsZoomOpen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const renderChart = async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          themeVariables: {
            primaryColor: "#FFFFFF",
            primaryTextColor: "#0F172A",
            primaryBorderColor: "#94A3B8",
            lineColor: "#475569",
            secondaryColor: "#F8FAFC",
            secondaryTextColor: "#0F172A",
            secondaryBorderColor: "#CBD5E1",
            tertiaryColor: "#F1F5F9",
            tertiaryTextColor: "#0F172A",
            tertiaryBorderColor: "#CBD5E1",
            fontFamily: "Inter, -apple-system, sans-serif",
            fontSize: "15px",
            edgeLabelBackground: "#FFFFFF",
            clusterBkg: "#F8FAFC",
            clusterBorder: "#CBD5E1",
            nodeBorder: "#64748B",
            mainBkg: "#FFFFFF",
          },
          securityLevel: "loose",
        });

        const uniqueId = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(uniqueId, chart);
        if (isMounted) {
          setSvgContent(svg);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Mermaid rendering error:", err);
          setError("Diagram rendering error");
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-600">
        <pre className="overflow-x-auto whitespace-pre-wrap">{chart}</pre>
      </div>
    );
  }

  return (
    <>
      {/* 1. Main Diagram Card with Zoom Icon at Top-Left Corner */}
      <div className="relative p-6 pt-12 rounded-2xl bg-white dark:bg-[#111111] border border-[#E5E7EB] dark:border-[#262626] shadow-xs my-4 group select-none">
        {/* Top-Left Corner Zoom Button */}
        <button
          onClick={() => setIsZoomOpen(true)}
          title="Click to zoom into diagram"
          className="absolute top-3 left-3 p-1.5 rounded-lg bg-slate-100 dark:bg-[#1E1E1E] hover:bg-[#0B72E7] hover:text-white dark:hover:bg-[#0B72E7] text-[#6B7280] dark:text-[#A1A1AA] transition-colors border border-[#E5E7EB] dark:border-[#2E2E2E] flex items-center space-x-1 shadow-2xs z-10"
        >
          <ZoomIn className="w-3.5 h-3.5" />
          <span className="text-[11px] font-semibold">Zoom</span>
        </button>

        {/* Rendered SVG Content */}
        <div
          ref={containerRef}
          className="flex items-center justify-center overflow-x-auto [&_svg]:max-w-full [&_svg]:h-auto cursor-pointer"
          onClick={() => setIsZoomOpen(true)}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>

      {/* 2. Round-Bordered Zoom Dialogue Modal */}
      {isZoomOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none animate-in fade-in"
          onClick={() => setIsZoomOpen(false)}
        >
          <div 
            className="w-full max-w-5xl bg-white dark:bg-[#111111] border border-[#E5E7EB] dark:border-[#262626] rounded-3xl p-6 lg:p-8 shadow-2xl space-y-6 text-[#111827] dark:text-[#FFFFFF] max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#262626] pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0B72E7]">
                  <ZoomIn className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#000000] dark:text-white">
                    Diagram High-Resolution Zoom View
                  </h3>
                  <p className="text-xs text-[#6B7280] dark:text-[#A1A1AA] mt-0.5">
                    Magnified architecture flow and event states.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsZoomOpen(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-[#1A1A1A] hover:bg-slate-200 dark:hover:bg-[#262626] text-[#6B7280] hover:text-[#000000] dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Magnified Diagram Canvas */}
            <div 
              className="p-6 rounded-3xl bg-[#FAFAFA] dark:bg-[#0A0A0A] border border-[#E5E7EB] dark:border-[#262626] flex items-center justify-center overflow-x-auto [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:min-w-[500px]"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 text-xs">
              <span className="text-[#6B7280] dark:text-[#A1A1AA]">Press ESC or click close to dismiss</span>
              <button
                onClick={() => setIsZoomOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-[#111827] dark:bg-white text-white dark:text-black font-semibold transition-colors"
              >
                Close Zoom View
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
