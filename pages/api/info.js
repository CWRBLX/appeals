import { parseSession } from "@/lib/parseSession";
import clientPromise from "@/lib/Mongo";
import Redis from "@/lib/Redis"

const formatAppeal = (appeal) => {
  return {
    createdAt: appeal.createdAt,
    updatedAt: appeal.updatedAt,
    questions: appeal.questions,
  }
}

export default async (req, res) => {
  if (req.method !== "GET") return res.redirect("/");

  const session = await parseSession({ req });

  if (!session) return res.status(401).json({ 
    success: false, 
    message: "Unauthorized" 
  });

  return res.status(200).json({
    success: true,
    message: "Found cached appeal",
    canAppeal: true,
    banReason: "Fuck you",
  });

  const hasCachedAppeal = await Redis.get(`appeal_${session.user.id}`);

  if (hasCachedAppeal) return res.status(200).json({ 
    success: true,
    message: "Found cached appeal",
    data: formatAppeal(JSON.parse(hasCachedAppeal)) 
  });

  // check for a pending appeal
  const client = await clientPromise;
  const db = await client.db(process.env.mongoDbName);
  const appeals = db.collection("appeals");

  const appeal = await appeals.findOne({ user: session.user.id });

  if (appeal) {
    await Redis.set(`appeal_${session.user.id}`, JSON.stringify(appeal), "EX", 60 * 5);
    return res.status(200).json({ 
      success: true, 
      canAppeal: false, 
      data: formatAppeal(appeal), 
      cache: true
    });
  }

  // check for known ban in redis
  const hasCachedBan = await Redis.get(`ban_${session.user.id}`);

  if (hasCachedBan && hasCachedBan !== "{}") {
    return res.status(200).json({ 
      success: true, 
      canAppeal: true, 
      banReason: process.env.displayBanReason === "true" ? JSON.parse(hasCachedBan)?.reason || "No reason provided" : null, 
      cache: true 
    });
  }

  // now query Discord
  const banInfo = await fetch(`https://discord.com/api/guilds/${process.env.discordGuildToAddToId}/bans/${session.user.id}`, {
    headers: {
      Authorization: `Bot ${process.env.discordBotToken}`,
    },
  }).then((res) => res.json());

  if (banInfo?.reason) {
    await Redis.set(`ban_${session.user.id}`, JSON.stringify(banInfo), "EX", 60 * 5);
    return res.status(200).json({ 
      success: true, 
      canAppeal: true, 
      banReason: process.env.displayBanReason === "true" ? banInfo.reason || "No reason provided" : null 
    });
  }

  await Redis.set(`ban_${session.user.id}`, "{}", "EX", 60 * 5);

  return res.status(200).json({ 
    success: true, 
    canAppeal: false 
  });
};