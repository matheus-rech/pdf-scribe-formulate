#!/usr/bin/env node
/**
 * Generate sample PDF fixtures for E2E testing
 *
 * This script creates sample PDF files that mimic research papers
 * for use in Playwright E2E tests.
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDir = join(__dirname, '..', 'e2e', 'fixtures');

/**
 * Create a sample research paper PDF
 */
async function createSampleStudy() {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  // Page 1: Title and Abstract
  let page = pdfDoc.addPage([612, 792]); // Letter size
  const { width, height } = page.getSize();
  const fontSize = 12;
  const titleFontSize = 18;
  const margin = 72; // 1 inch margins

  // Title
  page.drawText('Efficacy of Novel Treatment in Randomized Clinical Trial', {
    x: margin,
    y: height - margin,
    size: titleFontSize,
    font: timesRomanBoldFont,
    color: rgb(0, 0, 0),
    maxWidth: width - 2 * margin,
  });

  // Authors
  page.drawText('John Doe, Jane Smith, Robert Johnson', {
    x: margin,
    y: height - margin - 30,
    size: fontSize,
    font: timesRomanFont,
  });

  // Abstract
  page.drawText('Abstract', {
    x: margin,
    y: height - margin - 60,
    size: fontSize + 2,
    font: timesRomanBoldFont,
  });

  const abstractText = `Background: This randomized controlled trial evaluated the efficacy of a novel treatment
approach for patients with chronic condition. The intervention group received the new treatment
while the control group received standard care.

Objectives: To assess the effectiveness and safety of the novel treatment compared to standard
care in a population of 120 patients over 12 months.

Methods: A total of 120 patients were randomized in a 1:1 ratio to either the intervention
group (n=60) or control group (n=60). Primary outcome was measured using validated scales.
Secondary outcomes included quality of life measures and adverse events.

Results: The intervention group showed significant improvement in primary outcomes (p<0.001)
compared to control. Quality of life scores improved by 25% in the intervention group versus
10% in control. Adverse events were comparable between groups.

Conclusions: The novel treatment demonstrates superior efficacy compared to standard care with
an acceptable safety profile. These findings support the use of this intervention in clinical
practice.`;

  const lines = abstractText.split('\n');
  let yPosition = height - margin - 85;

  for (const line of lines) {
    page.drawText(line, {
      x: margin,
      y: yPosition,
      size: fontSize - 1,
      font: timesRomanFont,
      maxWidth: width - 2 * margin,
    });
    yPosition -= 15;
  }

  // Page 2: Introduction and Methods
  page = pdfDoc.addPage([612, 792]);
  yPosition = height - margin;

  // Introduction
  page.drawText('1. Introduction', {
    x: margin,
    y: yPosition,
    size: fontSize + 2,
    font: timesRomanBoldFont,
  });
  yPosition -= 25;

  const introText = `Chronic conditions affect millions of patients worldwide, representing a significant burden
on healthcare systems. Current standard treatments have limitations in terms of efficacy and
tolerability. This study aimed to evaluate a novel therapeutic approach that addresses these
limitations through a innovative mechanism of action.`;

  const introLines = introText.split('\n');
  for (const line of introLines) {
    page.drawText(line, {
      x: margin,
      y: yPosition,
      size: fontSize - 1,
      font: timesRomanFont,
      maxWidth: width - 2 * margin,
    });
    yPosition -= 15;
  }

  yPosition -= 20;

  // Methods
  page.drawText('2. Methods', {
    x: margin,
    y: yPosition,
    size: fontSize + 2,
    font: timesRomanBoldFont,
  });
  yPosition -= 25;

  const methodsText = `Study Design: This was a prospective, randomized, double-blind, placebo-controlled trial
conducted at multiple centers between January 2023 and December 2024.

Population: Adult patients aged 18-75 years with confirmed diagnosis of chronic condition
were eligible. Exclusion criteria included severe comorbidities and prior treatment with
similar agents.

Intervention: Patients in the intervention group received the novel treatment at a dose of
100mg daily for 12 months. The control group received matching placebo.

Outcomes: The primary outcome was change in disease severity score from baseline to 12 months.
Secondary outcomes included quality of life (SF-36), adverse events, and laboratory parameters.

Statistical Analysis: Sample size was calculated to detect a 20% difference with 80% power.
Intention-to-treat analysis was performed using ANCOVA for primary outcome.`;

  const methodLines = methodsText.split('\n');
  for (const line of methodLines) {
    if (yPosition < margin + 50) {
      page = pdfDoc.addPage([612, 792]);
      yPosition = height - margin;
    }
    page.drawText(line, {
      x: margin,
      y: yPosition,
      size: fontSize - 1,
      font: timesRomanFont,
      maxWidth: width - 2 * margin,
    });
    yPosition -= 15;
  }

  // Page 3: Results
  page = pdfDoc.addPage([612, 792]);
  yPosition = height - margin;

  page.drawText('3. Results', {
    x: margin,
    y: yPosition,
    size: fontSize + 2,
    font: timesRomanBoldFont,
  });
  yPosition -= 25;

  const resultsText = `Baseline Characteristics: A total of 120 patients were enrolled (mean age 52.3 ± 12.1 years,
54% female). Groups were well-balanced at baseline for all demographic and clinical variables.

Primary Outcome: At 12 months, the intervention group showed a mean reduction of 45.2 points
in disease severity score compared to 18.3 points in the control group (difference 26.9,
95% CI 19.2-34.6, p<0.001).

Secondary Outcomes:
- Quality of life improved significantly in the intervention group (SF-36 score +12.3 vs +5.1, p=0.002)
- Patient-reported outcomes favored intervention (p=0.015)
- Biomarkers showed improvement in intervention group (p<0.001)

Safety: Adverse events occurred in 32% of intervention group vs 28% of control (p=0.64).
No serious adverse events were attributed to the study drug. Three patients discontinued due
to adverse events in each group.

Subgroup Analysis: Treatment effect was consistent across age, sex, and disease severity
subgroups (all p-values for interaction >0.05).`;

  const resultLines = resultsText.split('\n');
  for (const line of resultLines) {
    if (yPosition < margin + 50) {
      page = pdfDoc.addPage([612, 792]);
      yPosition = height - margin;
    }
    page.drawText(line, {
      x: margin,
      y: yPosition,
      size: fontSize - 1,
      font: timesRomanFont,
      maxWidth: width - 2 * margin,
    });
    yPosition -= 15;
  }

  // Page 4: Discussion and References
  page = pdfDoc.addPage([612, 792]);
  yPosition = height - margin;

  page.drawText('4. Discussion', {
    x: margin,
    y: yPosition,
    size: fontSize + 2,
    font: timesRomanBoldFont,
  });
  yPosition -= 25;

  const discussionText = `This randomized controlled trial demonstrates that the novel treatment is superior to standard
care for patients with chronic condition. The 26.9-point difference in primary outcome exceeds
the minimal clinically important difference of 15 points, indicating meaningful clinical benefit.

The safety profile was favorable with no increase in adverse events compared to control. These
findings are consistent with earlier phase 2 studies and extend them to a larger, more diverse
patient population.

Limitations include the 12-month follow-up period and single-country enrollment. Longer-term
studies are needed to assess durability of response and late adverse events.

In conclusion, this study provides strong evidence for the efficacy and safety of the novel
treatment in clinical practice.`;

  const discussionLines = discussionText.split('\n');
  for (const line of discussionLines) {
    page.drawText(line, {
      x: margin,
      y: yPosition,
      size: fontSize - 1,
      font: timesRomanFont,
      maxWidth: width - 2 * margin,
    });
    yPosition -= 15;
  }

  yPosition -= 20;

  page.drawText('References', {
    x: margin,
    y: yPosition,
    size: fontSize + 2,
    font: timesRomanBoldFont,
  });
  yPosition -= 20;

  const references = [
    '1. Smith J, et al. Previous studies on treatment approaches. J Med Research. 2022;45:123-134.',
    '2. Johnson R, et al. Systematic review of current therapies. Lancet. 2021;398:2001-2012.',
    '3. Doe J, et al. Phase 2 trial results. N Engl J Med. 2023;388:145-156.',
  ];

  for (const ref of references) {
    page.drawText(ref, {
      x: margin,
      y: yPosition,
      size: fontSize - 2,
      font: timesRomanFont,
      maxWidth: width - 2 * margin,
    });
    yPosition -= 18;
  }

  // Save PDF
  const pdfBytes = await pdfDoc.save();
  const outputPath = join(fixturesDir, 'sample-study.pdf');
  writeFileSync(outputPath, pdfBytes);
  console.log(`✓ Created: ${outputPath}`);

  return pdfBytes;
}

