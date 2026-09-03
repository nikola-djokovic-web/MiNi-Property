
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Upload, X } from "lucide-react";
import Image from "next/image";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useTranslation } from "@/hooks/use-translation";

// Keep in sync with the server-side schema in src/app/api/properties/route.ts
const PROPERTY_TYPES = ["Apartment", "House", "Condo", "Townhouse", "Commercial"] as const;

const addPropertySchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  address: z.string().trim().min(1, "Address is required"),
  city: z.string().trim().optional(),
  type: z.enum(PROPERTY_TYPES),
});

type AddPropertyForm = z.infer<typeof addPropertySchema>;

export default function AddPropertyDialog({
  onAddProperty,
}: {
  onAddProperty: (property: any) => void | Promise<void>;
}) {
  const { dict } = useTranslation();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const form = useForm<AddPropertyForm>({
    resolver: zodResolver(addPropertySchema),
    defaultValues: { title: "", address: "", city: "", type: "Apartment" },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
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

  const handleSubmit = async (values: AddPropertyForm) => {
    setSubmitting(true);
    try {
      await onAddProperty({
        ...values,
        imageUrl: imagePreviews[0] || "",
        imageHint: "newly added property",
      });
      setOpen(false);
      form.reset();
      setImagePreviews([]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          form.reset();
          setImagePreviews([]);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          {dict?.properties?.addProperty || "Add Property"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dict?.properties?.newProperty || "Add New Property"}</DialogTitle>
          <DialogDescription>
            {dict?.properties?.newPropertyDescription || "Enter the details of the new property. Click save when you're done."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="max-h-[70vh] overflow-y-auto pr-4">
              <div className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                      <FormLabel className="text-right">{dict?.properties?.titleLabel || "Title"}</FormLabel>
                      <div className="col-span-3">
                        <FormControl>
                          <Input placeholder="e.g. Modern Downtown Apartment" {...field} />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                      <FormLabel className="text-right">{dict?.common?.address || "Address"}</FormLabel>
                      <div className="col-span-3">
                        <FormControl>
                          <Input placeholder="e.g. 123 Main St, Anytown, USA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                      <FormLabel className="text-right">{dict?.common?.city || "City"}</FormLabel>
                      <div className="col-span-3">
                        <FormControl>
                          <Input placeholder="e.g. Berlin" {...field} />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                      <FormLabel className="text-right">{dict?.common?.type || "Type"}</FormLabel>
                      <div className="col-span-3">
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PROPERTY_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-4 items-start gap-4">
                  <FormLabel className="text-right pt-2">{dict?.properties?.photos || "Photos"}</FormLabel>
                  <div className="col-span-3">
                    <Input id="photo" type="file" accept="image/*" onChange={handleImageChange} multiple className="hidden" />
                    <Button asChild variant="outline">
                      <label htmlFor="photo" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" />
                        {dict?.properties?.chooseImages || "Choose Images"}
                      </label>
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
                          <Image src={src} alt={`Property preview ${index + 1}`} width={100} height={75} className="rounded-md object-cover h-[75px] w-[100px]" />
                          <Button
                            type="button"
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
              <Button type="submit" disabled={submitting}>
                {submitting ? (dict?.common?.saving || "Saving...") : (dict?.properties?.saveProperty || "Save Property")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
