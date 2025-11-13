import type { Meta, StoryObj } from "@storybook/react";
import { Switch } from "./switch";
import { Label } from "./label";

const meta = {
  title: "UI/Switch",
  component: Switch,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    disabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    defaultChecked: true,
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane Mode</Label>
    </div>
  ),
};

export const SettingsExample: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="notifications" className="flex flex-col space-y-1">
          <span>Notifications</span>
          <span className="text-xs font-normal text-muted-foreground">
            Receive notifications about your account
          </span>
        </Label>
        <Switch id="notifications" defaultChecked />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="marketing" className="flex flex-col space-y-1">
          <span>Marketing emails</span>
          <span className="text-xs font-normal text-muted-foreground">
            Receive emails about new products and features
          </span>
        </Label>
        <Switch id="marketing" />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="security" className="flex flex-col space-y-1">
          <span>Security alerts</span>
          <span className="text-xs font-normal text-muted-foreground">
            Get notified about security updates
          </span>
        </Label>
        <Switch id="security" defaultChecked disabled />
      </div>
    </div>
  ),
};
