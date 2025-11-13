import type { Meta, StoryObj } from "@storybook/react";
import { Progress } from "./progress";
import { useState, useEffect } from "react";

const meta = {
  title: "UI/Progress",
  component: Progress,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: { type: "range", min: 0, max: 100, step: 1 },
    },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 50,
  },
};

export const Empty: Story = {
  args: {
    value: 0,
  },
};

export const Quarter: Story = {
  args: {
    value: 25,
  },
};

export const Half: Story = {
  args: {
    value: 50,
  },
};

export const ThreeQuarters: Story = {
  args: {
    value: 75,
  },
};

export const Complete: Story = {
  args: {
    value: 100,
  },
};

export const Animated = {
  args: {},
  render: () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
      const timer = setTimeout(() => setProgress(66), 500);
      return () => clearTimeout(timer);
    }, []);

    return <Progress value={progress} className="w-[60%]" />;
  },
};

export const WithLabel = {
  args: {},
  render: () => {
    const progress = 45;
    return (
      <div className="w-full space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Uploading...</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <Progress value={progress} />
      </div>
    );
  },
};

export const MultipleSteps = {
  args: {},
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Step 1: Data Extraction</span>
          <span className="text-muted-foreground">100%</span>
        </div>
        <Progress value={100} />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Step 2: Validation</span>
          <span className="text-muted-foreground">60%</span>
        </div>
        <Progress value={60} />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Step 3: Export</span>
          <span className="text-muted-foreground">0%</span>
        </div>
        <Progress value={0} />
      </div>
    </div>
  ),
};

export const AllStates = {
  args: {},
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">0% - Not started</p>
        <Progress value={0} />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">25% - Starting</p>
        <Progress value={25} />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">50% - Half way</p>
        <Progress value={50} />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">75% - Almost done</p>
        <Progress value={75} />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">100% - Complete</p>
        <Progress value={100} />
      </div>
    </div>
  ),
};
