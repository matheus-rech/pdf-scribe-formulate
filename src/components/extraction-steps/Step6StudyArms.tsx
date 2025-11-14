import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";

interface StudyArm {
  id: string;
  name: string;
  description: string;
  n: string;
}

interface Step6StudyArmsProps {
  studyArms: StudyArm[];
  addArm: () => void;
  updateArm: (id: string, field: string, value: string) => void;
  removeArm: (id: string) => void;
  disabled?: boolean;
}

export const Step6StudyArms = ({
  studyArms,
  addArm,
  updateArm,
  removeArm,
  disabled = false
}: Step6StudyArmsProps) => {
  return (
    <>
      <p className="text-sm text-muted-foreground">
        Define the distinct groups for comparison.
      </p>
      <div className="space-y-3">
        {studyArms.map((arm) => (
          <Card key={arm.id} className="p-4">
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={arm.name}
                    onChange={(e) => updateArm(arm.id, "name", e.target.value)}
                    placeholder="e.g., Surgical, Control..."
                    disabled={disabled}
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="mt-6"
                  onClick={() => removeArm(arm.id)}
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={arm.description}
                  onChange={(e) => updateArm(arm.id, "description", e.target.value)}
                  placeholder="Describe the intervention or condition..."
                  rows={2}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label>N (Sample Size)</Label>
                <Input
                  type="number"
                  value={arm.n}
                  onChange={(e) => updateArm(arm.id, "n", e.target.value)}
                  placeholder="Number of participants"
                  disabled={disabled}
                />
              </div>
            </div>
          </Card>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addArm}
          className="w-full"
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Study Arm
        </Button>
      </div>
    </>
  );
};