/**
 * Create a larger PDF for performance testing
 */
async function createLargeStudy() {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const fontSize = 11;
  const margin = 72;

  // Create 50+ pages with similar content
  for (let i = 0; i < 55; i++) {
    const page = pdfDoc.addPage([612, 792]);
    const { width, height } = page.getSize();

    page.drawText(`Page ${i + 1}`, {
      x: width / 2 - 30,
      y: height - margin / 2,
      size: fontSize,
      font: timesRomanBoldFont,
    });

    let yPosition = height - margin;

    page.drawText(`Section ${Math.floor(i / 5) + 1}`, {
      x: margin,
      y: yPosition,
      size: fontSize + 2,
      font: timesRomanBoldFont,
    });
    yPosition -= 25;

    // Fill page with dummy text
    const dummyText = `This is page ${i + 1} of a large research study document. This document is used for
performance testing of the PDF processing system. It contains multiple pages of text to
simulate a real large research paper that might contain extensive supplementary materials,
detailed methodology sections, comprehensive results, and extensive discussion of findings.

The system should be able to handle documents of this size efficiently, including text
extraction, citation tracking, and data extraction across all pages. Lorem ipsum dolor sit
amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
aliquip ex ea commodo consequat.`;

    const lines = dummyText.split('\n');
    for (const line of lines) {
      if (yPosition < margin + 20) break;
      page.drawText(line, {
        x: margin,
        y: yPosition,
        size: fontSize - 1,
        font: timesRomanFont,
        maxWidth: width - 2 * margin,
      });
      yPosition -= 15;
    }
  }

  const pdfBytes = await pdfDoc.save();
  const outputPath = join(fixturesDir, 'large-study.pdf');
  writeFileSync(outputPath, pdfBytes);
  console.log(`✓ Created: ${outputPath}`);
}

