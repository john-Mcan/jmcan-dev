import { getRequestConfig } from "next-intl/server";
import { defaultLocale } from "./config";

export default getRequestConfig(async () => {
  // Requisito: no detección por request. Default siempre Español.
  return {
    locale: defaultLocale,
    messages: (await import(`@/messages/${defaultLocale}.json`)).default,
  };
});

