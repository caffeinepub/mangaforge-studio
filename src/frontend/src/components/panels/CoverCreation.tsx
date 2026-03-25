import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../../backend";
import {
  useCreateCoverReference,
  useUpdateChapter,
} from "../../hooks/useQueries";
import type { ChapterWithId } from "../../hooks/useQueries";

interface Props {
  chapter: ChapterWithId;
  bookId: bigint;
  onCoverCreated: () => void;
}

interface RefImage {
  file: File;
  preview: string;
  description: string;
  id: string;
}

export default function CoverCreation({
  chapter,
  bookId,
  onCoverCreated,
}: Props) {
  const [images, setImages] = useState<RefImage[]>([]);
  const [overallDescription, setOverallDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: createRef } = useCreateCoverReference();
  const { mutateAsync: updateChapter } = useUpdateChapter();

  const addFiles = (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter((f) =>
      f.type.startsWith("image/"),
    );
    const newImages = fileArr.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      description: "",
      id: `${file.name}-${Date.now()}-${Math.random()}`,
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const removeImage = (imgId: string) => {
    setImages((prev) => {
      const found = prev.find((i) => i.id === imgId);
      if (found) URL.revokeObjectURL(found.preview);
      return prev.filter((i) => i.id !== imgId);
    });
  };

  const updateDesc = (imgId: string, desc: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === imgId ? { ...img, description: desc } : img,
      ),
    );
  };

  const handleCreate = async () => {
    if (images.length === 0) {
      toast.error("Upload at least one reference image");
      return;
    }
    setIsUploading(true);
    try {
      for (const img of images) {
        const bytes = new Uint8Array(await img.file.arrayBuffer());
        const blob = ExternalBlob.fromBytes(bytes);
        await createRef({
          blobId: blob,
          description: img.description || overallDescription,
          bookId,
          chapterId: chapter.id,
        });
      }
      const now = BigInt(Date.now()) * BigInt(1000000);
      await updateChapter({
        id: chapter.id,
        chapter: { ...chapter, hasCover: true, updatedAt: now },
      });
      toast.success("Cover created! You can now add panels.");
      onCoverCreated();
    } catch {
      toast.error("Failed to create cover");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto py-8 px-4 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold mb-1">Create Chapter Cover</h2>
        <p className="text-sm text-muted-foreground">
          Upload reference images and describe your vision. These references
          will be used for AI consistency.
        </p>
      </div>

      {/* Drop Zone */}
      <button
        type="button"
        data-ocid="cover.dropzone"
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground"
        }`}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
        <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {isDragOver
            ? "Drop images here"
            : "Drag & drop reference images, or click to browse"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Upload multiple images for better AI consistency
        </p>
      </button>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {images.map((img, idx) => (
            <div
              key={img.id}
              className="bg-card rounded-lg border border-border overflow-hidden"
              data-ocid={`cover.item.${idx + 1}`}
            >
              <div className="relative">
                <img
                  src={img.preview}
                  alt="reference"
                  className="w-full h-32 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white hover:bg-black/80"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Describe this reference..."
                  value={img.description}
                  onChange={(e) => updateDesc(img.id, e.target.value)}
                  className="w-full text-xs bg-input border border-border rounded px-2 py-1 text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Overall Vision / Description</Label>
        <Textarea
          data-ocid="cover.textarea"
          placeholder="Describe the tone, style, and vision for this chapter's cover and overall aesthetic..."
          value={overallDescription}
          onChange={(e) => setOverallDescription(e.target.value)}
          className="bg-input border-border resize-none"
          rows={4}
        />
      </div>

      <Button
        onClick={handleCreate}
        disabled={isUploading || images.length === 0}
        data-ocid="cover.submit_button"
        className="w-full"
        style={{ background: "oklch(var(--blue-action))", color: "white" }}
      >
        {isUploading ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <ImageIcon className="w-4 h-4 mr-2" />
        )}
        {isUploading ? "Creating Cover..." : "Create Cover & Start Chapter"}
      </Button>
    </div>
  );
}