/**
 * Create a PDF with tables
 */
async function createComplexTables() {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();
  const fontSize = 11;
  const margin = 72;

  let yPosition = height - margin;

  page.drawText('Table 1. Baseline Characteristics', {
    x: margin,
    y: yPosition,
    size: fontSize + 2,
    font: timesRomanBoldFont,
  });
  yPosition -= 30;

  // Simple table representation
  const tableHeaders = 'Characteristic              Intervention (n=60)    Control (n=60)    P-value';
  page.drawText(tableHeaders, {
    x: margin,
    y: yPosition,
    size: fontSize - 1,
    font: timesRomanBoldFont,
  });
  yPosition -= 20;

  const tableRows = [
    'Age, mean (SD)              52.3 (12.1)            51.8 (11.9)       0.82',
    'Female, n (%)               32 (53.3)              33 (55.0)         0.85',
    'Disease duration, years     5.2 (2.8)              5.4 (3.1)         0.71',
    'Baseline severity score     68.5 (14.2)            67.9 (13.8)       0.79',
    'Comorbidities, n (%)        18 (30.0)              16 (26.7)         0.68',
  ];

  for (const row of tableRows) {
    page.drawText(row, {
      x: margin,
      y: yPosition,
      size: fontSize - 2,
      font: timesRomanFont,
    });
    yPosition -= 18;
  }

  yPosition -= 30;

  page.drawText('Table 2. Primary and Secondary Outcomes', {
    x: margin,
    y: yPosition,
    size: fontSize + 2,
    font: timesRomanBoldFont,
  });
  yPosition -= 30;

  const outcomesHeaders = 'Outcome                     Intervention        Control        Difference    P-value';
  page.drawText(outcomesHeaders, {
    x: margin,
    y: yPosition,
    size: fontSize - 1,
    font: timesRomanBoldFont,
  });
  yPosition -= 20;

  const outcomesRows = [
    'Primary outcome             -45.2 (8.3)         -18.3 (7.9)    26.9          <0.001',
    'QoL (SF-36)                 +12.3 (5.1)         +5.1 (4.8)     7.2           0.002',
    'Patient satisfaction        8.2 (1.3)           6.9 (1.5)      1.3           0.015',
    'Biomarker level             -22.5 (6.2)         -8.3 (5.9)     14.2          <0.001',
  ];

  for (const row of outcomesRows) {
    page.drawText(row, {
      x: margin,
      y: yPosition,
      size: fontSize - 2,
      font: timesRomanFont,
    });
    yPosition -= 18;
  }

  const pdfBytes = await pdfDoc.save();
  const outputPath = join(fixturesDir, 'complex-tables.pdf');
  writeFileSync(outputPath, pdfBytes);
  console.log(`✓ Created: ${outputPath}`);
}

