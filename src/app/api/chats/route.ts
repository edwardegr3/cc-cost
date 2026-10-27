import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withDb } from "@/lib/db";

export const dynamic = "force-dynamic";

// List chat sessions, most recently active first.
export async function GET() {
  return withDb(async () => {
    const sessions = await prisma.chatSession.findMany({
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: { _count: { select: { messages: true } } },
    });
    return NextResponse.json(
      sessions.map((s) => ({
        id: s.id,
        title: s.title,
        updatedAt: s.updatedAt.toISOString(),
        messageCount: s._count.messages,
      })),
    );
  });
}

// Create an empty chat session.
export async function POST() {
  return withDb(async () => {
    const s = await prisma.chatSession.create({ data: {} });
    return NextResponse.json(
      { id: s.id, title: s.title, updatedAt: s.updatedAt.toISOString(), messageCount: 0 },
      { status: 201 },
    );
  });
}
