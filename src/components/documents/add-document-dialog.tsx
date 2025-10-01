
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Upload, File, X } from "lucide-react";

export default function AddDocumentDialog({
  onAddDocument,
}: {
  onAddDocument: (document: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };
  
  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }


  const handleSubmit = () => {
    if (!file || !type) {
      // Add some validation feedback if you want
      return;
    }
    
    onAddDocument({ type, file });
    
    // Reset form and close dialog
    setOpen(false);
    setType("");
    setFile(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload New Document</DialogTitle>
          <DialogDescription>
            Select a file and specify its type.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Document Type
            </Label>
            <Input
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="col-span-3"
              placeholder="e.g. Lease, Invoice, Notice"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file-upload" className="text-right">
              File
            </Label>
             <div className="col-span-3">
                <Input id="file-upload" type="file" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
                {!file ? (
                    <Button asChild variant="outline">
                        <Label htmlFor="file-upload" className="cursor-pointer w-full">
                            <Upload className="mr-2 h-4 w-4" />
                            Choose File
                        </Label>
                    </Button>
                ) : (
                    <div className="flex items-center justify-between rounded-md border border-input p-2 text-sm">
                        <div className="flex items-center gap-2 truncate">
                             <File className="h-4 w-4 flex-shrink-0" />
                             <span className="truncate">{file.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearFile}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
             </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={!file || !type}>
            Upload Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
