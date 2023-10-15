import { parseSession } from "@/lib/parseSession";
import clientPromise from "@/lib/Mongo";
import Redis from "@/lib/Redis"
import config from "@/config.json";
import { v4 as uuidv4 } from "uuid";

export default async (req, res) => {
    if (req.method !== "POST") return res.redirect("/");

    const session = await parseSession({ req });

    if (!session) return res.status(401).json({ 
        success: false, 
        message: "Unauthorized" 
    });

    const client = await clientPromise;
    const db = await client.db(process.env.mongoDbName);
    const appeals = db.collection("appeals");

    const appeal = await appeals.findOne({ user: session.user.id });

    if (appeal) {
        return res.status(400).json({
            success: false,
            message: "You already have a pending appeal",
        });
    }

    const hasCachedBan = await Redis.get(`ban_${session.user.id}`);

    let ban;

    if (hasCachedBan) {
        if (hasCachedBan === "{}") {
            /*return res.status(400).json({
                success: false,
                message: "You are not banned",
            });*/
        }
        else {
            ban = JSON.parse(hasCachedBan);
        }
    }
    else {
        const banInfo = await fetch(`https://discord.com/api/guilds/${process.env.discordGuildToAddToId}/bans/${session.user.id}`, {
            headers: {
                Authorization: `Bot ${process.env.discordBotToken}`,
            },
        }).then((res) => res.json());

        if (banInfo?.reason) {
            await Redis.set(`ban_${session.user.id}`, JSON.stringify(banInfo), "EX", 60 * 5);
            ban = banInfo;
        }
        else {
            await Redis.set(`ban_${session.user.id}`, "{}", "EX", 60 * 5);
        }
    }

    if (!ban) {
        /*return res.status(400).json({
            success: false,
            message: "You are not banned",
        });*/
    }

    // look for body and get all fields starting with q
    const questions = Object.keys(req.body).filter((key) => key.startsWith("q"));

    if (questions.length < 1) {
        return res.status(400).json({
            success: false,
            message: "You must answer at least one question",
        });
    }

    const responses = []

    for (const question of questions) {
        const questionNumber = question.replace("q", "");

        if (isNaN(questionNumber) || !config.questions[Number(questionNumber - 1)]) {
            res.status(400).json({
                success: false,
                message: "Invalid question",
            });
            break;
        }

        responses.push({
            question,
            answer: req.body[question],
        });
    }

    const appealData = {
        id: uuidv4(),
        user: session.user.id,
        responses,
        ban,
        createdAt: Date.now(),
    }

    await appeals.insertOne(appealData);
    await Redis.set(`appeal_${session.user.id}`, JSON.stringify(appealData), "EX", 60 * 5);

    // send to discord with bot and button to manage appeal
};