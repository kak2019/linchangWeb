import { getPrisma } from "@/lib/db";
import { AuthError } from "@/lib/auth/security";

export function wechatConfig() {
  const appid = process.env.WECHAT_APP_ID?.trim();
  const secret = process.env.WECHAT_APP_SECRET?.trim();
  const redirect = process.env.WECHAT_REDIRECT_URI?.trim();
  if (!appid || !secret || !redirect) throw new AuthError("微信登录暂未配置", 503);
  const url = new URL(redirect);
  if (url.pathname !== "/api/auth/wechat/callback" || url.search || url.hash || url.username || url.password || (url.protocol !== "https:" && process.env.NODE_ENV === "production")) throw new AuthError("微信回调地址配置无效", 503);
  return {appid, secret, redirect, origin:url.origin};
}

async function wechatRequest(path: string, params: Record<string, string>) {
  const url = new URL(path, "https://api.weixin.qq.com");
  url.search = new URLSearchParams(params).toString();
  let data;
  try {
    const response = await fetch(url, {cache:"no-store", redirect:"error", signal:AbortSignal.timeout(15000)});
    if (!response.ok) throw new Error();
    data = await response.json();
  } catch { throw new AuthError("无法连接微信，请重新扫码", 502); }
  if (!data || typeof data !== "object" || data.errcode) throw new AuthError("微信授权失败或已过期，请重新扫码", 400);
  return data;
}

export async function getWechatIdentity(code: string) {
  const {appid, secret} = wechatConfig();
  const token = await wechatRequest("/sns/oauth2/access_token", {appid, secret, code, grant_type:"authorization_code"});
  if (typeof token.openid !== "string" || typeof token.access_token !== "string") throw new AuthError("微信未返回有效身份");
  const profile = await wechatRequest("/sns/userinfo", {openid:token.openid, access_token:token.access_token, lang:"zh_CN"});
  if (profile.openid !== token.openid) throw new AuthError("微信身份校验失败");
  return {openid:token.openid as string, unionId:typeof profile.unionid === "string" ? profile.unionid : typeof token.unionid === "string" ? token.unionid : null,
    nickname:typeof profile.nickname === "string" ? profile.nickname.slice(0, 191) : "微信用户",
    avatarUrl:typeof profile.headimgurl === "string" && /^https?:\/\//.test(profile.headimgurl) ? profile.headimgurl : null};
}

export async function resolveWechatUser(identity: Awaited<ReturnType<typeof getWechatIdentity>>, bindingUserId: string | null) {
  const prisma = getPrisma();
  const key = {provider: "wechat" as const, providerAccountId: identity.openid};
  try {
    return await prisma.$transaction(async tx => {
      if (bindingUserId) {
        // Serialize identity changes for this user, including concurrent bindings.
        await tx.user.update({where:{id:bindingUserId}, data:{updatedAt:new Date()}});
      }
      const account = await tx.account.findUnique({where:{provider_providerAccountId:key}, include:{user:{include:{accounts:true}}}});
      if (account) {
        if (bindingUserId && account.userId !== bindingUserId) throw new AuthError("此微信已绑定其他账号，不能合并", 409);
        return account.user;
      }
      const data = {...key, unionId:identity.unionId};
      if (bindingUserId) {
        if (await tx.account.findFirst({where:{userId:bindingUserId, provider:"wechat"}})) throw new AuthError("当前账号已绑定其他微信", 409);
        await tx.account.create({data:{...data, userId:bindingUserId}});
        return tx.user.findUniqueOrThrow({where:{id:bindingUserId}, include:{accounts:true}});
      }
      return tx.user.create({data:{nickname:identity.nickname, avatarUrl:identity.avatarUrl, accounts:{create:data}}, include:{accounts:true}});
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      if (bindingUserId) throw new AuthError("此微信已绑定其他账号", 409);
      const account = await prisma.account.findUnique({where:{provider_providerAccountId:key}, include:{user:{include:{accounts:true}}}});
      if (account) return account.user;
    }
    throw error;
  }
}
