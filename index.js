const { Client, GatewayIntentBits, SlashCommandBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const fs = require('fs');

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const dataPath = './data.json';

function loadData() {
    if (!fs.existsSync(dataPath)) return {};
    return JSON.parse(fs.readFileSync(dataPath));
}

function saveData(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

const commands = [
    new SlashCommandBuilder()
        .setName('diemdanh')
        .setDescription('Điểm danh hàng ngày nhận thưởng (5h sáng reset)')
        .toJSON()
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        );
        console.log('Đã đăng ký slash command.');
    } catch (error) {
        console.error(error);
    }
})();

client.once('ready', () => {
    console.log(Bot online: ${client.user.tag});
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'diemdanh') {

        let users = loadData();
        const userId = interaction.user.id;

        if (!users[userId]) {
            users[userId] = { linhThach: 0, exp: 0, lastCheckIn: 0 };
        }

        const userData = users[userId];
        const now = new Date();

        let nextReset = new Date();
        nextReset.setHours(5, 0, 0, 0);
        if (now >= nextReset) nextReset.setDate(nextReset.getDate() + 1);

        let lastReset = new Date(nextReset);
        lastReset.setDate(lastReset.getDate() - 1);

        if (userData.lastCheckIn >= lastReset.getTime()) {
            const timeLeft = nextReset.getTime() - now.getTime();
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

            return interaction.reply({
                content: ⏳ Bạn đã điểm danh hôm nay rồi!\n🕔 Còn ${hours} giờ ${minutes} phút nữa sẽ được điểm danh lại.,
                ephemeral: true
            });
        }

        userData.lastCheckIn = now.getTime();
        userData.linhThach += 1;
        userData.exp += Math.floor(Math.random() * 91) + 10;

        saveData(users);

        return interaction.reply({
            content: 📅 Điểm danh thành công!\n💎 +1 Linh Thạch\n📈 +EXP ngẫu nhiên,
        });
    }
});

client.login(token);
