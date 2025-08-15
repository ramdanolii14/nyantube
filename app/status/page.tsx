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
    <div>
      <Script
        src="https://static.hetrix.io/iframeResizer/iframeResizer.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          if ((window as any).iFrameResize) {
            (window as any).iFrameResize([{ log: false }], ".htframe");
          }
        }}
      />

      <iframe
        className="htframe"
        src="https://wl.hetrixtools.com/r/e33f3d15f1d8738ee74760c132ea972e/"
        width="100%"
        scrolling="no"
        style={{ border: "none" }}
        sandbox="allow-scripts allow-same-origin allow-popups"
      ></iframe>
    </div>
  );
}
