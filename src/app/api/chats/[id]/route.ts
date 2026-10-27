import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withDb } from "@/lib/db";
import { messageToDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// A chat session with all its messages.
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  return withDb(async () => {
    const session = await prisma.chatSession.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!session) return NextResponse.json({ error: "Chat not found." }, { status: 404 });
    return NextResponse.json({
      id: session.id,
      title: session.title,
      updatedAt: session.updatedAt.toISOString(),
      messages: session.messages.map(messageToDTO),
    });
  });
}

// Delete a chat session and (by cascade) its messages.
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  return withDb(async () => {
    const { count } = await prisma.chatSession.deleteMany({ where: { id } });
    if (count === 0) return NextResponse.json({ error: "Chat not found." }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  });
}
