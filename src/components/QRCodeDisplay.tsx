import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useCallback, useRef } from "react";

interface Props {
  url: string;
  size?: number;
}

export default function QRCodeDisplay({ url, size = 200 }: Props) {
  const svgRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current.querySelector("svg");
    if (!svg) return;
    const canvas = document.createElement("canvas");
    canvas.width = size * 2;
    canvas.height = size * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const a = document.createElement("a");
      a.download = "smarttap-qr.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(data);
  }, [size]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={svgRef} className="p-4 bg-card rounded-xl card-elevated">
        <QRCodeSVG value={url} size={size} level="H" />
      </div>
      <Button variant="outline" size="sm" onClick={handleDownload}>
        <Download className="h-4 w-4 mr-2" />
        Download QR
      </Button>
    </div>
  );
}
