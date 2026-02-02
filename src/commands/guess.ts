import { ChatInputCommandInteraction, EmbedBuilder, TextChannel } from 'discord.js';
import pluralize from 'pluralize';
import * as fs from 'fs';
import { getBalance, changeBalance } from '../utilities/balance';
import { randomInt } from '../utilities/random';
import config from '../../config/config.json';
import localization from '../../resources/localization.json';
import { getDataPath } from '../utilities/initData';

interface TempData {
    guessRound: {
        num: number | false;
        max: number;
        total: number;
        guessed: number[];
    };
    channels: any[];
    users: { [key: string]: number };
    bots: boolean;
    odds: number;
    deltaOdds: number;
}

let temp: TempData;

function loadTemp(): void {
    temp = JSON.parse(fs.readFileSync(getDataPath('temp.json'), 'utf-8'));
}

function saveTemp(): void {
    fs.writeFileSync(getDataPath('temp.json'), JSON.stringify(temp, null, 4));
}

export default function (interaction: ChatInputCommandInteraction) {
    loadTemp();
    
    const guess = interaction.options.getInteger('number');
    const user = interaction.user;

    if (temp.guessRound.num === false) {
        temp.guessRound.max = randomInt(1, 5) * 100;
        temp.guessRound.num = randomInt(0, temp.guessRound.max);
        temp.guessRound.total = Math.round(temp.guessRound.max / 20);
        saveTemp();
    }

    if (!guess && guess !== 0) {
        interaction.reply({ embeds: [generateGuessRoundEmbed()] });
    } else {
        if (getBalance(user.id) <= 0) { 
            interaction.reply(localization.error.no_cats); 
            return;
        }
        if (temp.guessRound.guessed.includes(guess) || guess < 0 || guess > temp.guessRound.max) { 
            interaction.reply('Choose a different number.'); 
            return;
        }
        
        changeBalance(user.id, -1);
        temp.guessRound.guessed.push(guess);
        temp.guessRound.total++;

        if (guess === temp.guessRound.num) {
            interaction.reply(`**${user.username}** won ${pluralize('cat', temp.guessRound.total, true)}! Winning number was ${temp.guessRound.num}.`);
            changeBalance(user.id, temp.guessRound.total);
            temp.guessRound.num = false;
            temp.guessRound.guessed = [];
        } else {
            interaction.reply(`**${user.username}** guessed number ${guess}.`);
            if (interaction.channel instanceof TextChannel) {
                interaction.channel.send({ embeds: [generateGuessRoundEmbed()] });
            }
        }

        saveTemp();
    }
}

function generateGuessRoundEmbed(): EmbedBuilder {
    let numList = `Maximum guess for this round: ${temp.guessRound.max}\n\nGuessed numbers: `;
    const embed = new EmbedBuilder()
        .setAuthor({
            name: `Guessing Round - Total: ${pluralize('cat', temp.guessRound.total, true)}`,
            iconURL: 'https://media.discordapp.net/attachments/1467535812391473203/1467549353895002142/youwhat.png?ex=6980c957&is=697f77d7&hm=f27f8414a1627bb833827e2a1144b7445096b9cdec5aca45876a930585f2d362'
        })
        .setColor(config.embedColor);
    
    if (temp.guessRound.guessed[0] !== undefined && temp.guessRound.guessed[0] !== null) {
        let nums = temp.guessRound.guessed.sort((a, b) => a - b);
        for (let i = 0; i < nums.length - 1; i++) {
            numList += `${nums[i]}, `;
        }
        numList += nums[nums.length - 1];
    } else { 
        numList += 'none';
    }
    
    embed.setDescription(numList);
    embed.setFooter({ text: `Guess check cost: ${getGuessCheckCost()}` });
    
    return embed;
}

function getGuessCheckCost(): number {
    return 25 + Math.floor(temp.guessRound.guessed.length / 5);
}