import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";

const viewAsSchema = z.object({
  role: z.enum(["WORKER", "CLIENT"]).nullable(),
});

// POST /api/user/view-as - Set view-as role (owner only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only owners can use view-as
    if (session.user.role !== "OWNER") {
      return NextResponse.json(
        { error: "Only owners can use view-as" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { role } = viewAsSchema.parse(body);

    // The view-as state is stored in a cookie
    const response = NextResponse.json({
      viewAsRole: role,
      message: role ? `Viewing as ${role}` : "Returned to owner view",
    });

    if (role) {
      response.cookies.set("view-as-role", role, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });
    } else {
      response.cookies.delete("view-as-role");
    }

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error setting view-as:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// DELETE /api/user/view-as - Clear view-as role
export async function DELETE(req: NextRequest) {
  try {
    const response = NextResponse.json({
      viewAsRole: null,
      message: "Returned to owner view",
    });

    response.cookies.delete("view-as-role");

    return response;
  } catch (error) {
    console.error("Error clearing view-as:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
