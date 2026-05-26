"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export type PasswordFieldProps = Omit<React.ComponentProps<"input">, "type">;

const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ className, disabled, ...props }, forwardedRef) => {
    const [visible, setVisible] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    // Captured at the moment the user clicks the toggle — BEFORE setVisible
    // triggers a re-render that swaps the input `type`. Swapping `type` on
    // an <input> causes the browser to collapse the selection to position 0
    // and (depending on the platform) drop focus, so we have to read these
    // values up front and restore them after the swap.
    const savedSelection = React.useRef<{
      start: number | null;
      end: number | null;
      focused: boolean;
    } | null>(null);

    // Merge the internal ref with whatever ref the parent passes in, so the
    // forwardRef API stays exactly as it was for callers.
    const setRefs = React.useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }
      },
      [forwardedRef]
    );

    // useLayoutEffect (not useEffect) so the restoration happens before the
    // browser paints the swapped input — avoids a visible cursor flicker.
    React.useLayoutEffect(() => {
      const saved = savedSelection.current;
      const input = inputRef.current;
      if (!saved || !input) return;

      if (saved.focused) {
        input.focus();
      }
      if (saved.start !== null && saved.end !== null) {
        try {
          input.setSelectionRange(saved.start, saved.end);
        } catch {
          // Some input types throw on setSelectionRange; password/text don't.
        }
      }
      savedSelection.current = null;
    }, [visible]);

    const handleToggle = () => {
      const input = inputRef.current;
      if (input) {
        savedSelection.current = {
          start: input.selectionStart,
          end: input.selectionEnd,
          focused: document.activeElement === input,
        };
      }
      setVisible((v) => !v);
    };

    return (
      <div className="relative w-full">
        <Input
          ref={setRefs}
          type={visible ? "text" : "password"}
          disabled={disabled}
          className={cn("pr-10", className)}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleToggle}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:opacity-40 disabled:pointer-events-none"
        >
          {visible ? (
            <EyeOff size={18} className="transition-all" />
          ) : (
            <Eye size={18} className="transition-all" />
          )}
        </button>
      </div>
    );
  }
);
PasswordField.displayName = "PasswordField";

export { PasswordField };
