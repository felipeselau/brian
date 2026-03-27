import Link from "next/link";
import { cookies } from "next/headers";
import { UserMenu } from "./user-menu";
import { Brain } from "lucide-react";

interface NavbarProps {
  user: {
    name?: string | null;
    email: string;
    role: string;
    image?: string | null;
  };
}

export async function Navbar({ user }: NavbarProps) {
  const cookieStore = await cookies();
  const viewAsRole = cookieStore.get("view-as-role")?.value || null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/dashboard" className="flex items-center space-x-2.5">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary text-primary-foreground">
            <Brain className="h-5 w-5" />
          </div>
          <span className="font-semibold text-xl tracking-tight">Brian</span>
        </Link>
        
        <div className="ml-auto flex items-center space-x-4">
          <UserMenu user={{ ...user, viewAsRole }} />
        </div>
      </div>
    </header>
  );
}
