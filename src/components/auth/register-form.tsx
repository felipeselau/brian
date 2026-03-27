"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertCircle, Brain } from "lucide-react";

interface InviteInfo {
  email: string;
  role: string;
  project: {
    title: string;
    owner: {
      name: string | null;
      email: string;
    };
  };
}

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingInvite, setIsValidatingInvite] = useState(!!inviteToken);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [existingAccount, setExistingAccount] = useState(false);

  // Validate invite token on mount
  useEffect(() => {
    if (!inviteToken) return;

    const validateInvite = async () => {
      try {
        const response = await fetch(`/api/invites/${inviteToken}`);
        const data = await response.json();

        if (!response.ok) {
          setInviteError(data.error || "Invalid invite");
          return;
        }

        setInviteInfo(data.invite);
        setEmail(data.invite.email);
      } catch (error) {
        setInviteError("Failed to validate invite");
      } finally {
        setIsValidatingInvite(false);
      }
    };

    validateInvite();
  }, [inviteToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload: Record<string, string> = {
        name,
        email,
        password,
      };

      if (inviteToken) {
        payload.token = inviteToken;
      } else {
        payload.role = "OWNER";
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.includes("User already exists")) {
          setExistingAccount(true);
        }
        toast.error(data.error || "Registration failed");
        return;
      }

      if (data.message?.includes("already a member")) {
        setExistingAccount(true);
        toast.success(data.message);
        router.push("/login");
        return;
      }

      toast.success("Account created! Your second brain is ready.");
      router.push("/login");
    } catch (error) {
      toast.error("Something went wrong. Try again?");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while validating invite
  if (isValidatingInvite) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Validating invite...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Invalid invite error
  if (inviteToken && inviteError) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div>
              <h3 className="text-lg font-semibold">Invalid Invite</h3>
              <p className="text-muted-foreground mt-1">{inviteError}</p>
              <p className="text-sm text-muted-foreground mt-2">
                The link may have expired. Ask the project owner for a new one.
              </p>
            </div>
            <Link href="/login">
              <Button variant="outline">Go to Login</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Existing account detected
  if (existingAccount) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div>
              <h3 className="text-lg font-semibold">You&apos;re in!</h3>
              <p className="text-muted-foreground mt-1">
                An account with this email already exists. You&apos;ve been added
                to the project.
              </p>
            </div>
            <Link href="/login">
              <Button>Sign in to your project</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-3 items-center text-center">
        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary text-primary-foreground">
          <Brain className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-2xl font-semibold">
            {inviteToken ? "You&apos;re invited!" : "Start organizing"}
          </CardTitle>
          <CardDescription>
            {inviteToken ? (
              <span>
                Join <strong>{inviteInfo?.project.title}</strong> on Brian
              </span>
            ) : (
              "Create your account and set up your first project in minutes."
            )}
          </CardDescription>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {inviteToken && inviteInfo && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p>
                <strong>Project:</strong> {inviteInfo.project.title}
              </p>
              <p>
                <strong>Role:</strong> {inviteInfo.role}
              </p>
              <p>
                <strong>Invited by:</strong>{" "}
                {inviteInfo.project.owner.name || inviteInfo.project.owner.email}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading || !!inviteToken}
            />
            {inviteToken && (
              <p className="text-xs text-muted-foreground">
                Email is set by the invite and cannot be changed
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {isLoading
              ? "Creating account..."
              : inviteToken
              ? "Accept & Create Account"
              : "Create Account"}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export function RegisterForm() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      }
    >
      <RegisterFormContent />
    </Suspense>
  );
}
