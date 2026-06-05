"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Sun, Moon, Lock, Bell, Shield, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

const passwordSchema = z
  .object({
    current_password: z.string().min(6),
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();
  const router = useRouter();
  const [passwordLoading, setPasswordLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const handlePasswordChange = async (data: PasswordForm) => {
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.new_password,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Password updated successfully!");
      reset();
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account preferences
        </p>
      </div>

      {/* Appearance */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            {theme === "dark" ? (
              <Moon className="w-4 h-4 text-primary" />
            ) : (
              <Sun className="w-4 h-4 text-primary" />
            )}
          </div>
          <h2 className="font-semibold text-foreground">Appearance</h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm text-foreground">Dark Mode</p>
            <p className="text-xs text-muted-foreground">
              Switch to dark theme
            </p>
          </div>
          <Switch
            checked={theme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          />
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Lock className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-semibold text-foreground">Change Password</h2>
        </div>

        <form
          onSubmit={handleSubmit(handlePasswordChange)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input
              type="password"
              placeholder="Min. 8 characters"
              className="h-11 rounded-xl"
              {...register("new_password")}
            />
            {errors.new_password && (
              <p className="text-destructive text-xs">
                {errors.new_password.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <Input
              type="password"
              placeholder="Repeat new password"
              className="h-11 rounded-xl"
              {...register("confirm_password")}
            />
            {errors.confirm_password && (
              <p className="text-destructive text-xs">
                {errors.confirm_password.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            variant="outline"
            className="rounded-xl"
            disabled={passwordLoading}
          >
            {passwordLoading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>

      {/* Privacy & Security */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-semibold text-foreground">Privacy & Security</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm text-foreground">
              Profile visibility
            </p>
            <p className="text-xs text-muted-foreground">
              Allow other students to view your profile
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm text-foreground">
              Show online status
            </p>
            <p className="text-xs text-muted-foreground">
              Let others see when you're online
            </p>
          </div>
          <Switch defaultChecked />
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-semibold text-foreground">Notifications</h2>
        </div>
        {[
          {
            label: "New booking requests",
            desc: "Get notified when someone books your service",
          },
          { label: "Messages", desc: "Receive notifications for new messages" },
          {
            label: "Reviews",
            desc: "Get notified when someone reviews your service",
          },
        ].map(({ label, desc }) => (
          <div key={label} className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <Switch defaultChecked />
          </div>
        ))}
      </div>

      {/* Sign out */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="font-semibold text-foreground mb-4">Account</h2>
        <Button
          variant="outline"
          className="rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export default SettingsPage;
