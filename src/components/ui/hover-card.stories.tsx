import type { Meta, StoryObj } from "@storybook/react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";
import { Button } from "./button";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { CalendarDays, MapPin } from "lucide-react";

const meta = {
  title: "UI/HoverCard",
  component: HoverCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {
  args: {},
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">@username</Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex justify-between space-x-4">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>UN</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">@username</h4>
            <p className="text-sm text-muted-foreground">
              The React Framework – created and maintained by @vercel.
            </p>
            <div className="flex items-center pt-2">
              <CalendarDays className="mr-2 h-4 w-4 opacity-70" />
              <span className="text-xs text-muted-foreground">
                Joined December 2021
              </span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const UserProfile = {
  args: {},
  render: () => (
    <div className="text-sm">
      Hover over{" "}
      <HoverCard>
        <HoverCardTrigger asChild>
          <span className="font-medium underline cursor-pointer">@john_doe</span>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="flex gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="space-y-1 flex-1">
              <h4 className="text-sm font-semibold">John Doe</h4>
              <p className="text-sm text-muted-foreground">
                Senior Developer at Tech Corp
              </p>
              <div className="flex items-center pt-2 text-xs text-muted-foreground">
                <MapPin className="mr-1 h-3 w-3" />
                San Francisco, CA
              </div>
              <div className="flex gap-2 pt-2">
                <div className="text-xs">
                  <span className="font-semibold">1.2k</span> followers
                </div>
                <div className="text-xs">
                  <span className="font-semibold">420</span> following
                </div>
              </div>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
      {" "}to see their profile.
    </div>
  ),
};

export const LinkPreview = {
  args: {},
  render: () => (
    <div className="text-sm max-w-md">
      Check out this article:{" "}
      <HoverCard>
        <HoverCardTrigger asChild>
          <a href="#" className="font-medium text-primary underline">
            Understanding React Hooks
          </a>
        </HoverCardTrigger>
        <HoverCardContent className="w-96">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Understanding React Hooks</h4>
            <p className="text-xs text-muted-foreground">
              A comprehensive guide to using React Hooks in your applications.
              Learn about useState, useEffect, and custom hooks with practical
              examples.
            </p>
            <div className="flex items-center text-xs text-muted-foreground pt-2">
              <span>example.com</span>
              <span className="mx-2">•</span>
              <span>5 min read</span>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  ),
};

export const QuickInfo = {
  args: {},
  render: () => (
    <div className="text-sm">
      The{" "}
      <HoverCard>
        <HoverCardTrigger asChild>
          <span className="font-medium underline decoration-dotted cursor-help">
            PICOT framework
          </span>
        </HoverCardTrigger>
        <HoverCardContent>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">PICOT Framework</h4>
            <p className="text-xs text-muted-foreground">
              A format for developing a clinical question that includes:
            </p>
            <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
              <li>P - Population/Patient</li>
              <li>I - Intervention</li>
              <li>C - Comparison</li>
              <li>O - Outcome</li>
              <li>T - Time frame</li>
            </ul>
          </div>
        </HoverCardContent>
      </HoverCard>
      {" "}is used in systematic reviews.
    </div>
  ),
};

export const ProductCard = {
  args: {},
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="outline">View Product</Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-3">
          <div className="h-40 bg-muted rounded-md flex items-center justify-center">
            <span className="text-muted-foreground">Product Image</span>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">Premium Product Name</h4>
            <p className="text-xs text-muted-foreground">
              High-quality product with exceptional features and benefits.
            </p>
            <div className="flex items-center justify-between pt-2">
              <span className="text-lg font-bold">$99.99</span>
              <Button size="sm">Add to Cart</Button>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const TeamMember = {
  args: {},
  render: () => (
    <div className="flex gap-2">
      {["Alice", "Bob", "Carol"].map((name) => (
        <HoverCard key={name}>
          <HoverCardTrigger asChild>
            <Avatar className="cursor-pointer">
              <AvatarFallback>{name[0]}</AvatarFallback>
            </Avatar>
          </HoverCardTrigger>
          <HoverCardContent>
            <div className="flex gap-3">
              <Avatar>
                <AvatarFallback>{name[0]}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">{name}</h4>
                <p className="text-xs text-muted-foreground">
                  Team member • Active now
                </p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      ))}
    </div>
  ),
};

export const Statistics = {
  args: {},
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Hover over metrics for details</p>
      <div className="flex gap-6">
        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="cursor-pointer">
              <div className="text-2xl font-bold">1,234</div>
              <div className="text-xs text-muted-foreground">Total Studies</div>
            </div>
          </HoverCardTrigger>
          <HoverCardContent>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Total Studies</h4>
              <p className="text-xs text-muted-foreground">
                This includes all studies created in your workspace across all
                projects and team members.
              </p>
            </div>
          </HoverCardContent>
        </HoverCard>

        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="cursor-pointer">
              <div className="text-2xl font-bold">89</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
          </HoverCardTrigger>
          <HoverCardContent>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Active Studies</h4>
              <p className="text-xs text-muted-foreground">
                Studies that are currently being worked on by team members.
              </p>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
    </div>
  ),
};

export const Alignment = {
  args: {},
  render: () => (
    <div className="flex gap-4">
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="outline">Start</Button>
        </HoverCardTrigger>
        <HoverCardContent align="start">
          <p className="text-sm">Aligned to start</p>
        </HoverCardContent>
      </HoverCard>

      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="outline">End</Button>
        </HoverCardTrigger>
        <HoverCardContent align="end">
          <p className="text-sm">Aligned to end</p>
        </HoverCardContent>
      </HoverCard>
    </div>
  ),
};
