import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Switch } from "./switch";
import { Bell, Settings, User } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer";

const meta = {
  title: "UI/Drawer",
  component: Drawer,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Open Drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Are you absolutely sure?</DrawerTitle>
          <DrawerDescription>This action cannot be undone.</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button>Submit</Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const WithForm: Story = {
  args: {},
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Edit Profile</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Edit profile</DrawerTitle>
          <DrawerDescription>
            Make changes to your profile here. Click save when you're done.
          </DrawerDescription>
        </DrawerHeader>
        <div className="grid gap-4 p-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue="Pedro Duarte" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" defaultValue="@peduarte" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue="pedro@example.com" />
          </div>
        </div>
        <DrawerFooter>
          <Button>Save changes</Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const NotificationDrawer: Story = {
  args: {},
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Notifications</DrawerTitle>
          <DrawerDescription>You have 3 unread messages.</DrawerDescription>
        </DrawerHeader>
        <div className="p-4 space-y-4">
          <div className="flex gap-3 p-3 rounded-lg border">
            <User className="h-5 w-5 mt-0.5" />
            <div>
              <p className="font-medium">New follower</p>
              <p className="text-sm text-muted-foreground">
                John Doe started following you
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-3 rounded-lg border">
            <Bell className="h-5 w-5 mt-0.5" />
            <div>
              <p className="font-medium">New message</p>
              <p className="text-sm text-muted-foreground">
                You have a new message from Jane
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-3 rounded-lg border">
            <Settings className="h-5 w-5 mt-0.5" />
            <div>
              <p className="font-medium">Update available</p>
              <p className="text-sm text-muted-foreground">
                A new version is ready to install
              </p>
            </div>
          </div>
        </div>
        <DrawerFooter>
          <Button>Mark all as read</Button>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const SettingsPanel: Story = {
  args: {},
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Settings</DrawerTitle>
          <DrawerDescription>
            Manage your application preferences.
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive push notifications
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Dark mode</p>
              <p className="text-sm text-muted-foreground">
                Use dark color scheme
              </p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-save</p>
              <p className="text-sm text-muted-foreground">
                Automatically save changes
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button>Done</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const NestedContent: Story = {
  args: {},
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">View Details</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Project Details</DrawerTitle>
          <DrawerDescription>View project information and settings.</DrawerDescription>
        </DrawerHeader>
        <div className="p-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <div className="p-4 rounded-lg border">
                <h4 className="font-semibold mb-2">Project Name</h4>
                <p className="text-sm text-muted-foreground">
                  A comprehensive project management solution
                </p>
              </div>
            </TabsContent>
            <TabsContent value="team" className="space-y-4">
              <div className="p-4 rounded-lg border">
                <h4 className="font-semibold mb-2">Team Members</h4>
                <p className="text-sm text-muted-foreground">5 active members</p>
              </div>
            </TabsContent>
            <TabsContent value="settings" className="space-y-4">
              <div className="p-4 rounded-lg border">
                <h4 className="font-semibold mb-2">Project Settings</h4>
                <p className="text-sm text-muted-foreground">
                  Configure project preferences
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const WithoutHandle: Story = {
  args: {},
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Open Custom Drawer</Button>
      </DrawerTrigger>
      <DrawerContent className="[&>div:first-child]:hidden">
        <DrawerHeader>
          <DrawerTitle>Custom Drawer</DrawerTitle>
          <DrawerDescription>
            This drawer has no drag handle for a cleaner look.
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4">
          <p className="text-sm text-muted-foreground">
            Content without the drag handle at the top.
          </p>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button>Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const LargeContent: Story = {
  args: {},
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">View Terms</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Terms and Conditions</DrawerTitle>
          <DrawerDescription>
            Please review our terms and conditions carefully.
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Introduction</h3>
              <p className="text-sm text-muted-foreground">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">2. User Agreement</h3>
              <p className="text-sm text-muted-foreground">
                Ut enim ad minim veniam, quis nostrud exercitation ullamco
                laboris nisi ut aliquip ex ea commodo consequat.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">3. Privacy Policy</h3>
              <p className="text-sm text-muted-foreground">
                Duis aute irure dolor in reprehenderit in voluptate velit esse
                cillum dolore eu fugiat nulla pariatur.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">4. Data Collection</h3>
              <p className="text-sm text-muted-foreground">
                Excepteur sint occaecat cupidatat non proident, sunt in culpa
                qui officia deserunt mollit anim id est laborum.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">5. Cookie Policy</h3>
              <p className="text-sm text-muted-foreground">
                Sed ut perspiciatis unde omnis iste natus error sit voluptatem
                accusantium doloremque laudantium.
              </p>
            </div>
          </div>
        </div>
        <DrawerFooter>
          <Button>Accept</Button>
          <DrawerClose asChild>
            <Button variant="outline">Decline</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const WithFooterActions: Story = {
  args: {},
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Create New</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Create new item</DrawerTitle>
          <DrawerDescription>
            Fill in the details to create a new item.
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4 space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="item-name">Item Name</Label>
            <Input id="item-name" placeholder="Enter item name" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" placeholder="Enter description" />
          </div>
        </div>
        <DrawerFooter className="flex-row gap-2">
          <Button className="flex-1">Create</Button>
          <DrawerClose asChild>
            <Button variant="outline" className="flex-1">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};
