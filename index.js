const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = "DÁN_TOKEN_BẠN_VÀO_ĐÂY";

// ================= DATA =================

let data = {};

if (fs.existsSync("data.json")) {
  data = JSON.parse(fs.readFileSync("data.json"));
}

function saveData() {
  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
}

// ================= CẢNH GIỚI =================

const realms = [
  { name: "Phàm Nhân", min: 0 },
  { name: "Luyện Khí", min: 500 },
  { name: "Trúc Cơ", min: 1500 },
  { name: "Kim Đan", min: 3000 },
  { name: "Nguyên Anh", min: 6000 },
  { name: "Hóa Thần", min: 12000 }
];

function canDaily(user) {
  const now = new Date();
  const reset = new Date();
  reset.setHours(5, 0, 0, 0);
  if (now < reset) reset.setDate(reset.getDate() - 1);
  return !user.lastDaily || user.lastDaily < reset.getTime();
}

function getUser(id) {
  if (!data[id]) {
    data[id] = {
      exp: 0,
      linhThach: 0,
      realm: 0,
      lastDaily: 0,
      lastHerb: 0
    };
  }
  return data[id];
}

// ================= BOT READY =================

client.once("ready", () => {
  console.log("Bot Tu Tiên đã online 🔥");
});

// ================= COMMAND =================

client.on("interactionCreate", async interaction => {

  if (!interaction.isChatInputCommand()) return;

  const id = interaction.user.id;
  const user = getUser(id);

  // ================= DIEM DANH =================

  if (interaction.commandName === "diemdanh") {

    if (!canDaily(user)) {
      return interaction.reply("❌ Đã điểm danh hôm nay. 5h sáng quay lại.");
    }

    const reward = Math.floor(Math.random() * 151) + 50;

    user.exp += reward;
    user.lastDaily = Date.now();

    saveData();

    return interaction.reply(
      🌅 Điểm danh thành công!\n✨ +${reward} EXP\n🧘 Tu vi: ${user.exp}
    );
  }

  // ================= HAI DUOC =================

  if (interaction.commandName === "haidược") {

    const cooldown = 7200000;
    const now = Date.now();

    if (user.lastHerb && now - user.lastHerb < cooldown) {

      const timeLeft = cooldown - (now - user.lastHerb);
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

      return interaction.reply(
       🌿 Còn ${hours}h ${minutes}p nữa mới hái tiếp được.`
      );
    }

    const rewardExp = Math.floor(Math.random() * 201) + 100;
    const rewardStone = Math.floor(Math.random() * 3) + 1;

    user.exp += rewardExp;
    user.linhThach += rewardStone;
    user.lastHerb = now;

    saveData();

    return interaction.reply(
     🌿 Hái dược thành công!\n` +
      ✨ +${rewardExp} EXP\n +
     💎 +${rewardStone} Linh Thạch\n\n` +
     🧘 Tu vi: ${user.exp}\n` +
     💰 Linh Thạch: ${user.linhThach}`
    );
  }

  // ================= DOT PHA =================

  if (interaction.commandName === "dotpha") {

    if (user.realm >= realms.length - 1) {
      return interaction.reply("🌌 Đã đạt cảnh giới tối cao!");
    }

    const nextRealm = realms[user.realm + 1];

    if (user.exp < nextRealm.min) {
      return interaction.reply(
        ❌ Cần ${nextRealm.min} EXP để đột phá ${nextRealm.name}
      );
    }

    const success = Math.random() < 0.5;

    if (success) {

      user.realm += 1;
      saveData();

      return interaction.reply(
       🌟 ĐỘT PHÁ THÀNH CÔNG!\n🔥 ${realms[user.realm - 1].name} ➜ ${realms[user.realm].name}`
      );

    } else {

      const currentMin = realms[user.realm].min;
      const nextMin2 = realms[user.realm + 1].min;

      const range = nextMin2 - currentMin;
      const percent = Math.random() * 0.05 + 0.05;
      const loss = Math.floor(range * percent);

      user.exp -= loss;
      if (user.exp < currentMin) user.exp = currentMin;

      saveData();

      return interaction.reply(
       💥 Đột phá thất bại!\n⚡ Mất ${loss} EXP\n🧘 Tu vi còn: ${user.exp}`
      );
    }
  }

  // ================= CHECK =================

  if (interaction.commandName === "check") {

    return interaction.reply(
     🧘 Tu vi: ${user.exp}\n` +
     🔥 Cảnh giới: ${realms[user.realm].name}\n` +
     💎 Linh Thạch: ${user.linhThach}`
    );
  }

  // ================= TOP =================

  if (interaction.commandName === "top") {

    const sorted = Object.entries(data)
      .sort((a, b) => b[1].exp - a[1].exp)
      .slice(0, 10);

    let msg = "🏆 BẢNG XẾP HẠNG TU VI 🏆\n\n";

    for (let i = 0; i < sorted.length; i++) {

      const userId = sorted[i][0];
      const u = sorted[i][1];

      msg +=
        #${i + 1} <@${userId}>\n +
       🧘 ${u.exp} EXP | 🔥 ${realms[u.realm].name}\n\n`;
    }

    return interaction.reply(msg);
  }

});

client.login(TOKEN);
