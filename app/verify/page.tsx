"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail, ArrowRight, RefreshCw, Sparkles } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";

// 1. Move your main component layout and hook logic here
function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyOtp, resendOtp } = useAuth();

  const email = searchParams.get("email") || "";
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown === 0) return;

    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const token = otp.join("");
    if (token.length < 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(email, token);
      setIsVerified(true);
      toast.success("Email verified successfully! Please sign in.");

      await supabase.auth.signOut();
      router.refresh();

      setTimeout(() => {
        router.replace(`/login?email=${encodeURIComponent(email)}`);
      }, 1000);
    } catch (error: any) {
      setIsVerified(false);
      setLoading(false);
      toast.error(error.message || "Verification failed. Please try again.");
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Missing email address. Please register again.");
      return;
    }
    setResending(true);
    try {
      await resendOtp(email);
      setCanResend(false);
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      toast.error(error.message || "Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground text-sm font-medium animate-pulse">
          Finalizing registration... Preparing login system
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 sm:p-12">
      <div className="w-full max-w-md space-y-8 bg-card border border-border/40 p-8 rounded-2xl shadow-xl">
        <div className="flex flex-col items-center text-center space-y-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <Image
                src="/images/logo.png"
                alt="Logo"
                fill
                className="object-contain rounded-xl bg-white backdrop-blur-sm p-1.5 group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="text-left">
              <span className="font-bold text-lg tracking-tight text-foreground block leading-none mb-1">
                Kejetia
              </span>
              <p className="text-xs text-muted-foreground leading-none">
                Campus Marketplace
              </p>
            </div>
          </Link>

          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mt-4">
            <Mail className="w-7 h-7 text-primary animate-bounce duration-1000" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Check your email
            </h1>
            <p className="text-muted-foreground text-sm max-w-sm">
              We sent a 6-digit confirmation code to:
              <span className="block font-semibold text-foreground mt-1 text-base">
                {email}
              </span>
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div
            className="flex gap-2 sm:gap-3 justify-center"
            onPaste={handlePaste}
          >
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`
                  w-12 h-14 text-center text-xl font-bold border rounded-xl bg-muted/30 text-foreground
                  transition-all outline-none focus:border-primary focus:ring-4 focus:ring-primary/10
                  ${digit ? "border-primary bg-primary/5 ring-2 ring-primary/5" : "border-border"}
                `}
              />
            ))}
          </div>

          <Button
            onClick={handleVerify}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/90 shadow-lg font-medium"
            disabled={loading || otp.join("").length < 6}
          >
            {loading ? (
              "Verifying account..."
            ) : (
              <span className="flex items-center justify-center gap-2">
                Verify Email <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </div>

        <div className="space-y-4 text-center text-sm pt-2">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={resending}
                className="flex items-center gap-1.5 text-primary hover:underline font-semibold"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`}
                />
                {resending ? "Resending..." : "Resend code"}
              </button>
            ) : (
              <p className="text-xs bg-muted/60 px-3 py-1.5 rounded-full border border-border/40 inline-flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                Resend code available in{" "}
                <span className="font-bold text-foreground">{countdown}s</span>
              </p>
            )}
          </div>

          <div className="border-t border-border/60 pt-4">
            <p className="text-xs text-muted-foreground">
              Entered the wrong address?{" "}
              <Link
                href="/register"
                className="text-primary font-medium hover:underline"
              >
                Go back & update email
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 2. Wrap your content inside a clean Suspense Boundary for Next's compiler
export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground text-sm font-medium">
            Loading verification systems...
          </p>
        </div>
      }
    >
      <VerifyPageContent />
    </Suspense>
  );
}
