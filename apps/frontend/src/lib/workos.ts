import { WorkOS } from "@workos-inc/node";
import type { AstroCookies } from "astro";

export const workos = new WorkOS(import.meta.env.WORKOS_API_KEY, {
  clientId: import.meta.env.WORKOS_CLIENT_ID,
});

export const isAuthenticated = async (cookies: AstroCookies) => {
  const cookieSession = cookies.get("x-auth-token");

  const session = workos.userManagement.loadSealedSession({
    sessionData: cookieSession?.value as string,
    cookiePassword: import.meta.env.WORKOS_COOKIE_PASSWORD,
  });

  return (await session.authenticate()).authenticated;
};
