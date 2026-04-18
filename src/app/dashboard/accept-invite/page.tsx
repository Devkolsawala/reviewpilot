"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type State = "processing" | "success" | "error";

export default function AcceptInvitePage() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const token = searchParams.get("token");

 const [state, setState] = useState<State>("processing");
 const [message, setMessage] = useState("");

 useEffect(() => {
 if (!token) {
 setState("error");
 setMessage("No invite token found in the link. Please request a new invite.");
 return;
 }

 async function accept() {
 try {
 const res = await fetch("/api/team/accept-invite", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ token }),
 });

 const data = await res.json();

 if (!res.ok) {
 setState("error");
 setMessage(data.error ?? "Something went wrong. Please try again.");
 return;
 }

 setState("success");
 // Short pause so the success message is visible, then redirect
 setTimeout(() => router.push("/dashboard"), 1500);
 } catch {
 setState("error");
 setMessage("Network error. Please check your connection and try again.");
 }
 }

 accept();
 }, [token, router]);

 return (
 <div className="min-h-screen flex items-center justify-center bg-gray-950">
 <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 max-w-md w-full text-center shadow-xl">
 {state === "processing" && (
 <>
 <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
 <h1 className="text-xl font-semibold text-white">Joining workspace…</h1>
 <p className="text-gray-400 mt-2 text-sm">Setting up your access, just a moment.</p>
 </>
 )}

 {state === "success" && (
 <>
 <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
 <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
 </svg>
 </div>
 <h1 className="text-xl font-semibold text-white">You&apos;re in!</h1>
 <p className="text-gray-400 mt-2 text-sm">Redirecting you to the dashboard…</p>
 </>
 )}

 {state === "error" && (
 <>
 <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
 <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
 </svg>
 </div>
 <h1 className="text-xl font-semibold text-white">Invite error</h1>
 <p className="text-gray-400 mt-2 text-sm">{message}</p>
 <button
 onClick={() => router.push("/dashboard")}
 className="mt-6 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
 >
 Go to dashboard
 </button>
 </>
 )}
 </div>
 </div>
 );
}
