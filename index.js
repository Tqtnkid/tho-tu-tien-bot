const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");
const fs = require("fs");

const app = express();
app.get("/", (req, res) => res.send("🔥 Bot Tu Tiên đang chạy!"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Web server running on port " + PORT);
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("🔥 Đã kết nối MongoDB"))
.catch(err => console.log(err));

const playerSchema = new mongoose.Schema({
    userId: String,
    power: { type: Number, default: 0 },
    dailyAttackCount: { type: Number, default: 0 },
    lastAttackDate: { type: Date, default: null },
    lastDiemDanh: { type: Date, default: null },
    linhthach: { type: Number, default: 0 },
    lastdaily: { type: Number, default: 0 },
    exp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    equipment: { type: String, default: null }
});

const Player = mongoose.model("Player", playerSchema);
const realms = ["Luyện Khí", "Trúc Cơ", "Kim Đan", "Nguyên Anh", "Hóa Thần"];
const MAX_EXP = 1000;

client.once("clientReady", async () => {
  console.log("🔥 Bot đã online!");

  const commands = [{
    name: "gacha",description: "🎲 Quay trang bị",
    options: [
        {
            name: "amount",
            description: "Số lần quay",
            type: 4, // INTEGER
            required: true,
            choices: [
                { name: "1 lần", value: 1 },
                { name: "10 lần", value: 10 }]}]},
    { name: "attack", description: "⚔️ Đánh quái (3 lần mỗi ngày)" },
    { name: "diemdanh", description: "📅 Điểm danh mỗi ngày" },
    { name: "haiduoc", description: "🌿 Hái dược 2 tiếng" },
    { name: "check", description: "📜 Xem tu vi" },
    { name: "top", description: "🏆 Top tu vi" },
    { name: "dotpha", description: "🔥 Đột phá cảnh giới" }
  ];

  await client.guilds.cache.get("1454506037179715769")?.commands.set(commands);
console.log("✅ Đăng ký lại guild commands");
});

function getToday5AM() {
    const now = new Date();
    
    // GMT+7
    const offset = 7 * 60; 
    const local = new Date(now.getTime() + offset * 60000);

    const reset = new Date(
        local.getFullYear(),
        local.getMonth(),
        local.getDate(),
        5, 0, 0
    );

    return reset.getTime() - offset * 60000;
}

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
    
    const commandName = interaction.commandName;

  const userId = interaction.user.id;

let user = await Player.findOne({ userId: userId });

if (!user) {
    user = await Player.create({
        userId: userId,
        dailyattackcount: 0,
        inventory: [],
        lastattackreset: 0,
        lastDiemDanh: 0,
        linhthach: 0,
        exp: 0,
        realm: 0,
        stone: 0,
        lastDaily: 0,
        lastHerb: 0
    });
}
  const now = Date.now();

  // 📅 Điểm danh
if (interaction.commandName === "diemdanh") {

    const userId = interaction.user.id;

    let player = await Player.findOne({ userId });

    if (!player) {
        player = new Player({
            userId,
            exp: 0,
            linhthach: 0,
            level: 1,
            lastDiemDanh: null
        });
    }

    const now = new Date();

    if (player.lastDiemDanh) {
        const timeDiff = now - player.lastDiemDanh;
        const hoursPassed = timeDiff / (1000 * 60 * 60);

        if (hoursPassed < 24) {
            const hoursLeft = Math.ceil(24 - hoursPassed);
            return interaction.reply({
                content: `⛔ Bạn đã điểm danh rồi!\n⏳ Quay lại sau ${hoursLeft} giờ nữa.`,
                ephemeral: true
            });
        }
    }

    // Random phần thưởng
    const rewardLinhThach = Math.floor(Math.random() * 2) + 1; // 1 - 2
    const rewardExp = Math.floor(Math.random() * 41) + 10;     // 10 - 50

    player.linhthach += rewardLinhThach;
    player.exp += rewardExp;
    player.lastDiemDanh = now;

    await player.save();

    await interaction.reply({
        content:
            `📅 Điểm danh thành công!\n` +
            `💎 +${rewardLinhThach} Linh Thạch\n` +
            `🔥 +${rewardExp} EXP`
    });
}
     
  // 🌿 Hái dược
  if (interaction.commandName === "haiduoc") {

    const userId = interaction.user.id;
    let player = await Player.findOne({ userId });

    if (!player) {
        player = new Player({
            userId,
            exp: 0,
            linhthach: 0,
            level: 1,
            lastHerb: null
        });
    }

    const now = new Date();

    if (player.lastHerb && (now - player.lastHerb) < 7200000) {
        return interaction.reply("⏳ Chưa đủ 2 tiếng để hái tiếp!");
    }

    const reward = Math.floor(Math.random() * 2) + 1;
    const exp = Math.floor(Math.random() * (100 - 10 + 1)) + 10;

    player.linhthach += reward;
    player.exp += exp;
    player.lastHerb = now;

    await player.save();

    return interaction.reply(
        `🌿 Bạn hái được ${reward} linh thạch 💎\n🔥 +${exp} EXP`
    );
}

  // 📜 Check
if (interaction.commandName === "check") {

    let player = await Player.findOne({ userId: interaction.user.id });

    if (!player) {
        player = await Player.create({
            userId: interaction.user.id
        });
    }

    const realmName = realms[player.level - 1] || "Luyện Khí";

    return interaction.reply(
        `📜 Tu vi của bạn:\n` +
        `🔥 Cảnh giới: ${realmName}\n` +
        `✨ EXP: ${player.exp}/${MAX_EXP}\n` +
        `💎 Linh thạch: ${player.linhthach}`
    );
}

  // 🏆 Top
if (interaction.commandName === "top") {

    const topPlayers = await Player.find()
        .sort({ exp: -1 })
        .limit(5);

    if (topPlayers.length === 0) {
        return interaction.reply("Chưa có ai tu luyện.");
    }

    let msg = "🏆 Top Tu Vi:\n\n";

    topPlayers.forEach((p, i) => {
        msg += `${i + 1}. <@${p.userId}> - ${p.exp} exp 🔥\n`;
    });

    return interaction.reply(msg);
}

// ⚔️ Attack quái
if (interaction.commandName === "attack") {

    const userId = interaction.user.id;
    let player = await Player.findOne({ userId });

    if (!player) {
        player = new Player({
            userId,
            exp: 0,
            linhthach: 0,
            level: 1,
            dailyAttackCount: 0,
            lastAttackDate: null
        });
    }

    const now = new Date();

    // Reset lượt nếu sang ngày mới
    if (player.lastAttackDate) {
        const last = new Date(player.lastAttackDate);
        if (
            last.getDate() !== now.getDate() ||
            last.getMonth() !== now.getMonth() ||
            last.getFullYear() !== now.getFullYear()
        ) {
            player.dailyAttackCount = 0;
        }
    }

    if (player.dailyAttackCount >= 3) {
        return interaction.reply({
            content: "⛔ Bạn đã hết lượt đánh hôm nay (3/3)!",
            ephemeral: true
        });
    }

    // Random thưởng
    const rewardLinhThach = Math.floor(Math.random() * 3) + 1;
    const rewardExp = Math.floor(Math.random() * 31) + 20;

    player.linhthach += rewardLinhThach;
    player.exp += rewardExp;

    player.dailyAttackCount += 1;
    player.lastAttackDate = now;

    await player.save();

    const remaining = 3 - player.dailyAttackCount;

    await interaction.reply({
        content:
            `⚔️ Bạn đánh bại quái vật!\n` +
            `💎 +${rewardLinhThach} linh thạch\n` +
            `🔥 +${rewardExp} EXP\n` +
            `📊 Lượt còn lại hôm nay: ${remaining}/3`
    });
}
    
    // 🎲 Gacha  
if (interaction.commandName === "gacha") {

    const userId = interaction.user.id;
    let player = await Player.findOne({ userId });

    if (!player) {
        return interaction.reply("❌ Bạn chưa tạo nhân vật!");
    }

    const cost = 5;

    if (player.linhthach < cost) {
        return interaction.reply("❌ Không đủ 5 linh thạch!");
    }

    player.linhthach -= cost;

    // Random sức mạnh 1 - 100
    const newPower = Math.floor(Math.random() * 100) + 1;

    let message = `🎰 Bạn quay ra trang bị sức mạnh ${newPower}\n`;

    if (newPower > player.power) {

        // Nếu có đồ cũ thì rã thành exp
        if (player.power > 0) {
            player.exp += 10;
            message += "♻️ Trang bị cũ bị rã → +10 EXP\n";
        }

        player.power = newPower;
        player.equipment = `Trang bị ${newPower}`;

        message += "✨ Trang bị mới mạnh hơn! Đã thay thế.";
    } else {
        message += "😢 Trang bị yếu hơn. Đã bỏ.";
    }

    await player.save();

    return interaction.reply(message);
}
    
  // 🔥 Đột phá
 else if (commandName === "dotpha") {
        const player = await Player.findOne({ userId: interaction.user.id });

        if (!player) {
            return interaction.reply("❌ Bạn chưa có nhân vật!");
        }

        const rate = 0.5; // 50% tỉ lệ
        const random = Math.random();

        if (random < rate) {

            if (player.level < 10) {
                player.level += 1;
                player.exp = 0;

                await player.save();

                return interaction.reply("🎉 Đột phá thành công!");
            } else {
                return interaction.reply("🌟 Bạn đã đạt cảnh giới cao nhất!");
            }

        } else {
            return interaction.reply("💥 Đột phá thất bại!");
        }
    }
});

client.login(process.env.TOKEN);
