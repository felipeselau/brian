"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, User, Eye, EyeOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface UserMenuProps {
  user: {
    name?: string | null;
    email: string;
    role: string;
    image?: string | null;
    viewAsRole?: string | null;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  if (!user) return null;

  const isViewingAs = !!user.viewAsRole;

  const getRoleColor = (role: string) => {
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

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const handleExitPreview = async () => {
    try {
      const response = await fetch("/api/user/view-as", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to exit preview");
      }

      toast.success("Returned to owner view");
      router.refresh();
    } catch (error) {
      toast.error("Failed to exit preview");
    }
  };

  const displayRole = isViewingAs ? user.viewAsRole! : user.role;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.image || ""} alt={user.name || ""} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          {isViewingAs && (
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-amber-500 rounded-full flex items-center justify-center">
              <Eye className="h-2.5 w-2.5 text-white" />
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        {/* View As Banner */}
        {isViewingAs && (
          <>
            <div className="px-2 py-2 bg-amber-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">
                    Previewing as: {user.viewAsRole}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-amber-700 hover:text-amber-900"
                  onClick={handleExitPreview}
                >
                  <EyeOff className="h-3 w-3 mr-1" />
                  Exit
                </Button>
              </div>
            </div>
          </>
        )}

        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <Badge className={`mt-1 w-fit ${getRoleColor(displayRole)}`} variant="outline">
              {displayRole}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
