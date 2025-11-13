import type { Meta, StoryObj } from "@storybook/react";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "./context-menu";

const meta = {
  title: "UI/ContextMenu",
  component: ContextMenu,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {
  args: {},
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm">
        Right click here
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem inset>
          Back
          <ContextMenuShortcut>⌘[</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem inset disabled>
          Forward
          <ContextMenuShortcut>⌘]</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem inset>
          Reload
          <ContextMenuShortcut>⌘R</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem inset>
          More Tools
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

export const WithSubmenus = {
  args: {},
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm">
        Right click here
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem>
          Open
          <ContextMenuShortcut>⌘O</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          Save
          <ContextMenuShortcut>⌘S</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>Share</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem>Email</ContextMenuItem>
            <ContextMenuItem>Messages</ContextMenuItem>
            <ContextMenuItem>Notes</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem>
          Print
          <ContextMenuShortcut>⌘P</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

export const WithCheckboxes = {
  args: {},
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm">
        Right click here
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuLabel>View Options</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem checked>
          Show Sidebar
        </ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem checked>
          Show Toolbar
        </ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem>
          Show Minimap
        </ContextMenuCheckboxItem>
        <ContextMenuSeparator />
        <ContextMenuItem>Reset View</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

export const WithRadioGroup = {
  args: {},
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm">
        Right click here
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuLabel>Text Size</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuRadioGroup value="normal">
          <ContextMenuRadioItem value="small">Small</ContextMenuRadioItem>
          <ContextMenuRadioItem value="normal">Normal</ContextMenuRadioItem>
          <ContextMenuRadioItem value="large">Large</ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

export const FileOperations = {
  args: {},
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-[200px] w-[350px] items-center justify-center rounded-md border bg-muted/20 text-sm">
        Right click on this document
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem>Open</ContextMenuItem>
        <ContextMenuItem>Open in New Tab</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>Open With</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem>PDF Reader</ContextMenuItem>
            <ContextMenuItem>Text Editor</ContextMenuItem>
            <ContextMenuItem>Browser</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem>Rename</ContextMenuItem>
        <ContextMenuItem>Duplicate</ContextMenuItem>
        <ContextMenuItem>Download</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-destructive">
          Delete
          <ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

export const EditOperations = {
  args: {},
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-[200px] w-[350px] items-center justify-center rounded-md border text-sm">
        <div className="p-4">
          Right click on this text to see edit options. This is a sample
          paragraph that demonstrates context menu functionality for text
          editing operations.
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem>
          Cut
          <ContextMenuShortcut>⌘X</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          Copy
          <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          Paste
          <ContextMenuShortcut>⌘V</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>Format</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem>Bold</ContextMenuItem>
            <ContextMenuItem>Italic</ContextMenuItem>
            <ContextMenuItem>Underline</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>Clear Formatting</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem>Select All</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

export const ImageOperations = {
  args: {},
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-[200px] w-[300px] items-center justify-center rounded-md border bg-muted text-sm">
        Right click on image
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem>View Full Size</ContextMenuItem>
        <ContextMenuItem>Download Image</ContextMenuItem>
        <ContextMenuItem>Copy Image</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>Edit</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem>Rotate Left</ContextMenuItem>
            <ContextMenuItem>Rotate Right</ContextMenuItem>
            <ContextMenuItem>Flip Horizontal</ContextMenuItem>
            <ContextMenuItem>Flip Vertical</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem>Set as Cover</ContextMenuItem>
        <ContextMenuItem className="text-destructive">Remove</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

export const TableOperations = {
  args: {},
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-2 text-left text-sm font-medium">Name</th>
                <th className="p-2 text-left text-sm font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2 text-sm">Study 1</td>
                <td className="p-2 text-sm">Active</td>
              </tr>
              <tr>
                <td className="p-2 text-sm">Study 2</td>
                <td className="p-2 text-sm">Completed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuLabel>Row Actions</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem>Edit Row</ContextMenuItem>
        <ContextMenuItem>Duplicate Row</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>Insert</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem>Row Above</ContextMenuItem>
            <ContextMenuItem>Row Below</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-destructive">Delete Row</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};
