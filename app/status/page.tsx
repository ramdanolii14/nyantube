"use client";

import Script from "next/script";
import { useEffect } from "react";

export default function StatusPage() {
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).iFrameResize) {
      (window as any).iFrameResize([{ log: false }], ".htframe");
    }
  }, []);

  return (
    <div className="bg-white min-h-screen p-5">
      {/* Load script resmi dari Hetrix */}
      <Script
        src="https://static.hetrix.io/iframeResizer/iframeResizer.min.js"
        strategy="afterInteractive"
      />
      
      {/* Iframe Hetrix */}
      <iframe
        className="htframe"
        src="https://wl.hetrixtools.com/report/uptime/517d4466a9f65703fc2dbb649c10d7e5/"
        width="100%"
        scrolling="no"
        style={{ border: "none" }}
        sandbox="allow-scripts allow-same-origin allow-popups"
        onLoad={() => {
          if (typeof window !== "undefined" && (window as any).iFrameResize) {
            (window as any).iFrameResize([{ log: false }], ".htframe");
          }
        }}
      ></iframe>
    </div>
  );
}
