import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next.js 16+ uses 'proxy' instead of 'middleware'. The proxy runtime is nodejs
// (no edge support). next-intl works fine on nodejs runtime.
export const proxy = createMiddleware(routing);

export const config = {
  // Match everything except api, Next internals, and files with an extension.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
