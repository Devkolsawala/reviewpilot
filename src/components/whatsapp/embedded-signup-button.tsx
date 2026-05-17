"use client";

/**
 * WhatsApp Embedded Signup primitives.
 *
 * This module exposes three pieces so the v3a pre-flight wizard can drive
 * the PIN gate from the page level (the wizard *cannot* host the PIN
 * modal — see comment on `EmbeddedSignupButton` below for the bug we hit
 * before):
 *
 *  1. `WhatsAppPinModal` — controlled PIN-collection dialog.
 *  2. `EmbeddedSignupTrigger` — headless component that loads the FB SDK
 *     and fires `FB.login(...)` on mount with a provided PIN.
 *  3. `EmbeddedSignupButton` — the legacy all-in-one button kept for the
 *     dormant `WhatsAppMethodChooser` path in ConnectionWizard. It is a
 *     thin composition of the two pieces above.
 *
 * Splitting these out means the parent page can mount the PIN modal and
 * trigger OUTSIDE the wizard's Radix Portal subtree, so closing the
 * wizard never unmounts them.
 */

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";

// ---------------------------------------------------------------------------
// FB SDK types
// ---------------------------------------------------------------------------

interface FBSDK {
  init: (opts: Record<string, unknown>) => void;
  login: (
    cb: (response: { authResponse?: { code?: string } }) => void,
    opts: Record<string, unknown>
  ) => void;
}

declare global {
  interface Window {
    FB?: FBSDK;
    fbAsyncInit?: () => void;
  }
}

const PIN_KEY = "ess_phone_pin";
const SESSION_KEY = "ess_session_info";

// ---------------------------------------------------------------------------
// Shared hooks
// ---------------------------------------------------------------------------

/**
 * Idempotently loads the Facebook JSSDK and initializes it once. Returns
 * `true` when `window.FB` is ready to use. Exported so the pre-flight
 * wizard can warm-load the SDK while the user is still completing earlier
 * steps — by the time they submit the PIN, FB.login() can fire instantly
 * instead of showing a "Loading Facebook…" spinner.
 */
export function useFacebookSdk(): boolean {
  const [sdkLoaded, setSdkLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.FB) {
      setSdkLoaded(true);
      return;
    }

    window.fbAsyncInit = function () {
      if (!window.FB) return;
      window.FB.init({
        appId: process.env.NEXT_PUBLIC_FB_APP_ID,
        autoLogAppEvents: true,
        xfbml: true,
        version: process.env.NEXT_PUBLIC_FB_GRAPH_VERSION || "v21.0",
      });
      setSdkLoaded(true);
    };

    if (!document.getElementById("facebook-jssdk")) {
      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      document.body.appendChild(script);
    }
  }, []);

  return sdkLoaded;
}

/**
 * Subscribes to Meta's `WA_EMBEDDED_SIGNUP` postMessage events for the
 * lifetime of the host component and stores the latest payload in
 * sessionStorage so the OAuth callback POST can include it.
 */
function useSessionInfoListener(): void {
  useEffect(() => {
    if (typeof window === "undefined") return;

    function sessionInfoListener(event: MessageEvent) {
      if (
        event.origin !== "https://www.facebook.com" &&
        event.origin !== "https://web.facebook.com"
      ) {
        return;
      }
      try {
        const data = JSON.parse(event.data);
        if (data.type === "WA_EMBEDDED_SIGNUP") {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
        }
      } catch {
        // Not our message; ignore.
      }
    }

    window.addEventListener("message", sessionInfoListener);
    return () => window.removeEventListener("message", sessionInfoListener);
  }, []);
}

// ---------------------------------------------------------------------------
// WhatsAppPinModal — controlled PIN-collection dialog
// ---------------------------------------------------------------------------

export interface WhatsAppPinModalProps {
  open: boolean;
  /**
   * Fired when the user submits a valid 6-digit PIN (both fields match).
   * The plaintext PIN is passed to the parent; the parent is responsible
   * for handing it to `EmbeddedSignupTrigger`.
   */
  onPinSet: (pin: string) => void;
  /**
   * Fired when the user explicitly clicks the "Cancel" button. The v3a
   * wizard treats this as "go back to wizard Step 5".
   */
  onCancel: () => void;
  /**
   * Fired when the user dismisses the dialog without explicit intent —
   * Esc, outside-click, or the X close button. The v3a wizard treats
   * this as full-cancellation (close everything).
   */
  onClose: () => void;
}

