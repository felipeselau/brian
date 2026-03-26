import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session.user.name}!
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border p-6">
            <h3 className="font-semibold">My Projects</h3>
            <p className="text-2xl font-bold mt-2">0</p>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="font-semibold">Active Requests</h3>
            <p className="text-2xl font-bold mt-2">0</p>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="font-semibold">Total Hours</h3>
            <p className="text-2xl font-bold mt-2">0h</p>
          </div>
        </div>

        <div className="rounded-lg border p-6">
          <p className="text-muted-foreground text-center py-12">
            No projects yet. Create your first project to get started!
          </p>
        </div>
      </div>
    </div>
  );
}
