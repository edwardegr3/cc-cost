import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withDb } from "@/lib/db";
import { generateReply, redactPersonalData, REDACTION_NOTICE } from "@/lib/assistant";
import { faqToDTO, messageToDTO, productToDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const DEFAULT_MAX_LENGTH = 1000;
const DEFAULT_FALLBACK = "Sorry, this demo does not have enough information to answer that.";

function makeTitle(text: string) {
  const oneLine = text.replace(/\s+/g, " ").trim();
  return oneLine.length > 60 ? `${oneLine.slice(0, 57)}…` : oneLine;
}

// Send a user message; stores it and the assistant's reply.
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const raw = typeof (body as { content?: unknown })?.content === "string" ? (body as { content: string }).content : "";
  const content = raw.trim();
  if (!content) return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });

  return withDb(async () => {
    const settings = await prisma.chatSettings.findUnique({ where: { id: "default" } });
    const maxLength = settings?.maxMessageLength ?? DEFAULT_MAX_LENGTH;
    if (content.length > maxLength) {
      return NextResponse.json({ error: `Message is too long (max ${maxLength} characters).` }, { status: 400 });
    }

    const session = await prisma.chatSession.findUnique({
      where: { id },
      include: { _count: { select: { messages: true } } },
    });
    if (!session) return NextResponse.json({ error: "Chat not found." }, { status: 404 });

    const { text: safeText, redacted } = redactPersonalData(content);
    const [faqs, products] = await Promise.all([prisma.faq.findMany(), prisma.product.findMany({ orderBy: { id: "asc" } })]);
    let reply = generateReply(
      safeText,
      faqs.map(faqToDTO),
      products.map(productToDTO),
      settings?.fallbackMessage ?? DEFAULT_FALLBACK,
    );
    if (redacted) reply = `${REDACTION_NOTICE}\n\n${reply}`;

    const [userMessage, assistantMessage] = await prisma.$transaction(async (tx) => {
      const u = await tx.message.create({ data: { sessionId: id, role: "user", content: safeText } });
      const a = await tx.message.create({ data: { sessionId: id, role: "assistant", content: reply } });
      await tx.chatSession.update({
        where: { id },
        data: session._count.messages === 0 ? { title: makeTitle(safeText) } : { updatedAt: new Date() },
      });
      return [u, a];
    });

    return NextResponse.json({ userMessage: messageToDTO(userMessage), assistantMessage: messageToDTO(assistantMessage) }, { status: 201 });
  });
}

// Clear all messages in a chat, keeping the session.
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  return withDb(async () => {
    const session = await prisma.chatSession.findUnique({ where: { id } });
    if (!session) return NextResponse.json({ error: "Chat not found." }, { status: 404 });
    await prisma.$transaction([
      prisma.message.deleteMany({ where: { sessionId: id } }),
      prisma.chatSession.update({ where: { id }, data: { title: "New chat" } }),
    ]);
    return new NextResponse(null, { status: 204 });
  });
}
