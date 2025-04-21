import { defineMiddleware } from "astro:middleware";
import { workos } from "./lib/workos";
import type { APIContext, MiddlewareNext } from "astro";

const withAuth = async (context: APIContext, next: MiddlewareNext) => {
  const { cookies, redirect, url } = context;
  const session = workos.userManagement.loadSealedSession({
    sessionData: cookies.get("x-auth-token")?.value as string,
    cookiePassword: import.meta.env.WORKOS_COOKIE_PASSWORD,
  });

  const result = await session.authenticate();

  if (result.authenticated) {
    return next();
  }

  // If the cookie is missing, redirect to login
  if (!result.authenticated && result.reason === "no_session_cookie_provided") {
    return redirect("/auth/login");
  }

  // If the session is invalid, attempt to refresh
  try {
    const result = await session.refresh();

    if (!result.authenticated) {
      return redirect("/auth/login");
    }

    // Update the cookie
    cookies.set("x-auth-token", result.sealedSession as string, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });

    // Redirect to the same route to ensure the updated cookie is used
    return redirect(url.pathname);
  } catch (e) {
    cookies.delete("x-auth-token");
    return redirect("/auth/login");
  }
};

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const isAuthRoute = pathname.startsWith("/auth");
  const isApiRoute = pathname.startsWith("/api");
  const isPublicRoute = pathname.startsWith("/p");

  if (!isAuthRoute && !isApiRoute && !isPublicRoute) {
    return await withAuth(context, next);
  } else {
    return next();
  }
});
