import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { MRSVisualization } from "@/components/MRSVisualization";

interface MortalityData {
  id: string;
  timepoint: string;
  overallN: string;
  overallPercent: string;
  armData: Array<{ armId: string; n: string; percent: string }>;
}

interface MRSData {
  id: string;
  timepoint: string;
  armData: Array<{
    armId: string;
    mRS0: string;
    mRS1: string;
    mRS2: string;
    mRS3: string;
    mRS4: string;
    mRS5: string;
    mRS6: string;
  }>;
}

interface StudyArm {
  id: string;
  name: string;
}

interface Step7OutcomesProps {
  mortalityData: MortalityData[];
  mrsData: MRSData[];
  studyArms: StudyArm[];
  addMortality: () => void;
  updateMortalityField: (id: string, field: string, value: string) => void;
  updateMortalityArmData: (mortalityId: string, armId: string, field: string, value: string) => void;
  removeMortality: (id: string) => void;
  addMRS: () => void;
  updateMRSField: (id: string, armId: string, field: string, value: string) => void;
  removeMRS: (id: string) => void;
  disabled?: boolean;
}

export const Step7Outcomes = ({
  mortalityData,
  mrsData,
  studyArms,
  addMortality,
  updateMortalityField,
  updateMortalityArmData,
  removeMortality,
  addMRS,
  updateMRSField,
  removeMRS,
  disabled = false
}: Step7OutcomesProps) => {
  return (
    <>
      <h3 className="font-semibold text-base">Mortality Data</h3>
      <div className="space-y-3">
        {mortalityData.map((mortality) => (
          <Card key={mortality.id} className="p-4">
            <div className="space-y-3">
              <div className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <Label>Timepoint</Label>
                  <Input
                    value={mortality.timepoint}
                    onChange={(e) => updateMortalityField(mortality.id, "timepoint", e.target.value)}
                    placeholder="e.g., 30 days, 90 days..."
                    disabled={disabled}
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="mt-6"
                  onClick={() => removeMortality(mortality.id)}
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Overall N</Label>
                  <Input
                    type="number"
                    value={mortality.overallN}
                    onChange={(e) => updateMortalityField(mortality.id, "overallN", e.target.value)}
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Overall %</Label>
                  <Input
                    value={mortality.overallPercent}
                    onChange={(e) => updateMortalityField(mortality.id, "overallPercent", e.target.value)}
                    disabled={disabled}
                  />
                </div>
              </div>
              {studyArms.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">By Study Arm</Label>
                  {mortality.armData.map((armData) => {
                    const arm = studyArms.find(a => a.id === armData.armId);
                    return arm ? (
                      <div key={armData.armId} className="grid grid-cols-3 gap-2 items-center">
                        <span className="text-sm">{arm.name || "Unnamed Arm"}</span>
                        <Input
                          type="number"
                          value={armData.n}
                          onChange={(e) => updateMortalityArmData(mortality.id, armData.armId, "n", e.target.value)}
                          placeholder="N"
                          disabled={disabled}
                        />
                        <Input
                          value={armData.percent}
                          onChange={(e) => updateMortalityArmData(mortality.id, armData.armId, "percent", e.target.value)}
                          placeholder="%"
                          disabled={disabled}
                        />
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </Card>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addMortality}
          className="w-full"
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Mortality Data
        </Button>
      </div>

      <h3 className="font-semibold text-base mt-6">Modified Rankin Scale (mRS)</h3>
      
      {mrsData.length > 0 && studyArms.length > 0 && (
        <MRSVisualization mrsData={mrsData} studyArms={studyArms} />
      )}
      
      <div className="space-y-3">
        {mrsData.map((mrs) => (
          <Card key={mrs.id} className="p-4">
            <div className="space-y-3">
              <div className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <Label>Timepoint</Label>
                  <Input
                    value={mrs.timepoint}
                    onChange={(e) => {
                      const updatedMRS = mrsData.find(m => m.id === mrs.id);
                      if (updatedMRS) {
                        updatedMRS.armData.forEach(armData => {
                          updateMRSField(mrs.id, armData.armId, "timepoint", e.target.value);
                        });
                      }
                    }}
                    placeholder="e.g., 90 days, 6 months..."
                    disabled={disabled}
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="mt-6"
                  onClick={() => removeMRS(mrs.id)}
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {studyArms.length > 0 && (
                <div className="space-y-4">
                  {mrs.armData.map((armData) => {
                    const arm = studyArms.find(a => a.id === armData.armId);
                    return arm ? (
                      <div key={armData.armId} className="space-y-2">
                        <Label className="text-sm font-medium">{arm.name || "Unnamed Arm"}</Label>
                        <div className="grid grid-cols-7 gap-2">
                          {(['mRS0', 'mRS1', 'mRS2', 'mRS3', 'mRS4', 'mRS5', 'mRS6'] as const).map((mrsKey, idx) => (
                            <div key={mrsKey} className="space-y-1">
                              <Label className="text-xs text-muted-foreground">{idx}</Label>
                              <Input
                                type="number"
                                value={armData[mrsKey]}
                                onChange={(e) => updateMRSField(mrs.id, armData.armId, mrsKey, e.target.value)}
                                placeholder="N"
                                disabled={disabled}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </Card>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addMRS}
          className="w-full"
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add mRS Data
        </Button>
      </div>
    </>
  );
};
