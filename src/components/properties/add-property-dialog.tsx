
"use client";

import { useState } from "react";
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
import { PlusCircle, Upload, X } from "lucide-react";
import Image from "next/image";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function AddPropertyDialog({
  onAddProperty,
}: {
  onAddProperty: (property: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState("");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [sqft, setSqft] = useState("");
  const [type, setType] = useState("");
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPreviews: string[] = [];
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };


  const handleSubmit = () => {
    // For simplicity, we'll use the first image as the main imageUrl
    // and store the rest in an array if your data structure supports it.
    // Here we'll just use the first for the existing `imageUrl` field.
    const newProperty = {
      title,
      address,
      price: parseInt(price) || 0,
      beds: parseInt(beds) || 0,
      baths: parseInt(baths) || 0,
      sqft: parseInt(sqft) || 0,
      type,
      // Using the first image as the primary, or a placeholder
      imageUrl: imagePreviews[0] || "https://picsum.photos/seed/new/600/400",
      imageUrls: imagePreviews, // Assuming the data structure can handle this
      imageHint: "newly added property"
    };
    onAddProperty(newProperty);
    setOpen(false);
    // Reset form
    setTitle("");
    setAddress("");
    setPrice("");
    setBeds("");
    setBaths("");
    setSqft("");
    setType("");
    setImagePreviews([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Property
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Property</DialogTitle>
          <DialogDescription>
            Enter the details of the new property. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-4">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                placeholder="e.g. Modern Downtown Apartment"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Address
              </Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="col-span-3"
                placeholder="e.g. 123 Main St, Anytown, USA"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Input
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="col-span-3"
                placeholder="e.g. Apartment, House"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price
              </Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="col-span-3"
                placeholder="e.g. 2200"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="beds" className="text-right">
                Beds
              </Label>
              <Input
                id="beds"
                type="number"
                value={beds}
                onChange={(e) => setBeds(e.target.value)}
                className="col-span-3"
                placeholder="e.g. 2"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="baths" className="text-right">
                Baths
              </Label>
              <Input
                id="baths"
                type="number"
                value={baths}
                onChange={(e) => setBaths(e.target.value)}
                className="col-span-3"
                placeholder="e.g. 2"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sqft" className="text-right">
                Sqft
              </Label>
              <Input
                id="sqft"
                type="number"
                value={sqft}
                onChange={(e) => setSqft(e.target.value)}
                className="col-span-3"
                placeholder="e.g. 1100"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
               <Label htmlFor="photo" className="text-right pt-2">
                  Photos
              </Label>
               <div className="col-span-3">
                   <Input id="photo" type="file" accept="image/*" onChange={handleImageChange} multiple className="hidden" />
                   <Button asChild variant="outline">
                       <Label htmlFor="photo" className="cursor-pointer">
                           <Upload className="mr-2 h-4 w-4" />
                           Choose Images
                       </Label>
                   </Button>
               </div>
             </div>
          </div>
          {imagePreviews.length > 0 && (
              <div className="space-y-4">
                  <ScrollArea>
                    <div className="flex space-x-4 pb-4">
                      {imagePreviews.map((src, index) => (
                          <div key={index} className="relative flex-shrink-0">
                              <Image src={src} alt={`Property preview ${index + 1}`} width={100} height={75} className="rounded-md object-cover h-[75px] w-[100px]"/>
                              <Button
                                  variant="destructive"
                                  size="icon"
                                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                  onClick={() => handleRemoveImage(index)}
                              >
                                  <X className="h-4 w-4" />
                              </Button>
                          </div>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
              </div>
          )}
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            Save Property
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
