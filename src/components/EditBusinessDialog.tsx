import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/lib/i18n";
import type { Business } from "@/lib/db";

interface EditBusinessDialogProps {
  business: Business;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (newDescription: string) => Promise<void>;
}

export function EditBusinessDialog({
  business,
  open,
  onOpenChange,
  onSave,
}: EditBusinessDialogProps) {
  const { t } = useLanguage();
  const [description, setDescription] = useState(business.description || "");
  const [saving, setSaving] = useState(false);

  const MAX_LENGTH = 500;
  const remainingChars = MAX_LENGTH - description.length;

  useEffect(() => {
    // Reset description when dialog opens with a new business
    setDescription(business.description || "");
  }, [business.description, open]);

  const handleSave = async () => {
    if (description.trim().length === 0) {
      return;
    }

    setSaving(true);
    try {
      await onSave(description.trim());
      onOpenChange(false);
    } catch (error) {
      // Error is handled by parent component
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDescription(business.description || "");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t.editDescription}</DialogTitle>
          <DialogDescription>
            Update the description for {business.name}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="description">{t.description}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.descriptionPlaceholder}
              rows={6}
              maxLength={MAX_LENGTH}
              className="resize-none"
            />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t.characterLimit}
              </span>
              <span className={remainingChars < 50 ? "text-orange-500" : "text-muted-foreground"}>
                {remainingChars} characters remaining
              </span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            {t.cancel}
          </Button>
          <Button onClick={handleSave} disabled={saving || description.trim().length === 0}>
            {saving ? t.saving : t.saveChanges}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
