
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil } from "lucide-react";
import { Property, workers as allWorkers } from "@/lib/data";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { MultiSelect } from "../ui/multi-select";

type Worker = (typeof allWorkers)[0];

export default function EditWorkerDialog({
  worker,
  properties,
  onUpdateWorker,
}: {
  worker: Worker;
  properties: Property[];
  onUpdateWorker: (worker: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(worker.name);
  const [email, setEmail] = useState(worker.email);
  const [phone, setPhone] = useState(worker.phone);
  const [status, setStatus] = useState(worker.status);
  const [assignedPropertyIds, setAssignedPropertyIds] = useState(worker.assignedPropertyIds || []);

  useEffect(() => {
    if (open) {
      setName(worker.name);
      setEmail(worker.email);
      setPhone(worker.phone);
      setStatus(worker.status);
      setAssignedPropertyIds(worker.assignedPropertyIds || []);
    }
  }, [open, worker]);

  const handleSubmit = () => {
    const updatedWorker = {
      ...worker,
      name,
      email,
      phone,
      status,
      assignedPropertyIds,
    };
    onUpdateWorker(updatedWorker);
    setOpen(false);
  };
  
  const propertyOptions = properties.map(p => ({ value: p.id, label: p.title}));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit Worker</span>
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Edit Worker</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Worker</DialogTitle>
          <DialogDescription>
            Update the details for {worker.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
             <Label htmlFor="properties" className="text-right pt-2">
              Properties
            </Label>
            <div className="col-span-3">
                 <MultiSelect 
                    options={propertyOptions}
                    selected={assignedPropertyIds}
                    onChange={setAssignedPropertyIds}
                    className="w-full"
                />
            </div>
          </div>
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
