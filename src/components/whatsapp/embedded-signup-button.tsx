"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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

export function EmbeddedSignupButton() {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

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
          sessionStorage.setItem("ess_session_info", JSON.stringify(data));
        }
      } catch {
        // Not our message; ignore.
      }
    }

    window.addEventListener("message", sessionInfoListener);
    return () => window.removeEventListener("message", sessionInfoListener);
  }, []);

  function launchEmbeddedSignup() {
    if (!window.FB) return;
    setIsLaunching(true);

    window.FB.login(
      function (response) {
        if (response.authResponse?.code) {
          const sessionInfo = sessionStorage.getItem("ess_session_info");
          fetch("/api/whatsapp/oauth/callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: response.authResponse.code,
              session_info: sessionInfo ? JSON.parse(sessionInfo) : null,
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              setIsLaunching(false);
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
              toast({
                title: "Connection failed",
                description: err.message,
                variant: "destructive",
              });
            });
        } else {
          setIsLaunching(false);
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
    <Button
      onClick={launchEmbeddedSignup}
      disabled={!sdkLoaded || isLaunching}
      className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white"
      size="lg"
    >
      {isLaunching
        ? "Connecting..."
        : sdkLoaded
        ? "Continue with Facebook"
        : "Loading..."}
    </Button>
  );
}
