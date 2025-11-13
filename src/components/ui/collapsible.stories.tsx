import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { Button } from "./button";
import { ChevronsUpDown, ChevronRight, Code, HelpCircle } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible";

const meta = {
  title: "UI/Collapsible",
  component: Collapsible,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: () => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-[350px] space-y-2"
      >
        <div className="flex items-center justify-between space-x-4 px-4">
          <h4 className="text-sm font-semibold">
            @peduarte starred 3 repositories
          </h4>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              <ChevronsUpDown className="h-4 w-4" />
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
          @radix-ui/primitives
        </div>
        <CollapsibleContent className="space-y-2">
          <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
            @radix-ui/colors
          </div>
          <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">
            @stitches/react
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  },
};

export const WithChevronIcon: Story = {
  args: {},
  render: () => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-[350px] space-y-2"
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-4">
            <span className="font-semibold">Project Details</span>
            <ChevronRight
              className={`h-4 w-4 transition-transform ${
                isOpen ? "rotate-90" : ""
              }`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 space-y-2">
          <div className="rounded-md border p-4">
            <p className="text-sm text-muted-foreground">
              This project includes multiple components and features that can be
              expanded to view more details.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  },
};

export const FAQ: Story = {
  args: {},
  render: () => {
    const [open1, setOpen1] = React.useState(false);
    const [open2, setOpen2] = React.useState(false);
    const [open3, setOpen3] = React.useState(false);

    return (
      <div className="w-[500px] space-y-2">
        <Collapsible open={open1} onOpenChange={setOpen1}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                <span className="font-semibold">What is your return policy?</span>
              </div>
              <ChevronRight
                className={`h-4 w-4 transition-transform ${
                  open1 ? "rotate-90" : ""
                }`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4">
            <p className="text-sm text-muted-foreground">
              We offer a 30-day return policy on all items. Items must be in
              their original condition with tags attached.
            </p>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible open={open2} onOpenChange={setOpen2}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                <span className="font-semibold">How long does shipping take?</span>
              </div>
              <ChevronRight
                className={`h-4 w-4 transition-transform ${
                  open2 ? "rotate-90" : ""
                }`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4">
            <p className="text-sm text-muted-foreground">
              Standard shipping takes 5-7 business days. Express shipping is
              available for 2-3 business days delivery.
            </p>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible open={open3} onOpenChange={setOpen3}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                <span className="font-semibold">Do you ship internationally?</span>
              </div>
              <ChevronRight
                className={`h-4 w-4 transition-transform ${
                  open3 ? "rotate-90" : ""
                }`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4">
            <p className="text-sm text-muted-foreground">
              Yes, we ship to over 50 countries worldwide. International shipping
              times vary by location.
            </p>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  },
};

export const NestedCollapsibles: Story = {
  args: {},
  render: () => {
    const [isOpen1, setIsOpen1] = React.useState(false);
    const [isOpen2, setIsOpen2] = React.useState(false);

    return (
      <div className="w-[400px]">
        <Collapsible open={isOpen1} onOpenChange={setIsOpen1} className="space-y-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-4">
              <span className="font-semibold">Main Category</span>
              <ChevronRight
                className={`h-4 w-4 transition-transform ${
                  isOpen1 ? "rotate-90" : ""
                }`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 space-y-2">
            <div className="rounded-md border p-3">
              <p className="text-sm">First item in main category</p>
            </div>

            <Collapsible open={isOpen2} onOpenChange={setIsOpen2} className="space-y-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-3">
                  <span className="text-sm font-medium">Sub Category</span>
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${
                      isOpen2 ? "rotate-90" : ""
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-3 space-y-2">
                <div className="rounded-md border p-2">
                  <p className="text-sm">Nested item 1</p>
                </div>
                <div className="rounded-md border p-2">
                  <p className="text-sm">Nested item 2</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  },
};

export const ControlledState: Story = {
  args: {},
  render: () => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
      <div className="w-[400px] space-y-4">
        <div className="flex gap-2">
          <Button onClick={() => setIsOpen(true)} size="sm">
            Expand
          </Button>
          <Button onClick={() => setIsOpen(false)} size="sm" variant="outline">
            Collapse
          </Button>
        </div>

        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-4">
              <span className="font-semibold">Controlled Collapsible</span>
              <ChevronRight
                className={`h-4 w-4 transition-transform ${
                  isOpen ? "rotate-90" : ""
                }`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 space-y-2">
            <div className="rounded-md border p-4">
              <p className="text-sm text-muted-foreground">
                This collapsible's state is controlled by external buttons.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  },
};

export const SidebarSection: Story = {
  args: {},
  render: () => {
    const [isOpen, setIsOpen] = React.useState(true);

    return (
      <div className="w-[280px] border rounded-lg p-2">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between px-2 py-1.5">
              <span className="text-sm font-semibold">Documentation</span>
              <ChevronRight
                className={`h-4 w-4 transition-transform ${
                  isOpen ? "rotate-90" : ""
                }`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-1">
            <div className="space-y-1">
              <Button variant="ghost" size="sm" className="w-full justify-start px-6">
                Getting Started
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start px-6">
                Installation
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start px-6">
                Components
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start px-6">
                API Reference
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  },
};

export const CodeBlock: Story = {
  args: {},
  render: () => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-[500px] space-y-2"
      >
        <div className="flex items-center justify-between rounded-md border bg-muted px-4 py-2">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            <span className="font-mono text-sm">example.tsx</span>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              {isOpen ? "Hide" : "Show"} code
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="rounded-md border bg-muted p-4 font-mono text-sm">
            <pre className="text-muted-foreground">
              {`import React from 'react';

export function Example() {
  return (
    <div>
      <h1>Hello World</h1>
    </div>
  );
}`}
            </pre>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  },
};

export const ListWithMore: Story = {
  args: {},
  render: () => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
      <div className="w-[350px] space-y-2">
        <h3 className="font-semibold mb-3">Team Members</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 rounded-md border">
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div>
              <p className="font-medium text-sm">Alice Johnson</p>
              <p className="text-xs text-muted-foreground">Product Manager</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-md border">
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div>
              <p className="font-medium text-sm">Bob Smith</p>
              <p className="text-xs text-muted-foreground">Lead Developer</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-md border">
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div>
              <p className="font-medium text-sm">Carol White</p>
              <p className="text-xs text-muted-foreground">Designer</p>
            </div>
          </div>

          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleContent className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-md border">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div>
                  <p className="font-medium text-sm">David Brown</p>
                  <p className="text-xs text-muted-foreground">Developer</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-md border">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div>
                  <p className="font-medium text-sm">Eve Davis</p>
                  <p className="text-xs text-muted-foreground">QA Engineer</p>
                </div>
              </div>
            </CollapsibleContent>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full mt-2">
                {isOpen ? "Show less" : "Show 2 more"}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </div>
    );
  },
};