/**
 * Create a PDF with multiple figures
 */
async function createManyFigures() {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const fontSize = 11;
  const margin = 72;

  // Create 3 pages with figure placeholders
  for (let i = 0; i < 3; i++) {
    const page = pdfDoc.addPage([612, 792]);
    const { width, height } = page.getSize();

    let yPosition = height - margin;

    page.drawText(`Figure ${i + 1}. ${['Study Flow Diagram', 'Primary Outcome Results', 'Subgroup Analysis'][i]}`, {
      x: margin,
      y: yPosition,
      size: fontSize + 1,
      font: timesRomanBoldFont,
    });
    yPosition -= 30;

    // Draw a rectangle to represent a figure
    page.drawRectangle({
      x: margin + 50,
      y: yPosition - 200,
      width: width - 2 * margin - 100,
      height: 180,
      borderColor: rgb(0, 0, 0),
      borderWidth: 2,
    });

    page.drawText('[Figure placeholder - Chart/Diagram would appear here]', {
      x: margin + 120,
      y: yPosition - 110,
      size: fontSize - 1,
      font: timesRomanFont,
    });

    yPosition -= 220;

    const captions = [
      'Flow diagram showing patient enrollment, randomization, and follow-up. Of 150 patients\nscreened, 120 were enrolled and randomized. Follow-up was completed for 116 patients (97%).',
      'Primary outcome results showing mean change in disease severity score at 12 months.\nError bars represent 95% confidence intervals. ***p<0.001 vs control.',
      'Forest plot showing treatment effect across predefined subgroups. Treatment effect was\nconsistent across all subgroups with no significant interaction (p>0.05 for all).'
    ];

    const captionLines = captions[i].split('\n');
    for (const line of captionLines) {
      page.drawText(line, {
        x: margin,
        y: yPosition,
        size: fontSize - 2,
        font: timesRomanFont,
        maxWidth: width - 2 * margin,
      });
      yPosition -= 15;
    }
  }

  const pdfBytes = await pdfDoc.save();
  const outputPath = join(fixturesDir, 'many-figures.pdf');
  writeFileSync(outputPath, pdfBytes);
  console.log(`✓ Created: ${outputPath}`);
}

// Main execution
async function main() {
  console.log('🔧 Generating E2E test fixtures...\n');

  try {
    await createSampleStudy();
    await createLargeStudy();
    await createComplexTables();
    await createManyFigures();

    console.log('\n✅ All test fixtures generated successfully!');
    console.log('\nGenerated files:');
    console.log('  - sample-study.pdf (4 pages, ~25KB)');
    console.log('  - large-study.pdf (55 pages, ~150KB)');
    console.log('  - complex-tables.pdf (1 page with tables)');
    console.log('  - many-figures.pdf (3 pages with figures)');
  } catch (error) {
    console.error('❌ Error generating fixtures:', error);
    process.exit(1);
  }
}

main();
