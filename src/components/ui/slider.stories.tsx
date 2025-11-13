import type { Meta, StoryObj } from "@storybook/react";
import { Slider } from "./slider";
import { useState } from "react";
import { Label } from "./label";

const meta = {
  title: "UI/Slider",
  component: Slider,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    defaultValue: {
      control: { type: "object" },
    },
    min: {
      control: { type: "number" },
    },
    max: {
      control: { type: "number" },
    },
    step: {
      control: { type: "number" },
    },
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    defaultValue: [50],
    max: 100,
  },
};

export const WithMinMax: Story = {
  args: {
    defaultValue: [25],
    min: 0,
    max: 100,
    step: 1,
  },
};

export const SmallSteps: Story = {
  args: {
    defaultValue: [5],
    min: 0,
    max: 10,
    step: 0.1,
  },
};

export const LargeSteps: Story = {
  args: {
    defaultValue: [50],
    min: 0,
    max: 100,
    step: 25,
  },
};

export const WithLabel = {
  args: {},
  render: () => {
    const [value, setValue] = useState([50]);
    return (
      <div className="w-full max-w-sm space-y-4">
        <div className="flex justify-between">
          <Label>Volume</Label>
          <span className="text-sm text-muted-foreground">{value[0]}%</span>
        </div>
        <Slider
          value={value}
          onValueChange={setValue}
          max={100}
          step={1}
        />
      </div>
    );
  },
};

export const Range = {
  args: {},
  render: () => {
    const [value, setValue] = useState([20, 80]);
    return (
      <div className="w-full max-w-sm space-y-4">
        <div className="flex justify-between">
          <Label>Price Range</Label>
          <span className="text-sm text-muted-foreground">
            ${value[0]} - ${value[1]}
          </span>
        </div>
        <Slider
          value={value}
          onValueChange={setValue}
          max={100}
          step={1}
          minStepsBetweenThumbs={10}
        />
      </div>
    );
  },
};

export const Disabled: Story = {
  args: {
    defaultValue: [50],
    max: 100,
    disabled: true,
  },
};

export const Temperature = {
  args: {},
  render: () => {
    const [value, setValue] = useState([20]);
    return (
      <div className="w-full max-w-sm space-y-4">
        <div className="flex justify-between items-center">
          <Label>Temperature</Label>
          <span className="text-sm font-medium">{value[0]}°C</span>
        </div>
        <Slider
          value={value}
          onValueChange={setValue}
          min={10}
          max={30}
          step={0.5}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>10°C</span>
          <span>30°C</span>
        </div>
      </div>
    );
  },
};

export const MultipleSettings = {
  args: {},
  render: () => {
    const [brightness, setBrightness] = useState([75]);
    const [contrast, setContrast] = useState([50]);
    const [saturation, setSaturation] = useState([60]);

    return (
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Brightness</Label>
            <span className="text-sm text-muted-foreground">{brightness[0]}%</span>
          </div>
          <Slider value={brightness} onValueChange={setBrightness} max={100} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Contrast</Label>
            <span className="text-sm text-muted-foreground">{contrast[0]}%</span>
          </div>
          <Slider value={contrast} onValueChange={setContrast} max={100} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Saturation</Label>
            <span className="text-sm text-muted-foreground">{saturation[0]}%</span>
          </div>
          <Slider value={saturation} onValueChange={setSaturation} max={100} />
        </div>
      </div>
    );
  },
};

export const AllStates = {
  args: {},
  render: () => (
    <div className="w-full space-y-8">
      <div className="space-y-2">
        <Label>Default (50%)</Label>
        <Slider defaultValue={[50]} max={100} />
      </div>
      <div className="space-y-2">
        <Label>Low (25%)</Label>
        <Slider defaultValue={[25]} max={100} />
      </div>
      <div className="space-y-2">
        <Label>High (75%)</Label>
        <Slider defaultValue={[75]} max={100} />
      </div>
      <div className="space-y-2">
        <Label>Disabled</Label>
        <Slider defaultValue={[50]} max={100} disabled />
      </div>
    </div>
  ),
};
