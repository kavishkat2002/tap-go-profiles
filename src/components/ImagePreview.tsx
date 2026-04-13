import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

interface ImagePreviewProps {
  src: string;
  alt?: string;
  children: React.ReactNode;
}

export default function ImagePreview({ src, alt, children }: ImagePreviewProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl p-0 overflow-hidden border-none bg-transparent shadow-none">
        <div className="relative w-full aspect-auto flex items-center justify-center">
          <img
            src={src}
            alt={alt || "Preview"}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
