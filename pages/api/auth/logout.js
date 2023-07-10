import { parse } from "cookie";

export default async (req, res) => {
  if (req.method !== "GET") return res.redirect("/");

  const token = parse(req.headers.cookie)[process.env.authCookieName];

  if (!token) return res.redirect("/");

  res.setHeader(
    "Set-Cookie",
    `${process.env.authCookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
  );

  res.redirect("/");
};