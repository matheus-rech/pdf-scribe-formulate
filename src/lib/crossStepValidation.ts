export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'warning' | 'error';
  autoFixable: boolean;
}

export const validateCrossStepData = (formData: Record<string, any>): ValidationWarning[] => {
  const warnings: ValidationWarning[] = [];

  // 1. Sample Size Consistency
  const totalN = parseInt(formData.totalN) || 0;
  const surgicalN = parseInt(formData.surgicalN) || 0;
  const controlN = parseInt(formData.controlN) || 0;
  
  if (totalN > 0 && surgicalN > 0 && controlN > 0) {
    const sum = surgicalN + controlN;
    if (Math.abs(sum - totalN) > 1) {
      warnings.push({
        field: 'totalN',
        message: `Sample size mismatch: Surgical (${surgicalN}) + Control (${controlN}) = ${sum}, but Total N is ${totalN}`,
        severity: 'error',
        autoFixable: true
      });
    }
  }

  // 2. Age Range Validation
  const ageMean = parseFloat(formData.ageMean) || 0;
  const ageMedian = parseFloat(formData.ageMedian) || 0;
  const ageIQR_lower = parseFloat(formData.ageIQR_lower) || 0;
  const ageIQR_upper = parseFloat(formData.ageIQR_upper) || 0;

  if (ageMean > 0 && ageMedian > 0) {
    const diff = Math.abs(ageMean - ageMedian);
    const threshold = ageMean * 0.1; // 10% tolerance
    if (diff > threshold) {
      warnings.push({
        field: 'ageMean',
        message: `Age mean (${ageMean}) and median (${ageMedian}) differ by more than 10%`,
        severity: 'warning',
        autoFixable: false
      });
    }
  }

  if (ageMean > 0 && ageIQR_lower > 0 && ageIQR_upper > 0) {
    if (ageMean < ageIQR_lower || ageMean > ageIQR_upper) {
      warnings.push({
        field: 'ageMean',
        message: `Age mean (${ageMean}) should be within IQR range (${ageIQR_lower}-${ageIQR_upper})`,
        severity: 'warning',
        autoFixable: false
      });
    }
  }

  // 3. Gender Sum Validation
  const maleN = parseInt(formData.maleN) || 0;
  const femaleN = parseInt(formData.femaleN) || 0;

  if (totalN > 0 && maleN > 0 && femaleN > 0) {
    const genderSum = maleN + femaleN;
    const diff = Math.abs(genderSum - totalN);
    const tolerance = totalN * 0.05; // 5% tolerance

    if (diff > tolerance) {
      warnings.push({
        field: 'maleN',
        message: `Gender sum (${genderSum}) differs from Total N (${totalN}) by ${diff} participants`,
        severity: 'warning',
        autoFixable: false
      });
    }
  }

  // 4. Study Arms Total Validation
  if (formData.studyArms && Array.isArray(formData.studyArms)) {
    const armTotal = formData.studyArms.reduce((sum: number, arm: any) => {
      return sum + (parseInt(arm.n) || 0);
    }, 0);

    if (totalN > 0 && armTotal > 0 && Math.abs(armTotal - totalN) > 1) {
      warnings.push({
        field: 'studyArms',
        message: `Study arms total (${armTotal}) doesn't match Total N (${totalN})`,
        severity: 'error',
        autoFixable: false
      });
    }
  }

  // 5. Mortality Rate Consistency
  if (formData.mortalityData && Array.isArray(formData.mortalityData)) {
    formData.mortalityData.forEach((mortality: any, index: number) => {
      const overallN = parseInt(mortality.overallN) || 0;
      
      if (overallN > totalN) {
        warnings.push({
          field: `mortalityData[${index}].overallN`,
          message: `Mortality N (${overallN}) at ${mortality.timepoint} exceeds Total N (${totalN})`,
          severity: 'error',
          autoFixable: false
        });
      }

      // Check arm data sum
      if (mortality.armData && Array.isArray(mortality.armData)) {
        const armSum = mortality.armData.reduce((sum: number, arm: any) => {
          return sum + (parseInt(arm.n) || 0);
        }, 0);

        if (overallN > 0 && armSum > 0 && Math.abs(armSum - overallN) > 1) {
          warnings.push({
            field: `mortalityData[${index}]`,
            message: `Mortality arm data sum (${armSum}) doesn't match overall N (${overallN}) at ${mortality.timepoint}`,
            severity: 'warning',
            autoFixable: false
          });
        }
      }
    });
  }

  // 6. Outcome Timeline Logic
  if (formData.mortalityData && Array.isArray(formData.mortalityData) && formData.mortalityData.length > 1) {
    const sortedMortality = [...formData.mortalityData].sort((a, b) => {
      // Simple timepoint parsing (e.g., "30 days", "90 days")
      const getTimeValue = (tp: string) => {
        const match = tp.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };
      return getTimeValue(a.timepoint) - getTimeValue(b.timepoint);
    });

    for (let i = 1; i < sortedMortality.length; i++) {
      const prevN = parseInt(sortedMortality[i-1].overallN) || 0;
      const currN = parseInt(sortedMortality[i].overallN) || 0;

      if (currN > prevN) {
        warnings.push({
          field: 'mortalityData',
          message: `Mortality count increased from ${sortedMortality[i-1].timepoint} (${prevN}) to ${sortedMortality[i].timepoint} (${currN})`,
          severity: 'warning',
          autoFixable: false
        });
      }
    }
  }

  return warnings;
};

export const getAutoFix = (warning: ValidationWarning, formData: Record<string, any>): any => {
  if (!warning.autoFixable) return null;

  switch (warning.field) {
    case 'totalN': {
      const surgicalN = parseInt(formData.surgicalN) || 0;
      const controlN = parseInt(formData.controlN) || 0;
      return { totalN: surgicalN + controlN };
    }
    default:
      return null;
  }
};
