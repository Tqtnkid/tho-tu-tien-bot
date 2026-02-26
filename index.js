const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");
const fs = require("fs");

const app = express();
app.get("/", (req, res) => res.send("🔥 Bot Tu Tiên đang chạy!"));
app.listen(3000);

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const DATA_FILE = "data.json";

function loadData() {
  if (!fs.existsSync(DATA_FILE)) return {};
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

let players = loadData();

const realms = ["Luyện Khí", "Trúc Cơ", "Kim Đan", "Nguyên Anh", "Hóa Thần"];
const MAX_EXP = 1000;

client.once("clientReady", async () => {
  console.log("🔥 Bot đã online!");

  const commands = [
    { name: "diemdanh", description: "📅 Điểm danh mỗi ngày" },
    { name: "haiduocthai", description: "🌿 Hái dược 2 tiếng" },
    { name: "check", description: "📜 Xem tu vi" },
    { name: "top", description: "🏆 Top tu vi" },
    { name: "dotpha", description: "🔥 Đột phá cảnh giới" }
  ];

  await client.application.commands.set(commands);
  console.log("✅ Đã đăng ký slash command!");
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const userId = interaction.user.id;

  if (!players[userId]) {
    players[userId] = {
      exp: 0,
      realm: 0,
      stone: 0,
      lastDaily: 0,
      lastHerb: 0
    };
  }

  const user = players[userId];
  const now = Date.now();

  // 📅 Điểm danh
  if (interaction.commandName === "diemdanh") {
    if (now - user.lastDaily < 86400000)
      return interaction.reply("⏳ Bạn đã điểm danh hôm nay rồi!");

    user.stone += 100;
    user.exp += 100;
    user.lastDaily = now;
    saveData(players);

    return interaction.reply📅 Điểm danh thành công! +100 linh thạch 💎 +100 exp 🔥`);
  }

  // 🌿 Hái dược
  if (interaction.commandName === "haiduocthai") {
    if (now - user.lastHerb < 7200000)
      return interaction.reply("⏳ Chưa đủ 2 tiếng để hái tiếp!");

    const reward = Math.floor(Math.random() * 3) + 1;
    user.stone += reward;
    user.exp += 50;
    user.lastHerb = now;
    saveData(players);

    return interaction.reply🌿 Bạn hái được ${reward} linh thạch 💎 và +50 exp 🔥`);
  }

  // 📜 Check
  if (interaction.commandName === "check") {
    return interaction.reply(
      `📜 Tu vi của bạn:
🔥 Cảnh giới: ${realms[user.realm]}
✨ EXP: ${user.exp}/${MAX_EXP}
💎 Linh thạch: ${user.stone}`
    );
  }

  // 🏆 Top
  if (interaction.commandName === "top") {
    const sorted = Object.entries(players)
      .sort((a, b) => b[1].exp - a[1].exp)
      .slice(0, 5);

    let msg =🏆 Top Tu Vi:\n`;
    sorted.forEach((p, i) => {
      msg += ${i + 1}. <@${p[0]}> - ${p[1].exp} exp 🔥\n;
    });

    return interaction.reply(msg);
  }

  // 🔥 Đột phá
  if (interaction.commandName === "dotpha") {
    if (user.exp < MAX_EXP)
      return interaction.reply("❌ Chưa đủ exp để đột phá!");

    const success = Math.random() < 0.5;

    if (success) {
      if (user.realm < realms.length - 1) {
        user.realm += 1;
        user.exp = 0;
        saveData(players);
        return interaction.reply🎉 Đột phá thành công! Bạn đã lên ${realms[user.realm]} 🔥`);
      } else {
        return interaction.reply("🌟 Bạn đã đạt cảnh giới cao nhất!");
      }
    } else {
      const loss = Math.floor(user.exp * (Math.random() * 0.05 + 0.05));
      user.exp -= loss;
      saveData(players);
      return interaction.reply💥 Đột phá thất bại! Mất ${loss} exp 😭`);
    }
  }
});

client.login(process.env.TOKEN);
