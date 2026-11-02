export type UiLocale = "zh-CN" | "en" | "zh-Hant";

const zh = {
  account: "账户", login: "登录", creator: "创作者", loading: "正在加载账户", accountLabel: "{name}的账户",
  close: "关闭账户浮窗", inviteSignedIn: "内测访问已登录", ssoSignedIn: "已登录 NarrativeOS",
  inviteIdentity: "邀请码身份", creatorIdentity: "NarrativeOS 创作者", currentPlan: "当前订阅",
  credits: "账户积分", arrears: "积分余额 · 欠费", available: "可用积分", recharge: "充值",
  creditsReserved: "{count} 积分正在任务中使用", creditsLoading: "正在获取积分…", creditsError: "积分暂时无法获取，请稍后重新打开",
  space: "我的空间", works: "我的作品", myAssets: "我的资产", assets: "素材库", plaza: "教师资源广场", admin: "平台管理",
  id: "账号 ID", logout: "登出", loggingOut: "登出中…", logoutLabel: "登出账户", logoutError: "登出失败，请稍后重试",
};
export type AccountMessages = { [K in keyof typeof zh]: string };
export const accountMessages: Record<UiLocale, AccountMessages> = {
  "zh-CN": zh,
  en: {
    account: "Account", login: "Sign in", creator: "Creator", loading: "Loading account", accountLabel: "{name}'s account",
    close: "Close account menu", inviteSignedIn: "Signed in with an invitation", ssoSignedIn: "Signed in to NarrativeOS",
    inviteIdentity: "Invitation access", creatorIdentity: "NarrativeOS creator", currentPlan: "Current subscription",
    credits: "Account credits", arrears: "Credits · overdue", available: "Available credits", recharge: "Top up",
    creditsReserved: "{count} credits reserved for active tasks", creditsLoading: "Loading credits…", creditsError: "Credits unavailable. Please reopen the menu to retry.",
    space: "My space", works: "My works", myAssets: "My assets", assets: "Asset library", plaza: "Teacher Resource Plaza", admin: "Administration",
    id: "Account ID", logout: "Sign out", loggingOut: "Signing out…", logoutLabel: "Sign out of account", logoutError: "Unable to sign out. Please retry.",
  },
  "zh-Hant": {
    account: "帳戶", login: "登入", creator: "創作者", loading: "正在載入帳戶", accountLabel: "{name}的帳戶",
    close: "關閉帳戶浮窗", inviteSignedIn: "內測存取已登入", ssoSignedIn: "已登入 NarrativeOS",
    inviteIdentity: "邀請碼身分", creatorIdentity: "NarrativeOS 創作者", currentPlan: "目前訂閱",
    credits: "帳戶積分", arrears: "積分餘額 · 欠費", available: "可用積分", recharge: "儲值",
    creditsReserved: "{count} 積分正在任務中使用", creditsLoading: "正在取得積分…", creditsError: "暫時無法取得積分，請稍後重新開啟",
    space: "我的空間", works: "我的作品", myAssets: "我的資產", assets: "素材庫", plaza: "教師資源廣場", admin: "平台管理",
    id: "帳號 ID", logout: "登出", loggingOut: "登出中…", logoutLabel: "登出帳戶", logoutError: "登出失敗，請稍後重試",
  },
};

export function formatMessage(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
}
