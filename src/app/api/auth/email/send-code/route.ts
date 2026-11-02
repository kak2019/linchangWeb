import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import {
  SEND_COOLDOWN_MS,
  SEND_EMAIL_HOURLY_LIMIT,
  SEND_IP_HOURLY_LIMIT,
  CODE_TTL_MS,
  clientIp,
  isValidEmail,
  normalizeEmail,
} from "@/lib/auth/config";
import { generateOtp, hashOtp } from "@/lib/auth/crypto";
import { sendVerificationEmail } from "@/lib/auth/mail";
import { configErrorResponse, jsonError, jsonOk } from "@/lib/auth/http";
import { sessionCookieValue } from "@/lib/auth/http";
import { readSessionUser } from "@/lib/auth/session";
import { AuthError, requireSameOrigin } from "@/lib/auth/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    let body: { email?: string; purpose?: string } = {};
    try {
      body = await request.json();
    } catch {
      return jsonError("请输入有效邮箱", 400);
    }
    const purpose = body.purpose ?? "auth";
    if (!["auth", "bind-email", "set-password"].includes(purpose)) return jsonError("验证码用途无效", 400);
    let userId: string | null = null;
    let email = normalizeEmail(typeof body.email === "string" ? body.email : "");
    if (purpose !== "auth") {
      requireSameOrigin(request);
      const user = await readSessionUser(await sessionCookieValue());
      if (!user) return jsonError("请先登录", 401);
      userId = user.id;
      if (purpose === "set-password") {
        if (!user.email) return jsonError("请先绑定邮箱", 400);
        email = user.email;
      } else {
        if (user.email) return jsonError("当前账号已有绑定邮箱", 409);
        if (await getPrisma().user.findUnique({where:{email}})) return jsonError("该邮箱已被其他账号使用，不能合并", 409);
      }
    }
    if (!isValidEmail(email)) {
      return jsonError("请输入有效邮箱", 400);
    }

    const prisma = getPrisma();
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const ip = clientIp(request);

    const [latest, emailCount, ipCount] = await Promise.all([
      prisma.verificationCode.findFirst({
        where: { email },
        orderBy: { createdAt: "desc" },
      }),
      prisma.verificationCode.count({
        where: { email, createdAt: { gt: hourAgo } },
      }),
      prisma.verificationCode.count({
        where: { ip, createdAt: { gt: hourAgo } },
      }),
    ]);

    if (latest && now.getTime() - latest.createdAt.getTime() < SEND_COOLDOWN_MS) {
      return jsonError("发送过于频繁，请稍后再试", 429);
    }
    if (emailCount >= SEND_EMAIL_HOURLY_LIMIT || ipCount >= SEND_IP_HOURLY_LIMIT) {
      return jsonError("发送过于频繁，请稍后再试", 429);
    }

    const code = generateOtp();
    await prisma.verificationCode.create({
      data: {
        email,
        purpose,
        userId,
        codeHash: hashOtp(purpose === "auth" ? email : `${purpose}:${userId}:${email}`, code),
        expiresAt: new Date(now.getTime() + CODE_TTL_MS),
        ip,
      },
    });

    await sendVerificationEmail(email, code);
    return jsonOk({
      cooldown: SEND_COOLDOWN_MS / 1000,
    });
  } catch (error) {
    if (error instanceof AuthError) return jsonError(error.message, error.status);
    console.error("[auth] send-code failed", error);
    return configErrorResponse(error);
  }
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
