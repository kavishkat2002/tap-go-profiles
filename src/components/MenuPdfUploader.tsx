import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { FileUp, Loader2, Sparkles, X, AlertCircle, CheckCircle2, ScanText } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

export type ExtractedItem = {
  id: string;
  name: string;
  description: string;
  price: string;
};

export type ExtractedCategory = {
  id: string;
  name: string;
  items: ExtractedItem[];
};

interface MenuPdfUploaderProps {
  onExtracted: (categories: ExtractedCategory[]) => void;
}

// ─── heuristic text parser (shared for PDF and OCR output) ───────────────────

function parseMenuText(rawText: string): ExtractedCategory[] {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const categories: ExtractedCategory[] = [];
  let currentCategory: ExtractedCategory | null = null;
  let pendingItem: ExtractedItem | null = null;

  const pricePattern = /(?:[$€£]|Rs\.?|LKR)?\s*(\d+(?:[.,]\d{1,2})?)\s*$/i;
  const isCategoryHeader = (line: string) =>
    /^[A-Z\s&'''-]{3,}$/.test(line) ||
    line.endsWith(":") ||
    (line.length < 40 && !pricePattern.test(line) && /^[A-Z]/.test(line) && line === line.toUpperCase());

  const flushItem = () => {
    if (pendingItem && currentCategory) {
      currentCategory.items.push(pendingItem);
      pendingItem = null;
    }
  };

  for (const line of lines) {
    if (/^(page|www\.|http|tel:|©|---|\d+\s*$)/i.test(line)) continue;
    const priceMatch = line.match(pricePattern);

    if (isCategoryHeader(line) && !priceMatch) {
      flushItem();
      currentCategory = { id: crypto.randomUUID(), name: line.replace(/:$/, "").trim(), items: [] };
      categories.push(currentCategory);
    } else if (currentCategory) {
      if (priceMatch) {
        const price = priceMatch[1];
        const name = line.replace(pricePattern, "").trim();
        flushItem();
        pendingItem = { id: crypto.randomUUID(), name, description: "", price };
      } else if (pendingItem) {
        pendingItem.description += (pendingItem.description ? " " : "") + line;
      } else {
        flushItem();
        pendingItem = { id: crypto.randomUUID(), name: line, description: "", price: "" };
      }
    }
  }

  flushItem();

  if (categories.length === 0 && lines.length > 0) {
    categories.push({
      id: crypto.randomUUID(),
      name: "Menu Items",
      items: lines.slice(0, 30).map((line) => ({
        id: crypto.randomUUID(),
        name: line,
        description: "",
        price: "",
      })),
    });
  }

  return categories.filter((c) => c.name.length > 0);
}

// ─── Tesseract OCR via UMD script tag (most reliable for browser) ────────────

function loadTesseractScript(): Promise<any> {
  return new Promise((resolve, reject) => {
    const win = window as any;
    if (win.Tesseract?.createWorker) return resolve(win.Tesseract);

    const existing = document.getElementById("tesseract-cdn");
    if (existing) {
      // Already injected — wait for it
      existing.addEventListener("load", () => resolve(win.Tesseract));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.id = "tesseract-cdn";
    script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    script.async = true;
    script.onload = () => resolve(win.Tesseract);
    script.onerror = () => reject(new Error("Failed to load Tesseract.js from CDN"));
    document.head.appendChild(script);
  });
}

async function ocrImage(
  imageFile: File,
  onProgress: (pct: number) => void
): Promise<string> {
  const Tesseract = await loadTesseractScript();

  const worker = await Tesseract.createWorker("eng", 1, {
    logger: (m: any) => {
      if (m.status === "recognizing text") {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  const { data } = await worker.recognize(imageFile);
  await worker.terminate();
  return data.text ?? "";
}

// ─── component ───────────────────────────────────────────────────────────────

type Status = "idle" | "reading" | "ocr" | "parsing" | "done" | "error";

const ACCEPTED = "application/pdf,image/jpeg,image/jpg,image/webp";

export default function MenuPdfUploader({ onExtracted }: MenuPdfUploaderProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [ocrPct, setOcrPct] = useState(0);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [resultSummary, setResultSummary] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const processFile = useCallback(
    async (file: File) => {
      const isPdf = file.type === "application/pdf";
      const isImage = ["image/jpeg", "image/jpg", "image/webp"].includes(file.type);

      if (!isPdf && !isImage) {
        setErrorMsg("Please upload a PDF, JPG, or WebP file.");
        setStatus("error");
        return;
      }

      setFileName(file.name);
      setStatus("reading");
      setErrorMsg("");
      setOcrPct(0);

      try {
        let fullText = "";

        if (isPdf) {
          // ── PDF: extract text layer ──
          const arrayBuffer = await file.arrayBuffer();
          setStatus("parsing");
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const sorted = [...content.items].sort((a: any, b: any) => {
              const yDiff = b.transform[5] - a.transform[5];
              return Math.abs(yDiff) > 5 ? yDiff : a.transform[4] - b.transform[4];
            });
            fullText += sorted.map((item: any) => item.str).join("\n") + "\n";
          }
        } else {
          // ── Image: show preview + OCR ──
          const url = URL.createObjectURL(file);
          setImagePreviewUrl(url);
          setStatus("ocr");

          fullText = await ocrImage(file, (pct) => setOcrPct(pct));
          setStatus("parsing");
        }

        const categories = parseMenuText(fullText);
        const totalItems = categories.reduce((s, c) => s + c.items.length, 0);
        setResultSummary(`Found ${categories.length} categories and ${totalItems} items`);
        setStatus("done");
        onExtracted(categories);
      } catch (err: any) {
        setErrorMsg(err?.message || "Failed to process file.");
        setStatus("error");
      }
    },
    [onExtracted]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const reset = () => {
    setStatus("idle");
    setFileName(null);
    setErrorMsg("");
    setResultSummary("");
    setOcrPct(0);
    if (imagePreviewUrl) { URL.revokeObjectURL(imagePreviewUrl); setImagePreviewUrl(null); }
    if (inputRef.current) inputRef.current.value = "";
  };

  const isLoading = ["reading", "ocr", "parsing"].includes(status);

  const getStatusLabel = () => {
    if (status === "reading") return "Reading file…";
    if (status === "ocr") return `Scanning image with OCR… ${ocrPct}%`;
    if (status === "parsing") return "Extracting menu items…";
    return "";
  };

  return (
    <div className="mb-4 space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isLoading && inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-all cursor-pointer select-none overflow-hidden p-6
          ${dragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : status === "done"
            ? "border-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/20"
            : status === "error"
            ? "border-destructive bg-destructive/5"
            : "border-muted-foreground/30 bg-muted/20 hover:border-primary/60 hover:bg-primary/5"
          }
        `}
      >
        {/* ── Image preview strip (shown after OCR done) ── */}
        {imagePreviewUrl && status === "done" && (
          <div className="w-full rounded-lg overflow-hidden max-h-36 mb-1">
            <img src={imagePreviewUrl} alt="Menu" className="w-full object-contain max-h-36 rounded-lg" />
          </div>
        )}

        {/* ── Icon badge ── */}
        <div className={`
          flex h-12 w-12 items-center justify-center rounded-full shadow-inner transition-colors
          ${status === "done" ? "bg-emerald-100 dark:bg-emerald-900" : status === "error" ? "bg-destructive/10" : "bg-primary/10"}
        `}>
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : status === "done" ? (
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          ) : status === "error" ? (
            <AlertCircle className="h-6 w-6 text-destructive" />
          ) : (
            <FileUp className="h-6 w-6 text-primary" />
          )}
        </div>

        {/* ── OCR progress bar ── */}
        {status === "ocr" && (
          <div className="w-full max-w-xs">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Scanning image…</span>
              <span>{ocrPct}%</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${ocrPct}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Status text ── */}
        {status === "idle" && (
          <>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Upload Menu PDF or Image</p>
              <p className="text-xs text-muted-foreground mt-0.5">Drag & drop or click — PDF, JPG, WebP</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium text-primary">PDF: auto-extract items</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 px-3 py-1">
                <ScanText className="h-3 w-3 text-orange-500" />
                <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Image: OCR scan & extract</span>
              </div>
            </div>
          </>
        )}

        {(status === "reading" || status === "parsing") && (
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">{getStatusLabel()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{fileName}</p>
          </div>
        )}

        {status === "done" && (
          <div className="text-center">
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Menu extracted successfully!</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {resultSummary} ·{" "}
              <span className="underline cursor-pointer" onClick={(e) => { e.stopPropagation(); reset(); }}>
                Upload another
              </span>
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <p className="text-sm font-semibold text-destructive">Failed to process file</p>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">{errorMsg}</p>
            <Button type="button" variant="link" size="sm" className="h-6 p-0 text-xs mt-1"
              onClick={(e) => { e.stopPropagation(); reset(); }}>
              Try again
            </Button>
          </div>
        )}

        {/* ── Reset X ── */}
        {(status === "done" || status === "error") && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); reset(); }}
            className="absolute right-3 top-3 rounded-full bg-black/25 p-1 text-white hover:bg-black/50 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={handleChange}
        />
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed px-1">
        <strong>PDF</strong>: text layer is extracted instantly. &nbsp;
        <strong>JPG / WebP</strong>: OCR scans the image and extracts menu items automatically.
        Everything runs in your browser — nothing is uploaded to a server.
      </p>
    </div>
  );
}
