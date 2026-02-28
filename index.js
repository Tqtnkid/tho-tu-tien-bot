const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("🔥 Bot Tu Tiên đang chạy!");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
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
equipment: {
    weapon: { power: Number, rarity: String },
    armor: { power: Number, rarity: String },
    gloves: { power: Number, rarity: String },
    boots: { power: Number, rarity: String },
    ring: { power: Number, rarity: String }
},
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
function getRarity() {
    const roll = Math.random() * 100;

    if (roll < 5) return { name: "Truyền Thuyết", color: "🟡", bonus: 40 };
    if (roll < 15) return { name: "Sử Thi", color: "🟣", bonus: 25 };
    if (roll < 40) return { name: "Hiếm", color: "🔵", bonus: 15 };
    return { name: "Thường", color: "⚪", bonus: 5 };
}
function getItemType() {
    const items = [
        { name: "Vũ khí ⚔️", slot: "weapon" },
        { name: "Giáp 🛡️", slot: "armor" },
        { name: "Bao tay 🧤", slot: "gloves" },
        { name: "Ủng 👢", slot: "boots" },
        { name: "Nhẫn 💍", slot: "ring" }
    ];

    return items[Math.floor(Math.random() * items.length)];
}
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
    { name: "haiduoc", description: "Hái dược nhận linh thạch và exp" },
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

    await interaction.deferReply(); // chống timeout

    const userId = interaction.user.id;
    let player = await Player.findOne({ userId });

    if (!player) {
        return interaction.editReply("❌ Bạn chưa tạo nhân vật!");
    }

    const linhthach = Math.floor(Math.random() * 2) + 1;
    const exp = Math.floor(Math.random() * 41) + 10; // 10 - 50 exp

    player.linhthach += linhthach;
    player.exp += exp;

    await player.save();

    return interaction.editReply(`🌿 Bạn hái được ${linhthach} linh thạch\n✨ Nhận ${exp} EXP`);
}

  // 📜 Check
if (interaction.commandName === "check") {

    const user = await User.findOne({ userId: interaction.user.id });
    if (!user) {
        return interaction.reply("❌ Bạn chưa tạo nhân vật!");
    }

    if (!user.equipment) user.equipment = {};

    const weapon = user.equipment.weapon;
    const armor = user.equipment.armor;
    const gloves = user.equipment.gloves;
    const boots = user.equipment.boots;
    const ring = user.equipment.ring;

    const weaponPower = weapon?.power || 0;
    const armorPower = armor?.power || 0;
    const glovesPower = gloves?.power || 0;
    const bootsPower = boots?.power || 0;
    const ringPower = ring?.power || 0;

    const totalPower = weaponPower + armorPower + glovesPower + bootsPower + ringPower;

    let message = `📜 **Thông tin của bạn:**\n\n`;
    message += `🔥 Cảnh giới: ${user.realm}\n`;
    message += `✨ EXP: ${user.exp}\n`;
    message += `💎 Linh thạch: ${user.linhThach}\n`;
    message += `⚔ Lực chiến: ${totalPower}\n\n`;

    message += `🛡 **Trang bị:**\n`;
    message += `⚔️ Vũ khí: ${weapon ? weapon.rarity + " (" + weapon.power + ")" : "Chưa có"}\n`;
    message += `🛡️ Giáp: ${armor ? armor.rarity + " (" + armor.power + ")" : "Chưa có"}\n`;
    message += `🧤 Bao tay: ${gloves ? gloves.rarity + " (" + gloves.power + ")" : "Chưa có"}\n`;
    message += `👢 Ủng: ${boots ? boots.rarity + " (" + boots.power + ")" : "Chưa có"}\n`;
    message += `💍 Nhẫn: ${ring ? ring.rarity + " (" + ring.power + ")" : "Chưa có"}\n`;

    await interaction.reply(message);
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

    const user = await User.findOne({ userId: interaction.user.id });
    if (!user) {
        return interaction.reply("❌ Bạn chưa tạo nhân vật!");
    }

    if (user.linhThach < 1) {
        return interaction.reply("❌ Bạn không đủ linh thạch để quay!");
    }

    // Trừ 1 linh thạch
    user.linhThach -= 1;

    const rarity = getRarity();
    const item = getItemType();

    const basePower = Math.floor(Math.random() * 30) + 10;
    const power = basePower + rarity.bonus;

    let message = `🎰 ${rarity.color} ${rarity.name} ${item.name}\n`;
    message += `💪 Sức mạnh: ${power}\n`;
    message += `💎 -1 Linh thạch\n\n`;

    if (!user.equipment) user.equipment = {};

    const oldItem = user.equipment[item.slot];

    if (!oldItem || power > oldItem.power) {

        if (oldItem) {
            user.exp += 10;
            message += `♻ Trang bị cũ bị rã → +10 EXP\n`;
        }

        user.equipment[item.slot] = {
            power: power,
            rarity: rarity.name
        };

        message += `✨ Trang bị mới mạnh hơn! Đã thay thế.`;

    } else {
        message += `😢 Trang bị yếu hơn. Đã bỏ.`;
    }

    await player.save();
    await interaction.reply(message);
});

client.login(process.env.TOKEN);
