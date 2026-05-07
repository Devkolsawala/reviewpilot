"use client";

import { useEffect, useState } from "react";
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

export function EmbeddedSignupButton() {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.FB) {
      setSdkLoaded(true);
    } else {
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
    }

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

  function openPinModal() {
    setPin("");
    setPinConfirm("");
    setPinError(null);
    setPinModalOpen(true);
  }

  function submitPin() {
    if (!/^\d{6}$/.test(pin)) {
      setPinError("PIN must be exactly 6 digits.");
      return;
    }
    if (pin !== pinConfirm) {
      setPinError("PINs do not match.");
      return;
    }
    // Plaintext sessionStorage is acceptable here: it lives only for the
    // brief window between modal submit and the OAuth callback POST, and
    // is wiped immediately on completion or failure. Server-side, the
    // callback encrypts it with the same scheme as access tokens before
    // storing it in phone_pin_encrypted.
    sessionStorage.setItem(PIN_KEY, pin);
    setPinModalOpen(false);
    launchEmbeddedSignup();
  }

  function launchEmbeddedSignup() {
    if (!window.FB) return;
    setIsLaunching(true);

    window.FB.login(
      function (response) {
        if (response.authResponse?.code) {
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
              setIsLaunching(false);
              // Clear PIN + session info regardless of outcome — these must
              // not linger in sessionStorage after the callback POST.
              sessionStorage.removeItem(PIN_KEY);
              sessionStorage.removeItem(SESSION_KEY);
              if (data.success) {
                window.location.href =
                  "/dashboard/settings/connections?connected=whatsapp";
              } else {
                toast({
                  title: "Connection failed",
                  description: data.error || "Unknown error",
                  variant: "destructive",
                });
              }
            })
            .catch((err) => {
              setIsLaunching(false);
              sessionStorage.removeItem(PIN_KEY);
              sessionStorage.removeItem(SESSION_KEY);
              toast({
                title: "Connection failed",
                description: err.message,
                variant: "destructive",
              });
            });
        } else {
          // User canceled or denied — discard the unused PIN.
          setIsLaunching(false);
          sessionStorage.removeItem(PIN_KEY);
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
  }

  return (
    <>
      <Button
        onClick={openPinModal}
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

      <Dialog open={pinModalOpen} onOpenChange={setPinModalOpen}>
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
              <Input
                id="ess-pin"
                type="password"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                autoComplete="off"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ess-pin-confirm">Confirm PIN</Label>
              <Input
                id="ess-pin-confirm"
                type="password"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                autoComplete="off"
                value={pinConfirm}
                onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitPin();
                }}
              />
            </div>
            {pinError && (
              <p className="text-xs text-destructive">{pinError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPinModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitPin}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
