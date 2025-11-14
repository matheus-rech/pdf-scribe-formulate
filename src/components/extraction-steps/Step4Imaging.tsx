import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Step4Props {
  formData: Record<string, string>;
  onUpdate: (updates: Record<string, string>) => void;
  onFieldFocus: (field: string | null) => void;
  disabled?: boolean;
}

export const Step4Imaging = ({ formData, onUpdate, onFieldFocus, disabled }: Step4Props) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Step 4: Imaging</h2>

      {/* Vascular Territory */}
      <div className="space-y-2">
        <Label htmlFor="vascularTerritory">Vascular Territory</Label>
        <Input
          id="vascularTerritory"
          value={formData.vascularTerritory || ''}
          onChange={(e) => onUpdate({ vascularTerritory: e.target.value })}
          onFocus={() => onFieldFocus('vascularTerritory')}
          onBlur={() => onFieldFocus(null)}
          disabled={disabled}
        />
      </div>

      {/* Volumes */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="infarctVolume">Infarct Volume</Label>
          <Input
            id="infarctVolume"
            type="number"
            step="0.1"
            value={formData.infarctVolume || ''}
            onChange={(e) => onUpdate({ infarctVolume: e.target.value })}
            onFocus={() => onFieldFocus('infarctVolume')}
            onBlur={() => onFieldFocus(null)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="strokeVolumeCerebellum">Stroke Volume (Cerebellum)</Label>
          <Input
            id="strokeVolumeCerebellum"
            value={formData.strokeVolumeCerebellum || ''}
            onChange={(e) => onUpdate({ strokeVolumeCerebellum: e.target.value })}
            onFocus={() => onFieldFocus('strokeVolumeCerebellum')}
            onBlur={() => onFieldFocus(null)}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Edema Dynamics */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Edema Dynamics</h3>
        <div className="space-y-2">
          <Label htmlFor="edemaDynamics">Edema Description</Label>
          <Textarea
            id="edemaDynamics"
            value={formData.edemaDynamics || ''}
            onChange={(e) => onUpdate({ edemaDynamics: e.target.value })}
            onFocus={() => onFieldFocus('edemaDynamics')}
            onBlur={() => onFieldFocus(null)}
            rows={3}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="peakSwellingWindow">Peak Swelling Window</Label>
          <Input
            id="peakSwellingWindow"
            value={formData.peakSwellingWindow || ''}
            onChange={(e) => onUpdate({ peakSwellingWindow: e.target.value })}
            onFocus={() => onFieldFocus('peakSwellingWindow')}
            onBlur={() => onFieldFocus(null)}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Involvement Areas */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Involvement Areas</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="brainstemInvolvement">Brainstem Involvement?</Label>
            <Select
              value={formData.brainstemInvolvement || 'null'}
              onValueChange={(value) => onUpdate({ brainstemInvolvement: value })}
              disabled={disabled}
            >
              <SelectTrigger id="brainstemInvolvement">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">Unknown</SelectItem>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="supratentorialInvolvement">Supratentorial?</Label>
            <Select
              value={formData.supratentorialInvolvement || 'null'}
              onValueChange={(value) => onUpdate({ supratentorialInvolvement: value })}
              disabled={disabled}
            >
              <SelectTrigger id="supratentorialInvolvement">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">Unknown</SelectItem>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nonCerebellarStroke">Non-cerebellar?</Label>
            <Select
              value={formData.nonCerebellarStroke || 'null'}
              onValueChange={(value) => onUpdate({ nonCerebellarStroke: value })}
              disabled={disabled}
            >
              <SelectTrigger id="nonCerebellarStroke">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">Unknown</SelectItem>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};
