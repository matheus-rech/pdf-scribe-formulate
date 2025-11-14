export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'warning' | 'error';
  autoFixable: boolean;
  suggestedFix?: string;
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

  // 6. Enhanced Mortality Rate Consistency Across Timepoints
  if (formData.mortalityData && Array.isArray(formData.mortalityData) && formData.mortalityData.length > 1) {
    const sortedMortality = [...formData.mortalityData].sort((a, b) => {
      const getTimeValue = (tp: string) => {
        const match = tp.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };
      return getTimeValue(a.timepoint) - getTimeValue(b.timepoint);
    });

    for (let i = 1; i < sortedMortality.length; i++) {
      const prevN = parseInt(sortedMortality[i-1].overallN) || 0;
      const currN = parseInt(sortedMortality[i].overallN) || 0;
      const prevPercent = parseFloat(sortedMortality[i-1].overallPercent) || 0;
      const currPercent = parseFloat(sortedMortality[i].overallPercent) || 0;

      // Mortality count should not decrease
      if (currN < prevN) {
        warnings.push({
          field: 'mortalityData',
          message: `Mortality count decreased from ${sortedMortality[i-1].timepoint} (${prevN}) to ${sortedMortality[i].timepoint} (${currN}) - this is unusual`,
          severity: 'error',
          autoFixable: false
        });
      }

      // Mortality percentage should not decrease
      if (currPercent < prevPercent - 1) { // Allow 1% tolerance for rounding
        warnings.push({
          field: 'mortalityData',
          message: `Mortality rate decreased from ${sortedMortality[i-1].timepoint} (${prevPercent}%) to ${sortedMortality[i].timepoint} (${currPercent}%)`,
          severity: 'warning',
          autoFixable: false
        });
      }

      // Check per-arm consistency
      if (sortedMortality[i-1].armData && sortedMortality[i].armData) {
        sortedMortality[i-1].armData.forEach((prevArm: any) => {
          const currArm = sortedMortality[i].armData.find((a: any) => a.armId === prevArm.armId);
          if (currArm) {
            const prevArmN = parseInt(prevArm.n) || 0;
            const currArmN = parseInt(currArm.n) || 0;
            
            if (currArmN < prevArmN) {
              warnings.push({
                field: `mortalityData[${i}].armData`,
                message: `Arm ${prevArm.armId} mortality decreased from ${sortedMortality[i-1].timepoint} (${prevArmN}) to ${sortedMortality[i].timepoint} (${currArmN})`,
                severity: 'error',
                autoFixable: false
              });
            }
          }
        });
      }
    }
  }

  // 7. Percentage-N Value Consistency with Auto-fix
  if (formData.mortalityData && Array.isArray(formData.mortalityData)) {
    formData.mortalityData.forEach((mortality: any, index: number) => {
      const overallN = parseInt(mortality.overallN) || 0;
      const overallPercent = parseFloat(mortality.overallPercent) || 0;
      
      if (overallN > 0 && totalN > 0) {
        const calculatedPercent = (overallN / totalN) * 100;
        const diff = Math.abs(calculatedPercent - overallPercent);
        
        if (diff > 2) { // 2% tolerance
          warnings.push({
            field: `mortalityData[${index}].overallPercent`,
            message: `Mortality percentage (${overallPercent}%) doesn't match calculated value (${calculatedPercent.toFixed(1)}%) based on N=${overallN}/${totalN}`,
            severity: 'warning',
            autoFixable: true,
            suggestedFix: calculatedPercent.toFixed(1)
          });
        }
      }

      // Check arm-specific percentage consistency
      if (mortality.armData && Array.isArray(mortality.armData) && formData.studyArms) {
        mortality.armData.forEach((armMort: any, armIndex: number) => {
          const arm = formData.studyArms.find((a: any) => a.id === armMort.armId);
          if (arm) {
            const armN = parseInt(armMort.n) || 0;
            const armPercent = parseFloat(armMort.percent) || 0;
            const armTotalN = parseInt(arm.n) || 0;
            
            if (armN > 0 && armTotalN > 0) {
              const calculatedPercent = (armN / armTotalN) * 100;
              const diff = Math.abs(calculatedPercent - armPercent);
              
              if (diff > 2) {
                warnings.push({
                  field: `mortalityData[${index}].armData[${armIndex}].percent`,
                  message: `Arm ${arm.name} mortality percentage (${armPercent}%) doesn't match calculated (${calculatedPercent.toFixed(1)}%)`,
                  severity: 'warning',
                  autoFixable: true,
                  suggestedFix: calculatedPercent.toFixed(1)
                });
              }
            }
          }
        });
      }
    });
  }

  // 8. Intervention-Arm Matching Validation
  if (formData.interventions && formData.studyArms && Array.isArray(formData.studyArms)) {
    const interventions = [formData.interventions.surgical, formData.interventions.control]
      .filter(Boolean);
    
    if (interventions.length !== formData.studyArms.length) {
      warnings.push({
        field: 'studyArms',
        message: `Number of study arms (${formData.studyArms.length}) doesn't match number of interventions (${interventions.length})`,
        severity: 'warning',
        autoFixable: false
      });
    }

    // Check if arm names relate to interventions
    formData.studyArms.forEach((arm: any, index: number) => {
      if (!arm.name || arm.name.trim() === '') {
        warnings.push({
          field: `studyArms[${index}].name`,
          message: `Study arm ${index + 1} is missing a name`,
          severity: 'warning',
          autoFixable: false
        });
      }
    });

    // Verify mortality data has entries for all arms
    if (formData.mortalityData && Array.isArray(formData.mortalityData)) {
      formData.mortalityData.forEach((mortality: any, mIndex: number) => {
        if (mortality.armData) {
          const armIds = new Set(mortality.armData.map((a: any) => a.armId));
          formData.studyArms.forEach((arm: any) => {
            if (!armIds.has(arm.id)) {
              warnings.push({
                field: `mortalityData[${mIndex}].armData`,
                message: `Missing mortality data for arm "${arm.name}" at ${mortality.timepoint}`,
                severity: 'warning',
                autoFixable: false
              });
            }
          });
        }
      });
    }

    // Verify mRS data has entries for all arms
    if (formData.mrsData && Array.isArray(formData.mrsData)) {
      formData.mrsData.forEach((mrs: any, mIndex: number) => {
        if (mrs.armData) {
          const armIds = new Set(mrs.armData.map((a: any) => a.armId));
          formData.studyArms.forEach((arm: any) => {
            if (!armIds.has(arm.id)) {
              warnings.push({
                field: `mrsData[${mIndex}].armData`,
                message: `Missing mRS data for arm "${arm.name}" at ${mrs.timepoint}`,
                severity: 'warning',
                autoFixable: false
              });
            }
          });
        }
      });
    }
  }

  // 9. mRS Outcome Timeline Logic
  if (formData.mrsData && Array.isArray(formData.mrsData) && formData.mrsData.length > 1) {
    const sortedMRS = [...formData.mrsData].sort((a, b) => {
      const getTimeValue = (tp: string) => {
        const match = tp.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };
      return getTimeValue(a.timepoint) - getTimeValue(b.timepoint);
    });

    // Validate timepoint format
    formData.mrsData.forEach((mrs: any, index: number) => {
      if (!mrs.timepoint || mrs.timepoint.trim() === '') {
        warnings.push({
          field: `mrsData[${index}].timepoint`,
          message: `mRS timepoint ${index + 1} is missing`,
          severity: 'error',
          autoFixable: false
        });
      }
    });

    // Check for duplicate timepoints
    const timepoints = formData.mrsData.map((m: any) => m.timepoint);
    const duplicates = timepoints.filter((tp: string, idx: number) => 
      timepoints.indexOf(tp) !== idx
    );
    if (duplicates.length > 0) {
      warnings.push({
        field: 'mrsData',
        message: `Duplicate mRS timepoints found: ${[...new Set(duplicates)].join(', ')}`,
        severity: 'error',
        autoFixable: false
      });
    }
  }

  // 10. mRS Distribution Validation
  if (formData.mrsData && Array.isArray(formData.mrsData)) {
    formData.mrsData.forEach((mrs: any, index: number) => {
      if (mrs.armData && Array.isArray(mrs.armData)) {
        mrs.armData.forEach((armData: any, armIndex: number) => {
          const mrsValues = [
            parseInt(armData.mRS0) || 0,
            parseInt(armData.mRS1) || 0,
            parseInt(armData.mRS2) || 0,
            parseInt(armData.mRS3) || 0,
            parseInt(armData.mRS4) || 0,
            parseInt(armData.mRS5) || 0,
            parseInt(armData.mRS6) || 0
          ];
          
          const total = mrsValues.reduce((sum, val) => sum + val, 0);
          
          if (total > 0 && formData.studyArms) {
            const arm = formData.studyArms.find((a: any) => a.id === armData.armId);
            if (arm) {
              const armTotalN = parseInt(arm.n) || 0;
              const diff = Math.abs(total - armTotalN);
              const tolerance = armTotalN * 0.1; // 10% tolerance
              
              if (diff > tolerance && armTotalN > 0) {
                warnings.push({
                  field: `mrsData[${index}].armData[${armIndex}]`,
                  message: `mRS distribution total (${total}) for arm "${arm.name}" differs from arm size (${armTotalN}) at ${mrs.timepoint}`,
                  severity: 'warning',
                  autoFixable: false
                });
              }
            }
          }
        });
      }
    });
  }

  return warnings;
};

