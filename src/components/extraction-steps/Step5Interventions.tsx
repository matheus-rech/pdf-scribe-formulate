import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";

interface Indication {
  id: string;
  text: string;
}

interface Intervention {
  id: string;
  type: string;
  details: string;
}

interface Step5InterventionsProps {
  indications: Indication[];
  interventions: Intervention[];
  addIndication: () => void;
  updateIndication: (id: string, value: string) => void;
  removeIndication: (id: string) => void;
  addIntervention: () => void;
  updateIntervention: (id: string, field: string, value: string) => void;
  removeIntervention: (id: string) => void;
  disabled?: boolean;
}

export const Step5Interventions = ({
  indications,
  interventions,
  addIndication,
  updateIndication,
  removeIndication,
  addIntervention,
  updateIntervention,
  removeIntervention,
  disabled = false
}: Step5InterventionsProps) => {
  return (
    <>
      <h3 className="font-semibold text-base">Surgical Indications</h3>
      <div className="space-y-3">
        {indications.map((indication) => (
          <div key={indication.id} className="flex gap-2">
            <Input
              value={indication.text}
              onChange={(e) => updateIndication(indication.id, e.target.value)}
              placeholder="Enter surgical indication..."
              className="flex-1"
              disabled={disabled}
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => removeIndication(indication.id)}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addIndication}
          className="w-full"
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Indication
        </Button>
      </div>

      <h3 className="font-semibold text-base mt-6">Interventions</h3>
      <div className="space-y-3">
        {interventions.map((intervention) => (
          <Card key={intervention.id} className="p-3">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={intervention.type}
                  onChange={(e) => updateIntervention(intervention.id, "type", e.target.value)}
                  placeholder="Intervention type..."
                  className="flex-1"
                  disabled={disabled}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeIntervention(intervention.id)}
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                value={intervention.details}
                onChange={(e) => updateIntervention(intervention.id, "details", e.target.value)}
                placeholder="Details..."
                rows={2}
                disabled={disabled}
              />
            </div>
          </Card>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addIntervention}
          className="w-full"
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Intervention Type
        </Button>
      </div>
    </>
  );
};
