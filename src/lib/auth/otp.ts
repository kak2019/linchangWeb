import { getPrisma } from "@/lib/db";
import { CODE_MAX_ATTEMPTS } from "@/lib/auth/config";
import { hashOtp, safeEqual } from "@/lib/auth/crypto";

export async function consumeEmailCode(email: string, code: string, purpose = "auth", userId: string | null = null) {
  const prisma = getPrisma();
  const record = await prisma.verificationCode.findFirst({
    where: { email, purpose, userId, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record || record.expiresAt < new Date() || record.attempts >= CODE_MAX_ATTEMPTS) {
    return false;
  }

  const hashKey = purpose === "auth" ? email : `${purpose}:${userId}:${email}`;
  if (!safeEqual(record.codeHash, hashOtp(hashKey, code))) {
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return false;
  }

  const consumed = await prisma.verificationCode.updateMany({
    where: { id: record.id, consumedAt: null, expiresAt: { gt: new Date() }, attempts: { lt: CODE_MAX_ATTEMPTS } },
    data: { consumedAt: new Date() },
  });
  return consumed.count === 1;
}
