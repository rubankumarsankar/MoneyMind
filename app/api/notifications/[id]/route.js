import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const id = parseInt(params.id);
    const body = await req.json();
    const { read } = body;

    const notification = await prisma.notification.update({
      where: { id, userId: session.user.id },
      data: { read },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const id = parseInt(params.id);
    await prisma.notification.delete({
      where: { id, userId: session.user.id },
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}

