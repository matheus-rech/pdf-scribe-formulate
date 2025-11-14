import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Checkbox } from "./checkbox";
import {
  Menu,
  Settings,
  User,
  Home,
  FileText,
  ShoppingCart as ShoppingCartIcon,
  Filter,
  Bell,
  X,
  ChevronRight,
} from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

const meta = {
  title: "UI/Sheet",
  component: Sheet,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RightSheet: Story = {
  args: {},
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Right Sheet</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue="Pedro Duarte" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" defaultValue="@peduarte" />
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button type="submit">Save changes</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const LeftSheet: Story = {
  args: {},
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>Navigate to different sections.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-2 py-4">
          <Button variant="ghost" className="justify-start">
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
          <Button variant="ghost" className="justify-start">
            <FileText className="mr-2 h-4 w-4" />
            Documents
          </Button>
          <Button variant="ghost" className="justify-start">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button variant="ghost" className="justify-start">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  ),
};

export const TopSheet: Story = {
  args: {},
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <Bell className="mr-2 h-4 w-4" />
          Notifications
        </Button>
      </SheetTrigger>
      <SheetContent side="top">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>You have 3 unread notifications.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-3 py-4">
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
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button>Mark all as read</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const BottomSheet: Story = {
  args: {},
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Actions</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Actions</SheetTitle>
          <SheetDescription>Choose an action to perform.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-2 py-4">
          <Button variant="outline" className="w-full">
            Share
          </Button>
          <Button variant="outline" className="w-full">
            Download
          </Button>
          <Button variant="outline" className="w-full">
            Delete
          </Button>
          <SheetClose asChild>
            <Button variant="ghost" className="w-full">
              Cancel
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  ),
};

export const NavigationMenu: Story = {
  args: {},
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>Navigate through the application.</SheetDescription>
        </SheetHeader>
        <nav className="grid gap-1 py-4">
          <Button variant="ghost" className="justify-start">
            <Home className="mr-2 h-4 w-4" />
            Dashboard
            <ChevronRight className="ml-auto h-4 w-4" />
          </Button>
          <Button variant="ghost" className="justify-start">
            <FileText className="mr-2 h-4 w-4" />
            Projects
            <ChevronRight className="ml-auto h-4 w-4" />
          </Button>
          <Button variant="ghost" className="justify-start">
            <User className="mr-2 h-4 w-4" />
            Team
            <ChevronRight className="ml-auto h-4 w-4" />
          </Button>
          <Button variant="ghost" className="justify-start">
            <Settings className="mr-2 h-4 w-4" />
            Settings
            <ChevronRight className="ml-auto h-4 w-4" />
          </Button>
        </nav>
        <SheetFooter className="absolute bottom-0 left-0 right-0 p-6 border-t">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-muted-foreground">john@example.com</p>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const FilterPanel: Story = {
  args: {},
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Filter Options</SheetTitle>
          <SheetDescription>
            Customize your view with these filters.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div>
            <h4 className="mb-3 font-medium">Category</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="electronics" />
                <Label htmlFor="electronics">Electronics</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="clothing" />
                <Label htmlFor="clothing">Clothing</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="books" />
                <Label htmlFor="books">Books</Label>
              </div>
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-medium">Price Range</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="under50" />
                <Label htmlFor="under50">Under $50</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="50to100" />
                <Label htmlFor="50to100">$50 - $100</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="over100" />
                <Label htmlFor="over100">Over $100</Label>
              </div>
            </div>
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Clear</Button>
          </SheetClose>
          <SheetClose asChild>
            <Button>Apply Filters</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const UserProfile: Story = {
  args: {},
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <User className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>User Profile</SheetTitle>
          <SheetDescription>View and edit your profile information.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
              <User className="h-10 w-10" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">John Doe</h3>
              <p className="text-sm text-muted-foreground">john@example.com</p>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-name">Name</Label>
            <Input id="profile-name" defaultValue="John Doe" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" type="email" defaultValue="john@example.com" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-bio">Bio</Label>
            <Input
              id="profile-bio"
              defaultValue="Software developer and designer"
            />
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button>Save changes</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const ShoppingCart: Story = {
  args: {},
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <ShoppingCartIcon className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Shopping Cart</SheetTitle>
          <SheetDescription>Review your items before checkout.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-3 py-4">
          <div className="flex gap-3 p-3 rounded-lg border">
            <div className="h-16 w-16 rounded bg-muted" />
            <div className="flex-1">
              <p className="font-medium">Product Name</p>
              <p className="text-sm text-muted-foreground">$29.99</p>
              <p className="text-xs text-muted-foreground">Qty: 1</p>
            </div>
            <Button variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-3 p-3 rounded-lg border">
            <div className="h-16 w-16 rounded bg-muted" />
            <div className="flex-1">
              <p className="font-medium">Another Product</p>
              <p className="text-sm text-muted-foreground">$49.99</p>
              <p className="text-xs text-muted-foreground">Qty: 2</p>
            </div>
            <Button variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>$129.97</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>$10.00</span>
          </div>
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>$139.97</span>
          </div>
        </div>
        <SheetFooter className="mt-4">
          <SheetClose asChild>
            <Button className="w-full">Proceed to Checkout</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const AllSides: Story = {
  args: {},
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Top</Button>
        </SheetTrigger>
        <SheetContent side="top">
          <SheetHeader>
            <SheetTitle>Top Sheet</SheetTitle>
            <SheetDescription>This sheet slides from the top.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Right</Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Right Sheet</SheetTitle>
            <SheetDescription>This sheet slides from the right.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Bottom</Button>
        </SheetTrigger>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Bottom Sheet</SheetTitle>
            <SheetDescription>This sheet slides from the bottom.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Left</Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Left Sheet</SheetTitle>
            <SheetDescription>This sheet slides from the left.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  ),
};