export function WhatsAppPinModal({
  open,
  onPinSet,
  onCancel,
  onClose,
}: WhatsAppPinModalProps) {
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  // Reset fields whenever the modal is (re)opened so a previous attempt
  // doesn't leak its state into the next try.
  useEffect(() => {
    if (open) {
      setPin("");
      setPinConfirm("");
      setPinError(null);
      setShowPin(false);
      setShowConfirmPin(false);
    }
  }, [open]);

  const pinsValid =
    /^\d{6}$/.test(pin) && /^\d{6}$/.test(pinConfirm) && pin === pinConfirm;
  const showMismatch =
    pin.length > 0 && pinConfirm.length > 0 && pin !== pinConfirm;

  function submitPin() {
    if (!/^\d{6}$/.test(pin)) {
      setPinError("PIN must be exactly 6 digits.");
      return;
    }
    if (pin !== pinConfirm) {
      setPinError("PINs do not match.");
      return;
    }
    onPinSet(pin);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set a 6-digit phone re-registration PIN</DialogTitle>
          <DialogDescription>
            This PIN is required by WhatsApp if your phone needs to verify
            the number again. Save it somewhere safe — you&apos;ll need it
            for recovery.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ess-pin">PIN (6 digits)</Label>
            <div className="relative">
              <Input
                id="ess-pin"
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                autoComplete="off"
                autoFocus
                value={pin}
                onChange={(e) =>
                  setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="••••••"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPin((v) => !v)}
                aria-label={showPin ? "Hide PIN" : "Show PIN"}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
              >
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Choose any 6 digits you&apos;ll remember
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ess-pin-confirm">Confirm PIN</Label>
            <div className="relative">
              <Input
                id="ess-pin-confirm"
                type={showConfirmPin ? "text" : "password"}
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                autoComplete="off"
                value={pinConfirm}
                onChange={(e) =>
                  setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="••••••"
                className="pr-10"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && pinsValid) submitPin();
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPin((v) => !v)}
                aria-label={showConfirmPin ? "Hide PIN" : "Show PIN"}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
              >
                {showConfirmPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {showMismatch && !pinError && (
            <p className="text-xs text-destructive">PINs do not match.</p>
          )}
          {pinError && (
            <p className="text-xs text-destructive">{pinError}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={submitPin} disabled={!pinsValid}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// EmbeddedSignupTrigger — headless: fires FB.login() once on mount
// ---------------------------------------------------------------------------

export interface EmbeddedSignupTriggerProps {
  /**
   * The 6-digit PIN already validated by `WhatsAppPinModal`. Written to
   * sessionStorage and forwarded to the OAuth callback POST.
   */
  pin: string;
  /**
   * The user closed the Facebook popup without authorizing. The parent
   * should reset its flow state back to "closed" (or wherever makes
   * sense).
   */
  onCancel: () => void;
  /**
   * The OAuth callback POST returned a non-success payload, or the
   * network request itself failed. Parent decides what to surface to the
   * user (the trigger does not toast itself).
   */
  onError: (err: string) => void;
}

export function EmbeddedSignupTrigger({
  pin,
  onCancel,
  onError,
}: EmbeddedSignupTriggerProps) {
  const sdkLoaded = useFacebookSdk();
  useSessionInfoListener();

  const [isProcessing, setIsProcessing] = useState(false);
  // Single-fire guard so React 18 strict-mode double-invocations don't
  // open two FB popups.
  const launchedRef = useRef(false);

  useEffect(() => {
    if (!sdkLoaded || launchedRef.current) return;
    if (typeof window === "undefined" || !window.FB) return;

    launchedRef.current = true;

    // Stash the plaintext PIN in sessionStorage. The OAuth callback POST
    // below reads it back, and the server encrypts it before persisting
    // to phone_pin_encrypted using the same scheme as access tokens.
    // sessionStorage is acceptable here because the value lives only for
    // the brief window between this assignment and the POST below.
    sessionStorage.setItem(PIN_KEY, pin);

    window.FB.login(
      function (response) {
        if (response.authResponse?.code) {
          setIsProcessing(true);
          const sessionInfo = sessionStorage.getItem(SESSION_KEY);
          const storedPin = sessionStorage.getItem(PIN_KEY);
          fetch("/api/whatsapp/oauth/callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: response.authResponse.code,
              session_info: sessionInfo ? JSON.parse(sessionInfo) : null,
              pin: storedPin || null,
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              // Clear PIN + session info regardless of outcome — these
              // must not linger in sessionStorage after the callback POST.
              sessionStorage.removeItem(PIN_KEY);
              sessionStorage.removeItem(SESSION_KEY);
              if (data.success) {
                // Full page navigation — the connections list is a
                // client component with hook-cached state, so a soft
                // router push would not show the new row.
                window.location.assign(
                  "/dashboard/settings/connections?connected=whatsapp"
                );
              } else {
                setIsProcessing(false);
                onError(data.error || "Unknown error");
              }
            })
            .catch((err: unknown) => {
              sessionStorage.removeItem(PIN_KEY);
              sessionStorage.removeItem(SESSION_KEY);
              setIsProcessing(false);
              onError(err instanceof Error ? err.message : String(err));
            });
        } else {
          // User canceled / denied — discard the unused PIN.
          sessionStorage.removeItem(PIN_KEY);
          onCancel();
        }
      },
      {
        config_id: process.env.NEXT_PUBLIC_FB_CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: "",
          sessionInfoVersion: "3",
        },
      }
    );
    // We intentionally do not depend on onCancel / onError — they are
    // captured once at launch time. Re-running this effect would risk
    // double-firing FB.login.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdkLoaded, pin]);

  if (isProcessing) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-card p-8 rounded-lg flex flex-col items-center gap-4 max-w-sm text-center">
          <Loader2 className="animate-spin" size={32} />
          <p className="font-medium">
            Setting up your WhatsApp connection...
          </p>
          <p className="text-sm text-muted-foreground">
            This usually takes a few seconds
          </p>
        </div>
      </div>
    );
  }

  if (!sdkLoaded) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-card p-8 rounded-lg flex flex-col items-center gap-4 max-w-sm text-center">
          <Loader2 className="animate-spin" size={32} />
          <p className="font-medium">Loading Facebook…</p>
        </div>
      </div>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// EmbeddedSignupButton — legacy composite (kept for WhatsAppMethodChooser)
// ---------------------------------------------------------------------------

/**
 * The original "Continue with Facebook" button — keeps its public API
 * (no props, drops in anywhere) so the legacy `WhatsAppMethodChooser`
 * path in ConnectionWizard.tsx still works untouched.
 *
 * IMPORTANT: do NOT use this inside the v3a pre-flight wizard. The PIN
 * modal it contains lives inside the host's React tree; if the host
 * (e.g. a Radix Dialog Portal) unmounts during the click, the modal
 * unmounts with it and the user-visible flow silently skips the PIN
 * gate. The v3a wizard composes `WhatsAppPinModal` +
 * `EmbeddedSignupTrigger` at the page level instead.
 */
export function EmbeddedSignupButton() {
  const sdkLoaded = useFacebookSdk();
  // We don't subscribe to session info here — the trigger does that
  // once it mounts. Subscribing twice is harmless but pointless.

  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [activePin, setActivePin] = useState<string | null>(null);
  const isLaunching = activePin !== null;

  return (
    <>
      <Button
        onClick={() => setPinModalOpen(true)}
        disabled={!sdkLoaded || isLaunching}
        className="w-full"
        size="lg"
      >
        {isLaunching
          ? "Connecting..."
          : sdkLoaded
          ? "Continue with Facebook"
          : "Loading..."}
      </Button>

      <WhatsAppPinModal
        open={pinModalOpen}
        onPinSet={(pin) => {
          setPinModalOpen(false);
          setActivePin(pin);
        }}
        onCancel={() => setPinModalOpen(false)}
        onClose={() => setPinModalOpen(false)}
      />

      {activePin && (
        <EmbeddedSignupTrigger
          pin={activePin}
          onCancel={() => setActivePin(null)}
          onError={(err) => {
            setActivePin(null);
            toast({
              title: "Connection failed",
              description: err,
              variant: "destructive",
            });
          }}
        />
      )}
    </>
  );
}
