"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserRole } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  Upload,
  Eye,
  EyeOff,
  User,
  Mail,
  Shield,
} from "lucide-react";

interface ProfileFormProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: UserRole;
    image: string | null;
    createdAt: Date;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isViewAsLoading, setIsViewAsLoading] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email);
  const [avatarUrl, setAvatarUrl] = useState(user.image);

  const isOwner = user.role === UserRole.OWNER;

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "OWNER":
        return "bg-purple-100 text-purple-800";
      case "WORKER":
        return "bg-blue-100 text-blue-800";
      case "CLIENT":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload avatar");
      }

      setAvatarUrl(data.url);
      toast.success("Profile picture updated!");
      router.refresh();
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload avatar"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload: Record<string, string> = {};

      if (name !== user.name) {
        payload.name = name;
      }

      if (isOwner && email !== user.email) {
        payload.email = email;
      }

      if (Object.keys(payload).length === 0) {
        toast.info("No changes to save");
        return;
      }

      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      toast.success("Profile updated!");
      router.refresh();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewAs = async (role: "WORKER" | "CLIENT" | null) => {
    setIsViewAsLoading(true);

    try {
      const response = await fetch("/api/user/view-as", {
        method: role ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: role ? JSON.stringify({ role }) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to set view-as");
      }

      toast.success(data.message);
      router.refresh();
    } catch (error) {
      console.error("Error setting view-as:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to set view-as"
      );
    } finally {
      setIsViewAsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Picture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl || ""} alt={name || ""} />
                <AvatarFallback className="text-lg">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload new picture
              </Button>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, WebP, or GIF. Max 5MB.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Info Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your display name"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isOwner || isLoading}
                placeholder="your@email.com"
              />
              {!isOwner && (
                <p className="text-xs text-muted-foreground">
                  Only project owners can change their email
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <div>
                <Badge className={getRoleColor(user.role)} variant="outline">
                  {user.role}
                </Badge>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* View As Section (Owner Only) */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5" />
              View As
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Preview the board as a different role to understand how your team sees things.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleViewAs("WORKER")}
                disabled={isViewAsLoading}
              >
                <Eye className="h-4 w-4 mr-2" />
                View as Worker
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleViewAs("CLIENT")}
                disabled={isViewAsLoading}
              >
                <Eye className="h-4 w-4 mr-2" />
                View as Client
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleViewAs(null)}
                disabled={isViewAsLoading}
              >
                <EyeOff className="h-4 w-4 mr-2" />
                Exit Preview
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
