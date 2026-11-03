"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectOption = { value: string; label: string; disabled?: boolean };
type SelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  "aria-label": string;
  id?: string;
  name?: string;
  className?: string;
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
};

export default function Select({
  value,
  onValueChange,
  options,
  id,
  name,
  className,
  placeholder = "Choose an option…",
  emptyLabel = "No options available",
  disabled,
  "aria-label": label,
}: SelectProps) {
  const unavailable = options.every((option) => option.disabled);
  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      name={name}
      disabled={disabled || unavailable}
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-label={label}
        className={cn("dropdown-trigger", className)}
      >
        <span className="min-w-0 flex-1 truncate text-left">
          <SelectPrimitive.Value
            placeholder={unavailable ? emptyLabel : placeholder}
          />
        </span>
        <SelectPrimitive.Icon className="dropdown-chevron">
          <ChevronDown size={16} aria-hidden="true" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={8}
          collisionPadding={12}
          className="dropdown-content"
        >
          <SelectPrimitive.ScrollUpButton className="dropdown-scroll">
            <ChevronUp size={16} aria-hidden="true" />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                textValue={option.label}
                title={option.label}
                className="dropdown-option"
              >
                <span className="min-w-0 flex-1 truncate">
                  <SelectPrimitive.ItemText>
                    {option.label}
                  </SelectPrimitive.ItemText>
                </span>
                <SelectPrimitive.ItemIndicator className="shrink-0">
                  <Check size={16} aria-hidden="true" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="dropdown-scroll">
            <ChevronDown size={16} aria-hidden="true" />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
