import { useState } from "react";
import { Edit, CheckSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface BulkEditDialogProps {
  selectedIds: string[];
  onBulkUpdate: (updates: { validation_status?: string; notes?: string }) => void;
  onClearSelection: () => void;
}

export const BulkEditDialog = ({
  selectedIds,
  onBulkUpdate,
  onClearSelection,
}: BulkEditDialogProps) => {
  const [open, setOpen] = useState(false);
  const [validationStatus, setValidationStatus] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [updateValidation, setUpdateValidation] = useState(false);
  const [updateNotes, setUpdateNotes] = useState(false);
  const { toast } = useToast();

  const handleApply = () => {
    if (!updateValidation && !updateNotes) {
      toast({
        title: "No changes selected",
        description: "Please select at least one field to update.",
        variant: "destructive",
      });
      return;
    }

    const updates: { validation_status?: string; notes?: string } = {};

    if (updateValidation && validationStatus) {
      updates.validation_status = validationStatus;
    }

    if (updateNotes && notes.trim()) {
      updates.notes = notes.trim();
    }

    onBulkUpdate(updates);
    
    toast({
      title: "Bulk update applied",
      description: `Updated ${selectedIds.length} extraction(s)`,
    });

    // Reset and close
    setValidationStatus("");
    setNotes("");
    setUpdateValidation(false);
    setUpdateNotes(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={selectedIds.length === 0}
          className="gap-2"
        >
          <Edit className="h-4 w-4" />
          Bulk Edit
          {selectedIds.length > 0 && (
            <Badge variant="secondary">{selectedIds.length}</Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Edit Extractions</DialogTitle>
          <DialogDescription>
            Update validation status or add notes to {selectedIds.length} selected extraction(s)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Validation Status Update */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="update-validation"
                checked={updateValidation}
                onChange={(e) => setUpdateValidation(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="update-validation" className="cursor-pointer font-medium">
                Update Validation Status
              </Label>
            </div>

            {updateValidation && (
              <RadioGroup
                value={validationStatus}
                onValueChange={setValidationStatus}
                className="ml-6 space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="validated" id="validated" />
                  <Label htmlFor="validated" className="cursor-pointer flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-green-600" />
                    Validated
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="questionable" id="questionable" />
                  <Label htmlFor="questionable" className="cursor-pointer flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-yellow-600" />
                    Questionable
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pending" id="pending" />
                  <Label htmlFor="pending" className="cursor-pointer flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-gray-600" />
                    Pending
                  </Label>
                </div>
              </RadioGroup>
            )}
          </div>

          {/* Notes Update */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="update-notes"
                checked={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="update-notes" className="cursor-pointer font-medium">
                Add Notes
              </Label>
            </div>

            {updateNotes && (
              <Textarea
                placeholder="Enter notes to add to all selected extractions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="ml-6"
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onClearSelection();
                setOpen(false);
              }}
            >
              Clear Selection
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleApply}>
                Apply to {selectedIds.length} item(s)
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
