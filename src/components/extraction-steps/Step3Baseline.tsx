import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Step3Props {
  formData: Record<string, string>;
  onUpdate: (updates: Record<string, string>) => void;
  onFieldFocus: (field: string | null) => void;
  disabled?: boolean;
}

export const Step3Baseline = ({ formData, onUpdate, onFieldFocus, disabled }: Step3Props) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Step 3: Baseline</h2>

      {/* Sample Size */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Sample Size</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="totalN">Total N (Required)</Label>
            <Input
              id="totalN"
              type="number"
              value={formData.totalN || ''}
              onChange={(e) => onUpdate({ totalN: e.target.value })}
              onFocus={() => onFieldFocus('totalN')}
              onBlur={() => onFieldFocus(null)}
              required
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="surgicalN">Surgical N</Label>
            <Input
              id="surgicalN"
              type="number"
              value={formData.surgicalN || ''}
              onChange={(e) => onUpdate({ surgicalN: e.target.value })}
              onFocus={() => onFieldFocus('surgicalN')}
              onBlur={() => onFieldFocus(null)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="controlN">Control N</Label>
            <Input
              id="controlN"
              type="number"
              value={formData.controlN || ''}
              onChange={(e) => onUpdate({ controlN: e.target.value })}
              onFocus={() => onFieldFocus('controlN')}
              onBlur={() => onFieldFocus(null)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Age Demographics */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Age Demographics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ageMean">Age Mean</Label>
            <Input
              id="ageMean"
              type="number"
              step="0.1"
              value={formData.ageMean || ''}
              onChange={(e) => onUpdate({ ageMean: e.target.value })}
              onFocus={() => onFieldFocus('ageMean')}
              onBlur={() => onFieldFocus(null)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ageSD">Age SD</Label>
            <Input
              id="ageSD"
              type="number"
              step="0.1"
              value={formData.ageSD || ''}
              onChange={(e) => onUpdate({ ageSD: e.target.value })}
              onFocus={() => onFieldFocus('ageSD')}
              onBlur={() => onFieldFocus(null)}
              disabled={disabled}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ageMedian">Age Median</Label>
            <Input
              id="ageMedian"
              type="number"
              step="0.1"
              value={formData.ageMedian || ''}
              onChange={(e) => onUpdate({ ageMedian: e.target.value })}
              onFocus={() => onFieldFocus('ageMedian')}
              onBlur={() => onFieldFocus(null)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ageIQR_lower">Age IQR (Lower/Q1)</Label>
            <Input
              id="ageIQR_lower"
              type="number"
              step="0.1"
              value={formData.ageIQR_lower || ''}
              onChange={(e) => onUpdate({ ageIQR_lower: e.target.value })}
              onFocus={() => onFieldFocus('ageIQR_lower')}
              onBlur={() => onFieldFocus(null)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ageIQR_upper">Age IQR (Upper/Q3)</Label>
            <Input
              id="ageIQR_upper"
              type="number"
              step="0.1"
              value={formData.ageIQR_upper || ''}
              onChange={(e) => onUpdate({ ageIQR_upper: e.target.value })}
              onFocus={() => onFieldFocus('ageIQR_upper')}
              onBlur={() => onFieldFocus(null)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Gender */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Gender</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="maleN">Male N</Label>
            <Input
              id="maleN"
              type="number"
              value={formData.maleN || ''}
              onChange={(e) => onUpdate({ maleN: e.target.value })}
              onFocus={() => onFieldFocus('maleN')}
              onBlur={() => onFieldFocus(null)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="femaleN">Female N</Label>
            <Input
              id="femaleN"
              type="number"
              value={formData.femaleN || ''}
              onChange={(e) => onUpdate({ femaleN: e.target.value })}
              onFocus={() => onFieldFocus('femaleN')}
              onBlur={() => onFieldFocus(null)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Baseline Clinical Scores */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Baseline Clinical Scores</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="prestrokeMRS">Pre-stroke mRS</Label>
            <Input
              id="prestrokeMRS"
              type="number"
              step="0.1"
              value={formData.prestrokeMRS || ''}
              onChange={(e) => onUpdate({ prestrokeMRS: e.target.value })}
              onFocus={() => onFieldFocus('prestrokeMRS')}
              onBlur={() => onFieldFocus(null)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nihssMean">NIHSS Mean/Median</Label>
            <Input
              id="nihssMean"
              type="number"
              step="0.1"
              value={formData.nihssMean || ''}
              onChange={(e) => onUpdate({ nihssMean: e.target.value })}
              onFocus={() => onFieldFocus('nihssMean')}
              onBlur={() => onFieldFocus(null)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gcsMean">GCS Mean/Median</Label>
            <Input
              id="gcsMean"
              type="number"
              step="0.1"
              value={formData.gcsMean || ''}
              onChange={(e) => onUpdate({ gcsMean: e.target.value })}
              onFocus={() => onFieldFocus('gcsMean')}
              onBlur={() => onFieldFocus(null)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
