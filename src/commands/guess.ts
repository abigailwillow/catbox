import { ChatInputCommandInteraction, EmbedBuilder, TextChannel } from 'discord.js';
import pluralize from 'pluralize';
import { getBalance, changeBalance } from '../utilities/balance';
import { randomInt } from '../utilities/random';
import config from '../../config/config.json';
import localization from '../../resources/localization.json';
import { getTempData, setTempData } from '../utilities/database';

interface GuessRound {
    num: number | false;
    max: number;
    total: number;
    guessed: number[];
}

function getGuessRound(): GuessRound {
    const data = getTempData('guessRound');
    return data || {
        num: false,
        max: 100,
        total: 0,
        guessed: []
    };
}

function saveGuessRound(guessRound: GuessRound): void {
    setTempData('guessRound', guessRound);
}

export default function (interaction: ChatInputCommandInteraction) {
    const temp = getGuessRound();
    
    const guess = interaction.options.getInteger('number');
    const user = interaction.user;

    if (temp.num === false) {
        temp.max = randomInt(1, 5) * 100;
        temp.num = randomInt(0, temp.max);
        temp.total = Math.round(temp.max / 20);
        saveGuessRound(temp);
    }

    if (!guess && guess !== 0) {
        interaction.reply({ embeds: [generateGuessRoundEmbed(temp)] });
    } else {
        if (getBalance(user.id) <= 0) { 
            interaction.reply(localization.error.no_cats); 
            return;
        }
        if (temp.guessed.includes(guess) || guess < 0 || guess > temp.max) { 
            interaction.reply('Choose a different number.'); 
            return;
        }
        
        changeBalance(user.id, -1);
        temp.guessed.push(guess);
        temp.total++;

        if (guess === temp.num) {
            interaction.reply(`**${user.username}** won ${pluralize('cat', temp.total, true)}! Winning number was ${temp.num}.`);
            changeBalance(user.id, temp.total);
            temp.num = false;
            temp.guessed = [];
            saveGuessRound(temp);
        } else {
            saveGuessRound(temp);
            interaction.reply(`**${user.username}** guessed number ${guess}.`);
            if (interaction.channel instanceof TextChannel) {
                interaction.channel.send({ embeds: [generateGuessRoundEmbed(temp)] });
            }
        }
    }
}

function generateGuessRoundEmbed(temp: GuessRound): EmbedBuilder {
    let numList = `Maximum guess for this round: ${temp.max}\n\nGuessed numbers: `;
    const embed = new EmbedBuilder()
        .setAuthor({
            name: `Guessing Round - Total: ${pluralize('cat', temp.total, true)}`,
            iconURL: 'https://media.discordapp.net/attachments/1467535812391473203/1467549353895002142/youwhat.png?ex=6980c957&is=697f77d7&hm=f27f8414a1627bb833827e2a1144b7445096b9cdec5aca45876a930585f2d362'
        })
        .setColor(config.embedColor);
    
    if (temp.guessed[0] !== undefined && temp.guessed[0] !== null) {
        let nums = temp.guessed.sort((a, b) => a - b);
        for (let i = 0; i < nums.length - 1; i++) {
            numList += `${nums[i]}, `;
        }
        numList += nums[nums.length - 1];
    } else { 
        numList += 'none';
    }
    
    embed.setDescription(numList);
    embed.setFooter({ text: `Guess check cost: ${getGuessCheckCost(temp)}` });
    
    return embed;
}

function getGuessCheckCost(temp: GuessRound): number {
    return 25 + Math.floor(temp.guessed.length / 5);
}