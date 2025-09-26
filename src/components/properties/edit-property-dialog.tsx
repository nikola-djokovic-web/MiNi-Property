
"use client";

import { useState, useEffect } from "react";
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
import { Pencil, Upload, X } from "lucide-react";
import { Property } from "@/lib/data";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import Image from "next/image";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

export default function EditPropertyDialog({
  property,
  onUpdateProperty,
}: {
  property: Property;
  onUpdateProperty: (property: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(property.title);
  const [address, setAddress] = useState(property.address);
  const [price, setPrice] = useState(property.price.toString());
  const [beds, setBeds] = useState(property.beds.toString());
  const [baths, setBaths] = useState(property.baths.toString());
  const [sqft, setSqft] = useState(property.sqft.toString());
  const [type, setType] = useState(property.type);
  const [imagePreviews, setImagePreviews] = useState<string[]>([property.imageUrl]);


  useEffect(() => {
    if (open) {
      setTitle(property.title);
      setAddress(property.address);
      setPrice(property.price.toString());
      setBeds(property.beds.toString());
      setBaths(property.baths.toString());
      setSqft(property.sqft.toString());
      setType(property.type);
      // In a real app, you'd handle existing image URLs vs new file uploads
      setImagePreviews([property.imageUrl]);
    }
  }, [open, property]);

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
    const updatedProperty = {
      ...property,
      title,
      address,
      price: parseInt(price) || 0,
      beds: parseInt(beds) || 0,
      baths: parseInt(baths) || 0,
      sqft: parseInt(sqft) || 0,
      type,
      imageUrl: imagePreviews[0] || property.imageUrl,
    };
    onUpdateProperty(updatedProperty);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit Property</span>
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Edit Property</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Property</DialogTitle>
          <DialogDescription>
            Update the details for {property.title}.
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
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
