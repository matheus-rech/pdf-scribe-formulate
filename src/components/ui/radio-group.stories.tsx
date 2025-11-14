import type { Meta, StoryObj } from "@storybook/react";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Label } from "./label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";

const meta = {
  title: "UI/RadioGroup",
  component: RadioGroup,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {
  args: {},
  render: () => (
    <RadioGroup defaultValue="option-one">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-one" id="option-one" />
        <Label htmlFor="option-one">Option One</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-two" id="option-two" />
        <Label htmlFor="option-two">Option Two</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-three" id="option-three" />
        <Label htmlFor="option-three">Option Three</Label>
      </div>
    </RadioGroup>
  ),
};

export const WithDescriptions = {
  args: {},
  render: () => (
    <RadioGroup defaultValue="comfortable">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="default" id="r1" />
        <div className="grid gap-1.5 leading-none">
          <Label htmlFor="r1">Default</Label>
          <p className="text-sm text-muted-foreground">
            Use the default settings
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="comfortable" id="r2" />
        <div className="grid gap-1.5 leading-none">
          <Label htmlFor="r2">Comfortable</Label>
          <p className="text-sm text-muted-foreground">
            More padding and spacing
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="compact" id="r3" />
        <div className="grid gap-1.5 leading-none">
          <Label htmlFor="r3">Compact</Label>
          <p className="text-sm text-muted-foreground">
            Less padding and spacing
          </p>
        </div>
      </div>
    </RadioGroup>
  ),
};

export const Disabled = {
  args: {},
  render: () => (
    <RadioGroup defaultValue="option-one">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-one" id="d1" />
        <Label htmlFor="d1">Enabled Option</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-two" id="d2" disabled />
        <Label htmlFor="d2" className="text-muted-foreground">
          Disabled Option
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-three" id="d3" />
        <Label htmlFor="d3">Another Enabled Option</Label>
      </div>
    </RadioGroup>
  ),
};

export const PaymentMethod = {
  args: {},
  render: () => (
    <div className="w-[400px]">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Payment Method</h3>
        <RadioGroup defaultValue="card">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="card" id="card" />
            <Label htmlFor="card" className="flex items-center gap-2">
              <span>💳</span>
              <span>Credit Card</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="paypal" id="paypal" />
            <Label htmlFor="paypal" className="flex items-center gap-2">
              <span>🅿️</span>
              <span>PayPal</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="apple" id="apple" />
            <Label htmlFor="apple" className="flex items-center gap-2">
              <span>🍎</span>
              <span>Apple Pay</span>
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  ),
};

export const WithCards = {
  args: {},
  render: () => (
    <RadioGroup defaultValue="free" className="grid gap-4">
      <div>
        <RadioGroupItem value="free" id="free" className="peer sr-only" />
        <Label
          htmlFor="free"
          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
        >
          <CardTitle className="text-base mb-2">Free</CardTitle>
          <CardDescription className="text-center">
            Perfect for personal use
          </CardDescription>
          <div className="mt-4 text-2xl font-bold">$0</div>
        </Label>
      </div>
      <div>
        <RadioGroupItem value="pro" id="pro" className="peer sr-only" />
        <Label
          htmlFor="pro"
          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
        >
          <CardTitle className="text-base mb-2">Pro</CardTitle>
          <CardDescription className="text-center">
            For professional researchers
          </CardDescription>
          <div className="mt-4 text-2xl font-bold">$29</div>
        </Label>
      </div>
      <div>
        <RadioGroupItem value="enterprise" id="enterprise" className="peer sr-only" />
        <Label
          htmlFor="enterprise"
          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
        >
          <CardTitle className="text-base mb-2">Enterprise</CardTitle>
          <CardDescription className="text-center">
            For large teams
          </CardDescription>
          <div className="mt-4 text-2xl font-bold">$99</div>
        </Label>
      </div>
    </RadioGroup>
  ),
};

export const NotificationSettings = {
  args: {},
  render: () => (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Notification Frequency</CardTitle>
        <CardDescription>
          Choose how often you want to receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup defaultValue="realtime">
          <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent">
            <RadioGroupItem value="realtime" id="realtime" />
            <div className="flex-1">
              <Label htmlFor="realtime" className="font-medium cursor-pointer">
                Real-time
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified immediately
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent">
            <RadioGroupItem value="hourly" id="hourly" />
            <div className="flex-1">
              <Label htmlFor="hourly" className="font-medium cursor-pointer">
                Hourly
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive a digest every hour
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent">
            <RadioGroupItem value="daily" id="daily" />
            <div className="flex-1">
              <Label htmlFor="daily" className="font-medium cursor-pointer">
                Daily
              </Label>
              <p className="text-sm text-muted-foreground">
                Get a daily summary
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent">
            <RadioGroupItem value="never" id="never" />
            <div className="flex-1">
              <Label htmlFor="never" className="font-medium cursor-pointer">
                Never
              </Label>
              <p className="text-sm text-muted-foreground">
                No notifications
              </p>
            </div>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  ),
};

export const InForm = {
  args: {},
  render: () => (
    <div className="w-[400px] space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Account Type</h3>
          <p className="text-sm text-muted-foreground">
            Select your account type
          </p>
        </div>
        <RadioGroup defaultValue="individual">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="individual" id="individual" />
            <Label htmlFor="individual">Individual</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="organization" id="organization" />
            <Label htmlFor="organization">Organization</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="educational" id="educational" />
            <Label htmlFor="educational">Educational Institution</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  ),
};
