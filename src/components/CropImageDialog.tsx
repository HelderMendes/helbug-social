import "cropperjs/dist/cropper.css";
import { useRef } from "react";
import Cropper from "react-cropper";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface CropImageDialogProps {
  src: string;
  cropAspectRatio: number;
  onCropped: (blob: Blob | null) => void;
  onClose: () => void;
}

export default function CropImageDialog({
  src,
  cropAspectRatio,
  onCropped,
  onClose,
}: CropImageDialogProps) {
  const cropperRef = useRef<any>(null);

  function crop() {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;
    cropper
      .getCroppedCanvas()
      .toBlob((blob: Blob | null) => onCropped(blob), "image/webp");
    onClose();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crop image</DialogTitle>
        </DialogHeader>
        <Cropper
          src={src}
          aspectRatio={cropAspectRatio}
          guides={false}
          zoomOnWheel={true}
          zoomable={true}
          ref={cropperRef as any}
          className="mx-auto size-fit"
        />
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={crop}>Crop</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
