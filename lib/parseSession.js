import { parse } from "cookie";
import { verify } from "jsonwebtoken";

const formatUser = (user) => {
  return {
    ...user,
    image: user?.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}?size=1024` : `https://cdn.discordapp.com/embed/avatars/${Number(user.id) % 5}.png`,
    name: user.username,
  };
};

export function parseSession(ctx) {
  if (!ctx.req.headers.cookie) {
    return null;
  }

  const token = parse(ctx.req.headers.cookie)[process.env.authCookieName];

  if (!token) {
    return null;
  }

  try {
    const { iat, exp, ...user } = verify(token, process.env.authSecret);
    return { user: formatUser(user) };
  } catch (e) {
    return null;
  }
}

export function parseSessionClientSide() {
  return fetch("/api/auth/auth").then((res) => res.json());
}