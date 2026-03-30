import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Copy, Check } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QRCodeDialogProps {
  open: boolean;
  onClose: () => void;
  shortUrl: string;
  label?: string;
}

// ─── QR Code Dialog ───────────────────────────────────────────────────────────

export function QRCodeDialog({ open, onClose, shortUrl, label }: QRCodeDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${label ?? "link"}.png`;
    a.click();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>QR Code</DialogTitle>
          <DialogDescription className="truncate text-xs font-mono">
            {shortUrl}
          </DialogDescription>
        </DialogHeader>

        {/* QR canvas — centered, padded */}
        <div className="flex items-center justify-center rounded-xl border border-border bg-white p-4">
          <QRCodeCanvas
            ref={canvasRef}
            value={shortUrl}
            size={192}
            level="M"
            marginSize={1}
          />
        </div>

        <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-success" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copied ? "Copied!" : "Copy URL"}
          </Button>
          <Button
            size="sm"
            className="flex-1 gap-1.5"
            onClick={handleDownload}
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
