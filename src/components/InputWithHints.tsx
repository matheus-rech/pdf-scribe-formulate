import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useFieldHints } from "@/hooks/useFieldHints";
import { FieldHintDropdown } from "./FieldHintDropdown";

interface InputWithHintsProps extends React.ComponentProps<typeof Input> {
  fieldName: string;
  pdfText?: string;
  onValueChange?: (value: string) => void;
  enableHints?: boolean;
}

export const InputWithHints = ({
  fieldName,
  pdfText = "",
  onValueChange,
  enableHints = true,
  value,
  onChange,
  ...props
}: InputWithHintsProps) => {
  const [showHints, setShowHints] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);
  
  const { hints, isLoading, clearHints } = useFieldHints({
    fieldName,
    currentValue: (value as string) || "",
    pdfText,
    enabled: enableHints && isFocused
  });

  useEffect(() => {
    setShowHints(isFocused && (hints.length > 0 || isLoading));
  }, [hints.length, isLoading, isFocused]);

  const handleSelectHint = (hint: any) => {
    if (onValueChange) {
      onValueChange(hint.suggestion);
    }
    if (onChange) {
      onChange({ target: { value: hint.suggestion } } as any);
    }
    clearHints();
    setShowHints(false);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Delay to allow hint selection
    setTimeout(() => {
      setIsFocused(false);
      setShowHints(false);
    }, 200);
    props.onBlur?.(e);
  };

  return (
    <div ref={inputRef} className="relative">
      <Input
        {...props}
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {showHints && (
        <FieldHintDropdown
          hints={hints}
          isLoading={isLoading}
          onSelectHint={handleSelectHint}
        />
      )}
    </div>
  );
};
