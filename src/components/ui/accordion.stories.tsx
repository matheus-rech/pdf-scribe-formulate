import type { Meta, StoryObj } from "@storybook/react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./accordion";
import { Badge } from "./badge";

const meta = {
  title: "UI/Accordion",
  component: Accordion,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single = {
  args: {},
  render: () => (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>What is systematic review?</AccordionTrigger>
        <AccordionContent>
          A systematic review is a type of literature review that uses systematic methods to collect secondary data, critically appraise research studies, and synthesize findings.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>How does data extraction work?</AccordionTrigger>
        <AccordionContent>
          Data extraction involves systematically collecting relevant information from research studies according to predefined criteria and recording it in a standardized format.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>What is PICOT framework?</AccordionTrigger>
        <AccordionContent>
          PICOT is an acronym for Population, Intervention, Comparison, Outcome, and Time frame. It's used to formulate clinical research questions.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Multiple = {
  args: {},
  render: () => (
    <Accordion type="multiple" className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>General Settings</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            <p className="text-sm">Configure general application settings including language, timezone, and default views.</p>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Privacy Settings</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            <p className="text-sm">Manage your privacy preferences and data sharing options.</p>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Notification Settings</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            <p className="text-sm">Control which notifications you receive and how you receive them.</p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const WithDefaultValue = {
  args: {},
  render: () => (
    <Accordion type="single" defaultValue="item-2" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>Section 1</AccordionTrigger>
        <AccordionContent>
          This section is initially collapsed.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Section 2 (Pre-opened)</AccordionTrigger>
        <AccordionContent>
          This section is initially expanded because it matches the defaultValue.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Section 3</AccordionTrigger>
        <AccordionContent>
          This section is initially collapsed.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const WithBadges = {
  args: {},
  render: () => (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            <span>Active Studies</span>
            <Badge variant="default">3</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            <p className="text-sm">• Study A: In Progress</p>
            <p className="text-sm">• Study B: Under Review</p>
            <p className="text-sm">• Study C: Data Collection</p>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            <span>Completed Studies</span>
            <Badge variant="secondary">12</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <p className="text-sm">View all completed studies and their results.</p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            <span>Pending Review</span>
            <Badge variant="outline">5</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <p className="text-sm">Studies awaiting peer review and approval.</p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const FAQ = {
  args: {},
  render: () => (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="faq-1">
        <AccordionTrigger>How do I create a new study?</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            <p className="text-sm">To create a new study:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click the "New Study" button in the sidebar</li>
              <li>Fill in the study details and research question</li>
              <li>Define your inclusion/exclusion criteria</li>
              <li>Save and start adding documents</li>
            </ol>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="faq-2">
        <AccordionTrigger>Can I collaborate with other researchers?</AccordionTrigger>
        <AccordionContent>
          <p className="text-sm">
            Yes, you can invite collaborators to your study by going to Study Settings {'>'} Team Members and sending them an invitation link. They'll be able to review and extract data based on the permissions you grant.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="faq-3">
        <AccordionTrigger>What file formats are supported?</AccordionTrigger>
        <AccordionContent>
          <p className="text-sm">
            The tool currently supports PDF documents. You can upload individual PDFs or batch upload multiple files at once. Each document is automatically processed for text extraction and analysis.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="faq-4">
        <AccordionTrigger>How is my data secured?</AccordionTrigger>
        <AccordionContent>
          <p className="text-sm">
            All data is encrypted in transit and at rest. We use industry-standard security practices and comply with data protection regulations. Your studies and extracted data are only accessible to you and your authorized collaborators.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const NestedContent = {
  args: {},
  render: () => (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>Account Overview</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Profile Information</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Name: John Doe</p>
                <p>Email: john@example.com</p>
                <p>Member since: January 2024</p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Subscription</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Plan: Professional</p>
                <p>Status: Active</p>
                <p>Renewal: March 15, 2024</p>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Usage Statistics</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">This Month</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Studies created: 5</p>
                <p>Documents processed: 127</p>
                <p>Extractions completed: 89</p>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
