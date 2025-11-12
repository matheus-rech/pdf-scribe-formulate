import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ExtractButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
  fieldCount?: number;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
}

export const ExtractButton = ({
  onClick,
  isLoading,
  disabled = false,
  fieldCount,
  variant = "outline",
  size = "sm",
  className,
  children
}: ExtractButtonProps) => {
  const buttonContent = (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Extracting...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          {children || "Extract with AI"}
        </>
      )}
    </Button>
  );

  if (fieldCount !== undefined && !disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {buttonContent}
          </TooltipTrigger>
          <TooltipContent>
            <p>Extract {fieldCount} field{fieldCount !== 1 ? 's' : ''} using AI</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return buttonContent;
};
