"use client";
import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const VerifyContent = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // In a real app, we might trigger the verification API call here via useEffect
  // But our API route handles the verification logic and redirects.
  // If the user lands here manually without being redirected, it might be confusing.
  // However, the email link points to /verify?token=... which we haven't implemented as a page that calls the API.
  // Wait, my plan said: "Create API Route: Verify Email (app/api/auth/verify/route.ts)".
  // And the email link in mailjet.ts points to `/verify?token=...`.
  // So we need a page at `/verify` that calls the API.
  // OR we point the email link directly to the API route?
  // Pointing to API route is easier: `${baseUrl}/api/auth/verify?token=${token}`.
  // But I set it to `${baseUrl}/verify?token=${token}` in mailjet.ts.
  // Let's make this page call the API.

  const [status, setStatus] = React.useState<"verifying" | "success" | "error">("verifying");

  React.useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    fetch(`/api/auth/verify?token=${token}`)
      .then((res) => {
          if (res.redirected) {
              window.location.href = res.url; // Follow redirect to login
              return;
          }
          if (!res.ok) throw new Error("Verification failed");
          return res.json();
      })
      .then(() => {
         // If API returns JSON instead of redirecting (depends on implementation)
         setStatus("success");
      })
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-4">Account Verification</h2>
        {status === "verifying" && <p>Verifying your email...</p>}
        {status === "success" && (
          <div>
            <p className="text-green-400 mb-4">Email verified successfully!</p>
            <Link href="/login" className="text-blue-400 hover:underline">
              Go to Login
            </Link>
          </div>
        )}
        {status === "error" && (
          <div>
            <p className="text-red-400 mb-4">Verification failed or invalid token.</p>
            <Link href="/login" className="text-blue-400 hover:underline">
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

const VerifyPage = () => {
  return (
    <Suspense fallback={<div className="text-white text-center mt-10">Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
};

export default VerifyPage;
