import { redirect } from "next/navigation";
import { sessionCookieValue } from "@/lib/auth/http";
import { readSessionUser } from "@/lib/auth/session";
import AccountSettings from "@/components/account-settings";
import { getPrisma } from "@/lib/db";

export const metadata = {title:"账号设置 · NarrativeOS", robots:{index:false, follow:false}};
export const dynamic = "force-dynamic";
export default async function AccountPage({searchParams}: {searchParams:Promise<{error?:string; success?:string; returnTo?:string}>}) {
  const params = await searchParams;
  const user = await readSessionUser(await sessionCookieValue());
  if (!user) {
    const target = params.returnTo ? `/account?returnTo=${encodeURIComponent(params.returnTo)}` : '/account';
    redirect(`/login?next=${encodeURIComponent(target)}`);
  }
  const record = await getPrisma().user.findUniqueOrThrow({where:{id:user.id}, select:{passwordHash:true}});
  return <AccountSettings initialAccount={{user, hasPassword:Boolean(record.passwordHash)}} initialMessage={params.error || (params.success === "wechat" ? "微信绑定成功" : "")} />;
}
