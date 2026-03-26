import Link from "next/link";
import { UserMenu } from "./user-menu";
import { Briefcase } from "lucide-react";

interface NavbarProps {
  user: {
    name?: string | null;
    email: string;
    role: string;
    image?: string | null;
  };
}

export function Navbar({ user }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Briefcase className="h-6 w-6" />
          <span className="font-bold text-xl">Brian</span>
        </Link>
        
        <div className="ml-auto flex items-center space-x-4">
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
