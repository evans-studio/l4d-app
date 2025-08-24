"use client"

import { useId } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function Component() {
  const id = useId()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Edit details</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit details</DialogTitle>
          <DialogDescription>
            Update basic information. This is a minimal dialog without file upload.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1 space-y-2">
              <Label htmlFor={`${id}-first-name`}>First name</Label>
              <Input id={`${id}-first-name`} placeholder="First name" type="text" />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor={`${id}-last-name`}>Last name</Label>
              <Input id={`${id}-last-name`} placeholder="Last name" type="text" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${id}-notes`}>Notes</Label>
            <Textarea id={`${id}-notes`} placeholder="Optional notes" rows={4} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button type="button">Save</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
