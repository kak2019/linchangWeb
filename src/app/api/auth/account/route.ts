import { getPrisma } from "@/lib/db";
import { isValidEmail, isValidPassword, normalizeEmail } from "@/lib/auth/config";
import { hashPassword } from "@/lib/auth/crypto";
import { consumeEmailCode } from "@/lib/auth/otp";
import { jsonError, jsonOk, sessionCookieValue } from "@/lib/auth/http";
import { applySessionCookie, createUserSession, readSessionUser, toAuthUser } from "@/lib/auth/session";
import { AuthError, requireSameOrigin } from "@/lib/auth/security";

export const dynamic = "force-dynamic";
export async function GET() {
  const user = await readSessionUser(await sessionCookieValue());
  if (!user) return jsonError("请先登录", 401);
  const record = await getPrisma().user.findUnique({where:{id:user.id}, select:{passwordHash:true}});
  const response = jsonOk({user, hasPassword:Boolean(record?.passwordHash)});
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const current = await readSessionUser(await sessionCookieValue());
    if (!current) return jsonError("请先登录", 401);
    const body = await request.json();
    const action = body.action;
    if (!["bind-email", "set-password"].includes(action)) throw new AuthError("操作无效");
    const email = action === "set-password" ? current.email : normalizeEmail(typeof body.email === "string" ? body.email : "");
    const code = typeof body.code === "string" ? body.code.trim() : "";
    if (!email || !isValidEmail(email) || !/^\d{6}$/.test(code)) throw new AuthError("请输入有效邮箱和六位验证码");
    if (action === "bind-email" && current.email) throw new AuthError("当前账号已有绑定邮箱", 409);
    const password = typeof body.password === "string" ? body.password : "";
    if (action === "set-password" && (!isValidPassword(password) || Buffer.byteLength(password, "utf8") > 72)) throw new AuthError("密码须为 8–72 个字符，且 UTF-8 不超过 72 字节");
    if (!await consumeEmailCode(email, code, action, current.id)) throw new AuthError("验证码无效、已使用或已过期");
    const passwordHash = action === "set-password" ? await hashPassword(password) : null;
    const prisma = getPrisma();
    const user = await prisma.$transaction(async tx => {
      const locked = await tx.user.update({where:{id:current.id}, data:{updatedAt:new Date()}});
      if (action === "bind-email") {
        if (locked.email) throw new AuthError("当前账号已有绑定邮箱", 409);
        if (await tx.user.findUnique({where:{email}})) throw new AuthError("该邮箱已被其他账号使用，不能合并", 409);
        return tx.user.update({where:{id:current.id}, data:{email, emailVerifiedAt:new Date(), accounts:{create:{provider:"email", providerAccountId:email}}}, include:{accounts:true}});
      }
      if (locked.email !== email || !locked.emailVerifiedAt) throw new AuthError("请先验证绑定邮箱");
      if (locked.passwordHash) throw new AuthError("当前账号已设置密码，本入口仅用于首次设置", 409);
      await tx.authSession.deleteMany({where:{userId:current.id}});
      return tx.user.update({where:{id:current.id}, data:{passwordHash}, include:{accounts:true}});
    });
    return applySessionCookie(jsonOk({user:toAuthUser(user)}), await createUserSession(toAuthUser(user)));
  } catch (error) {
    if (error instanceof AuthError) return jsonError(error.message, error.status);
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return jsonError("该登录身份已被其他账号使用", 409);
    return jsonError("操作失败，请稍后重试", 500);
  }
}
