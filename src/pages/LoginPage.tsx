import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  function validate(): boolean {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Enter a valid email address.";
    if (!password) newErrors.password = "Password is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);
    if (result.success) {
      toast.success("Welcome back!");
      navigate({
        to: "/dashboard",
        replace: true,
      });
    } else {
      toast.error(result.error ?? "Login failed. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo / Branding */}
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <img
            src="/assets/images/samrpanlogo.webp"
            alt="Samarpan"
            className="h-24 w-auto object-contain mr-[10%]"
          />
        </div>

        <Card className="shadow-elevated border border-border rounded-2xl bg-card">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-base sm:text-lg font-semibold mb-5 sm:mb-6 text-foreground font-display">
              Sign in to your account
            </h2>

            <form
              onSubmit={handleSubmit}
              className="space-y-4 sm:space-y-5"
              noValidate
            >
              {/* Role Selector */}
              <div className="space-y-1.5">
                <Label htmlFor="role" className="text-sm font-medium text-foreground">
                  Sign in as
                </Label>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@samarpan.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email)
                      setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className={`h-11 rounded-xl text-sm ${errors.email ? "border-destructive focus-visible:ring-destructive" : "border-border"}`}
                  data-ocid="login.email_input"
                  autoComplete="email"
                />
                {errors.email && (
                  <p
                    className="text-xs text-destructive mt-1 break-words"
                    data-ocid="login.email_field_error"
                  >
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password)
                        setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    className={`h-11 rounded-xl pr-10 text-sm ${errors.password ? "border-destructive focus-visible:ring-destructive" : "border-border"}`}
                    data-ocid="login.password_input"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors p-1 text-muted-foreground hover:text-foreground"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    data-ocid="login.password_toggle"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p
                    className="text-xs text-destructive mt-1 break-words"
                    data-ocid="login.password_field_error"
                  >
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl font-semibold text-sm transition-smooth mt-2 gap-2 bg-primary hover:bg-secondary text-primary-foreground disabled:opacity-70"
                data-ocid="login.submit_button"
              >
                {isLoading ? (
                  <>
                    <svg
                      aria-label="Loading"
                      className="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <title>Loading</title>
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Signing in…
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-xs mt-5 sm:mt-6 text-muted-foreground">
          © {new Date().getFullYear()} Samarpan Hospital. All rights reserved.
        </p>
      </div>
    </div>
  );
}
