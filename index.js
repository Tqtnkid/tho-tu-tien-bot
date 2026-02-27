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
    linhthach: { type: Number, default: 0 },
    lastdaily: { type: Number, default: 0 },
    exp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    equipment: { type: Array, default: [] }
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

  const userId = interaction.user.id;

let user = await Player.findOne({ userId: userId });

if (!user) {
    user = await Player.create({
        userId: userId,
        dailyattackcount: 0,
        inventory: [],
        lastattackreset: 0,
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

    const now = Date.now();

    let player = await Player.findOne({ userId: interaction.user.id });

    // Nếu chưa có dữ liệu thì tạo mới
    if (!player) {
        player = await Player.create({
            userId: interaction.user.id
        });
    }

    // Nếu đã điểm danh trong 24h
    if (now - player.lastDaily < 86400000) {
        return interaction.reply("⏳ Bạn đã điểm danh hôm nay rồi!");
    }

    // Random thưởng
    const linhthach = Math.floor(Math.random() * 2) + 1;   // 1–2 linh thạch
    const exp = Math.floor(Math.random() * 91) + 10;       // 10–100 exp

    // Cộng thưởng
    player.linhthach += linhthach;
    player.exp += exp;
    player.lastDaily = now;

    await player.save();

    return interaction.reply(
        `📅 Điểm danh thành công!\n` +
        `💎 Nhận ${linhthach} linh thạch\n` +
       `🔥 Nhận ${exp} EXP`
    );
}

  // 🌿 Hái dược
  if (interaction.commandName === "haiduoc") {
    if (now - user.lastHerb < 7200000)
      return interaction.reply("⏳ Chưa đủ 2 tiếng để hái tiếp!");

    const reward = Math.floor(Math.random() * 2) + 1;
    const exp = Math.floor(Math.random() * (100 - 10 + 1)) + 10;
    
    user.linhthach += linhthach;
    user.exp += exp;
    user.lastHerb = now;
    
    await user.save();

    return interaction.reply(`🌿 Bạn hái dược Nhận ${linhthach}  linh thạch 💎 và Nhận ${exp} exp 🔥`);
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
    const now = Date.now();

   let user = await Player.findOne({ userId });

if (!user) {
    user = new Player({
        userId: userId,
        linhthach: 0,
        exp: 0,
        lastDaily: 0,
        lastHerb: 0,
        lastAttackReset: 0,
        dailyAttackCount: 0
    });
    await user.save();
}
  
    if (!user.dailyAttackCount) user.dailyAttackCount = 0;
    if (!user.lastAttackReset) user.lastAttackReset = 0;

    const today5AM = getToday5AM();

    // Nếu đã qua 5h sáng và chưa reset hôm nay
    if (now >= today5AM && user.lastAttackReset < today5AM) {
        user.dailyAttackCount = 0;
        user.lastAttackReset = today5AM;
    }

    if (user.dailyAttackCount >= 3) {
        return interaction.reply("⛔ Bạn đã đánh đủ 3 lần hôm nay rồi! Chờ 5h sáng reset.");
    }

    const linhthach = Math.floor(Math.random() * 4); // 0-3
    const exp = Math.floor(Math.random() * (50 - 10 + 1)) + 10;

    user.linhthach += linhthach;
    user.exp += exp;
    user.dailyAttackCount += 1;

    await user.save();

    return interaction.reply(
        `⚔️ Bạn đánh bại quái vật!\n` +
        `💎 +${linhthach} linh thạch\n` +
        `🔥 +${exp} EXP\n` +
        `📊 Lượt còn lại hôm nay: ${3 - user.dailyAttackCount}/3`
    );
}
    // 🎲 Gacha  
if (interaction.commandName === "gacha") {

    const userId = interaction.user.id;

    let user = await Player.findOne({ userId });

if (!user) {
    user = new Player({
        userId: userId,
        linhthach: 0,
        exp: 0,
        lastDaily: 0,
        lastHerb: 0,
        lastAttackReset: 0,
        dailyAttackCount: 0
    });
    await user.save();
}
    const amount = interaction.options.getInteger("amount");

    if (user.linhthach < amount) {
        return interaction.reply("❌ Không đủ linh thạch!");
    }

    user.linhthach -= amount;

    const items = ["Nhẫn", "Găng Tay", "Ủng", "Giáp", "Vũ Khí"];

    let resultText = "";

    for (let i = 0; i < amount; i++) {

        // 🎯 Random phẩm chất
        const rarityRoll = Math.random();
        let rarity;
        let basePower;

        if (rarityRoll < 0.6) {
            rarity = "Thường";
            basePower = 5;
        } else if (rarityRoll < 0.85) {
            rarity = "Hiếm";
            basePower = 15;
        } else if (rarityRoll < 0.97) {
            rarity = "Sử Thi";
            basePower = 30;
        } else {
            rarity = "Truyền Thuyết";
            basePower = 60;
        }

        // ⭐ Level càng cao càng hiếm
        const levelRoll = Math.random();
        let level;

        if (levelRoll < 0.25) level = 1;
        else if (levelRoll < 0.45) level = 2;
        else if (levelRoll < 0.60) level = 3;
        else if (levelRoll < 0.72) level = 4;
        else if (levelRoll < 0.82) level = 5;
        else if (levelRoll < 0.90) level = 6;
        else if (levelRoll < 0.95) level = 7;
        else if (levelRoll < 0.98) level = 8;
        else if (levelRoll < 0.995) level = 9;
        else level = 10;

        const itemName = items[Math.floor(Math.random() * items.length)];
        const power = basePower * level + Math.floor(Math.random() * 10);

        const equipment = {
            name: itemName,
            rarity: rarity,
            level: level,
            power: power
        };

        user.inventory.push(equipment);

        // 🟡 Nếu +10 Truyền Thuyết
        if (level === 10 && rarity === "Truyền Thuyết") {

            const { EmbedBuilder } = require("discord.js");

            const embed = new EmbedBuilder()
                .setTitle("🌟 VẬT PHẨM TỐI THƯỢNG 🌟")
                .setDescription(
                   `💛 ${itemName} +10 (Truyền Thuyết)\n\n` +
                   `🔥 Lực chiến: ${power}`
                )
                .setColor(0xFFD700);

            await user.save();

            return interaction.reply({ embeds: [embed] });
        }

        resultText += `✨ ${itemName} +${level} (${rarity}) - ⚔️ ${power}\n`;
    }

    await user.save();

    return interaction.reply(`🎲 Bạn quay ${amount} lần!\n\n${resultText}`
    );
}
    
  // 🔥 Đột phá
 if (interaction.commandName === "dotpha") {

    let player = await Player.findOne({ userId: interaction.user.id });

    if (!player) {
        player = await Player.create({ userId: interaction.user.id });
    }

    if (player.exp < MAX_EXP) {
        return interaction.reply("❌ Chưa đủ EXP để đột phá!");
    }

    const success = Math.random() < 0.5;

    if (success) {

        if (player.level < realms.length - 1) {

            player.level += 1;
            player.exp = 0;

            await player.save(); // ✅ CHỈ CẦN CÁI NÀY

            return interaction.reply("🎉 Đột phá thành công!");
        } else {
            return interaction.reply("🌟 Bạn đã đạt cảnh giới cao nhất!");
        }

    } else {
        return interaction.reply("💥 Đột phá thất bại!");
    }
});

client.login(process.env.TOKEN);
