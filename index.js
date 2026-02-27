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

  if (!players[userId]) {
    players[userId] = {
      dailyattackcount: 0,
      lastattackreset: 0,
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

const stone = Math.floor(Math.random() * 2) + 1;
const exp = Math.floor(Math.random() * (100 - 10 + 1)) + 10;
    
user.stone += stone;
user.exp += exp;
user.lastDaily = now;
    
saveData(players);

return interaction.reply(`📅 Điểm danh thành công!\n💎 Nhận ${stone} linh thạch\n🔥 Nhận ${exp} EXP`);
  }

  // 🌿 Hái dược
  if (interaction.commandName === "haiduoc") {
    if (now - user.lastHerb < 7200000)
      return interaction.reply("⏳ Chưa đủ 2 tiếng để hái tiếp!");

    const reward = Math.floor(Math.random() * 2) + 1;
    const exp = Math.floor(Math.random() * (100 - 10 + 1)) + 10;
    
    user.stone += reward;
    user.exp += exp;
    user.lastHerb = now;
    
    saveData(players);

    return interaction.reply(`🌿 Bạn hái được Nhận ${reward}  linh thạch 💎 và Nhận ${exp} exp 🔥`);
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

    let msg =`🏆 Top Tu Vi:\n`;
    sorted.forEach((p, i) => {
      msg += `${i + 1}. <@${p[0]}> - ${p[1].exp} exp 🔥\n`;
    });

    return interaction.reply(msg);
  }

// ⚔️ Attack quái
if (interaction.commandName === "attack") {

    const userId = interaction.user.id;
    const now = Date.now();

    if (!players[userId]) {
        players[userId] = {
            stone: 0,
            LastAttackReset: 0,
            exp: 0,
            lastDaily: 0,
            lastHerb: 0,
            dailyAttackCount: 0
        };
    }

    const user = players[userId];
  
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

    const stone = Math.floor(Math.random() * 4); // 0-3
    const exp = Math.floor(Math.random() * (50 - 10 + 1)) + 10;

    user.stone += stone;
    user.exp += exp;
    user.dailyAttackCount += 1;

    saveData(players);

    return interaction.reply(
        `⚔️ Bạn đánh bại quái vật!\n` +
        `💎 +${stone} linh thạch\n` +
        `🔥 +${exp} EXP\n` +
        `📊 Lượt còn lại hôm nay: ${3 - user.dailyAttackCount}/3`
    );
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
        return interaction.reply(`🎉 Đột phá thành công! Bạn đã lên ${realms[user.realm]} 🔥`);
      } else {
        return interaction.reply("🌟 Bạn đã đạt cảnh giới cao nhất!");
      }
    } else {
      const loss = Math.floor(user.exp * (Math.random() * 0.05 + 0.05));
      user.exp -= loss;
      saveData(players);
      return interaction.reply(`💥 Đột phá thất bại! Mất ${loss} exp 😭`);
    }
    }
  });

client.login(process.env.TOKEN);
