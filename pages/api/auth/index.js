import { serialize } from "cookie";
import { sign } from "jsonwebtoken";
import { parseSession } from "@/lib/parseSession";
import clientPromise from "@/lib/Mongo";

const scope = ["identify", "guilds.join", "email"].join(" ");
const REDIRECT_URI = `${process.env.siteUrl}/api/auth`;

const OAUTH_QS = new URLSearchParams({
  client_id: process.env.discordClientId,
  redirect_uri: REDIRECT_URI,
  response_type: "code",
  scope,
}).toString();

const OAUTH_URI = `https://discord.com/api/oauth2/authorize?${OAUTH_QS}`;

export default async (req, res) => {
  if (req.method !== "GET") return res.redirect("/");

  const { code = null, error = null } = req.query;

  if (error) {
    console.log(`Error: ${error}`);
    return res.redirect(`/?error=${error}`);
  }

  const session = await parseSession({ req });

  if (session) {
    console.log(`Already logged in!`)
    return res.redirect(`/`);
  }

  if (!code || typeof code !== "string") {
    console.log(`No code provided!`)
    return res.redirect(OAUTH_URI);
  }

  const body = new URLSearchParams({
    client_id: process.env.discordClientId,
    client_secret: process.env.discordClientSecret,
    grant_type: "authorization_code",
    redirect_uri: REDIRECT_URI,
    code,
    scope,
  }).toString();

  const { access_token = null, refresh_token = null, token_type = "Bearer" } = await fetch("https://discord.com/api/oauth2/token", {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    method: "POST",
    body,
  }).then((res) => res.json());

  if (!access_token || typeof access_token !== "string") {
    console.log(`No access token provided!`)
    return res.redirect(OAUTH_URI);
  }

  const me = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `${token_type} ${access_token}` },
  }).then((res) => res.json());

  if (!("id" in me)) {
    console.log(`No user id provided!`)
    return res.redirect(OAUTH_URI);
  }

  const client = await clientPromise;
  const db = await client.db(process.env.mongoDbName);
  const collection = await db.collection("appealUsers");

  const user = await collection.findOne({ id: me.id });

  if (!user) {
    await collection.insertOne({
      id: me.id,
      username: me.username,
      avatar: me.avatar,
      email: me.email,
      accessToken: access_token,
      refreshToken: refresh_token,
      createdAt: new Date(),
      lastLogin: new Date()
    });
  } else {
    await collection.updateOne({ id: me.id }, {
      $set: {
        username: me.username,
        avatar: me.avatar,
        email: me.email,
        accessToken: access_token,
        refreshToken: refresh_token,
        lastLogin: new Date()
      }
    });
  }

  const token = sign(me, process.env.authSecret, { expiresIn: 60 * 60 * 24 * 7 }); // 7 days

  res.setHeader(
    "Set-Cookie",
    serialize(process.env.authCookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "lax",
      path: "/",
    })
  );

  res.redirect(`/`);
};