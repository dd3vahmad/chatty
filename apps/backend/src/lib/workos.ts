import { WorkOS } from "@workos-inc/node";
import { config } from "dotenv";

config();

export const workos = new WorkOS(process.env.WORKOS_API_KEY, {
  clientId: process.env.WORKOS_CLIENT_ID,
});

const getSession = async (cookie: string) => {
  const session = workos.userManagement.loadSealedSession({
    sessionData: cookie,
    cookiePassword: process.env.WORKOS_COOKIE_PASSWORD,
  });

  return await session.authenticate();
};

export const isAuthenticated = async (cookie: string) => {
  const result = await getSession(cookie);
  return result.authenticated;
};

export const getUser = async (cookie: string) => {
  const result = await getSession(cookie);

  if (result.authenticated) {
    return result.user;
  } else {
    return null;
  }
};
