const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");

const app = express();

// Web server giả cho Railway
app.get("/", (req, res) => {
  res.send("🔥 Bot Tu Tiên đang chạy!");
});

app.listen(3000, () => {
  console.log("🌐 Web server giả đang chạy");
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("clientReady", async () => {
  console.log("🔥 Bot Tu Tiên đã online!");

  const commands = [
    {
      name: "diemdanh",
      description: "📅 Điểm danh nhận linh thạch mỗi ngày"
    },
    {
      name: "check",
      description: "📜 Xem tu vi và cảnh giới hiện tại"
    },
    {
      name: "haiduocthai",
      description: "🌿 Hái dược (2 tiếng 1 lần)"
    },
    {
      name: "top",
      description: "🏆 Xem top tu vi toàn server"
    },
    {
      name: "dotpha",
      description: "🔥 Đột phá cảnh giới (50% thành công)"
    }
  ];

  await client.application.commands.set(commands);

  console.log("✅ Đã đăng ký toàn bộ slash command!");
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "diemdanh") {
    await interaction.reply("📅 Bạn đã điểm danh và nhận được 100 linh thạch!");
  }

  if (interaction.commandName === "check") {
    await interaction.reply("📜 Tu vi của bạn: Luyện Khí Tầng 1 🔥");
  }

  if (interaction.commandName === "haiduocthai") {
    await interaction.reply("🌿 Bạn đã hái được một cây linh thảo quý hiếm!");
  }

  if (interaction.commandName === "top") {
    await interaction.reply("🏆 Top tu vi hiện tại: (đang cập nhật...)");
  }

  if (interaction.commandName === "dotpha") {
    await interaction.reply("🔥 Bạn thử đột phá... KẾT QUẢ: Thành công! 🎉");
  }
});

client.login(process.env.TOKEN);