export const getAutoFix = (warning: ValidationWarning, formData: Record<string, any>): Record<string, any> | null => {
  if (!warning.autoFixable) return null;

  // Handle percentage auto-fixes with suggestedFix
  if (warning.field.includes('Percent') && warning.suggestedFix) {
    const fieldPath = warning.field.split('.');
    
    // Handle mortalityData percentage fixes
    if (fieldPath[0].includes('mortalityData')) {
      const match = fieldPath[0].match(/\[(\d+)\]/);
      if (match) {
        const index = parseInt(match[1]);
        const updatedMortality = [...(formData.mortalityData || [])];
        
        if (fieldPath.length > 1 && fieldPath[1].includes('armData')) {
          const armMatch = fieldPath[1].match(/\[(\d+)\]/);
          if (armMatch) {
            const armIndex = parseInt(armMatch[1]);
            updatedMortality[index] = {
              ...updatedMortality[index],
              armData: updatedMortality[index].armData.map((arm: any, idx: number) =>
                idx === armIndex ? { ...arm, percent: warning.suggestedFix } : arm
              )
            };
          }
        } else {
          updatedMortality[index] = {
            ...updatedMortality[index],
            overallPercent: warning.suggestedFix
          };
        }
        
        return { mortalityData: updatedMortality };
      }
    }
  }

  switch (warning.field) {
    case 'totalN': {
      const surgicalN = parseInt(formData.surgicalN) || 0;
      const controlN = parseInt(formData.controlN) || 0;
      const fixedTotal = surgicalN + controlN;
      
      if (fixedTotal === 0) return null;
      
      return { 
        totalN: fixedTotal.toString()
      };
    }
    
    case 'ageMean': {
      const ageIQR_lower = parseFloat(formData.ageIQR_lower) || 0;
      const ageIQR_upper = parseFloat(formData.ageIQR_upper) || 0;
      
      if (ageIQR_lower === 0 || ageIQR_upper === 0) return null;
      
      const fixedMean = ((ageIQR_lower + ageIQR_upper) / 2).toFixed(1);
      
      return {
        ageMean: fixedMean
      };
    }
    
    case 'studyArms': {
      if (!formData.studyArms || !Array.isArray(formData.studyArms)) return null;
      
      const totalN = parseInt(formData.totalN) || 0;
      if (totalN === 0) return null;
      
      const currentSum = formData.studyArms.reduce((sum: number, arm: any) => {
        return sum + (parseInt(arm.n) || 0);
      }, 0);
      
      if (currentSum === 0) return null;
      
      const factor = totalN / currentSum;
      
      const fixedArms = formData.studyArms.map((arm: any) => {
        const currentN = parseInt(arm.n) || 0;
        const adjustedN = Math.round(currentN * factor);
        
        return { ...arm, n: adjustedN.toString() };
      });
      
      const newSum = fixedArms.reduce((sum: number, arm: any) => sum + parseInt(arm.n), 0);
      if (newSum !== totalN && fixedArms.length > 0) {
        const diff = totalN - newSum;
        const lastIndex = fixedArms.length - 1;
        fixedArms[lastIndex].n = (parseInt(fixedArms[lastIndex].n) + diff).toString();
      }
      
      return { studyArms: fixedArms };
    }
    
    default:
      return null;
  }
};
