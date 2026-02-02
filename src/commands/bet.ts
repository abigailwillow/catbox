import { ChatInputCommandInteraction, EmbedBuilder, TextChannel, Client } from 'discord.js';
import pluralize from 'pluralize';
import { getBalance, changeBalance } from '../utilities/balance';
import config from '../../config/config.json';
import localization from '../../resources/localization.json';

interface BetRound {
    inProgress: boolean;
    total: number;
    players: { [key: string]: number };
    roundTime: number;
    startTime: number;
}

const betRound: BetRound = {
    inProgress: false,
    total: 0,
    players: {},
    roundTime: 30,
    startTime: 0
};

export default function (interaction: ChatInputCommandInteraction) {
    const amount = interaction.options.getInteger('amount', true);
    const user = interaction.user;
    
    if (getBalance(user.id) < amount) { 
        interaction.reply(localization.error.no_cats); 
        return;
    }
    if (amount <= 0) { 
        interaction.reply(localization.error.invalid_amount); 
        return;
    }
    
    changeBalance(user.id, -amount);
    betRound.total += amount;
    
    if (betRound.players.hasOwnProperty(user.id)) {
        interaction.reply(`**${user.username}** added ${pluralize('cat', amount, true)}.`);
        betRound.players[user.id] += amount;
        return;
    } else {
        betRound.players[user.id] = amount;
    }

    if (!betRound.inProgress) {
        betRound.inProgress = true;
        betRound.startTime = new Date().getTime();
        
        interaction.reply(`**${user.username}** just started a betting round with ${pluralize('cat', amount, true)}! You have ${betRound.roundTime} seconds to join in!`);
        interaction.fetchReply().then(msg => {
            if (interaction.channel && interaction.channel instanceof TextChannel) {
                const endTime = Math.floor((betRound.startTime + betRound.roundTime * 1000) / 1000);
                interaction.channel.send({ content: `Ends <t:${endTime}:R>`, embeds: [generateRoundEmbed(interaction.client)] }).then(roundMsg => {
                    setTimeout(() => {
                        roundMsg.edit({ content: 'This round is over.', embeds: [generateRoundEmbed(interaction.client, true)] });

                        let winner: string | undefined = undefined;
                        let winNum = Math.random();
                        let total = 0;
                        
                        shuffleArray(Object.keys(betRound.players)).forEach(ply => {
                            total += betRound.players[ply] / betRound.total;
                            if (total >= winNum && winner == undefined) { 
                                winner = ply;
                            }
                        });
                        
                        if (winner && interaction.client.users.cache.get(winner) && interaction.channel instanceof TextChannel) {
                            interaction.channel.send(`**${interaction.client.users.cache.get(winner)!.username}** won ${pluralize('cat', betRound.total, true)} with a ${((betRound.players[winner] / betRound.total) * 100).toFixed(2)}% chance!`);
                            changeBalance(winner, betRound.total);
                        }
                        
                        betRound.inProgress = false;
                        betRound.total = 0;
                        betRound.players = {};
                    }, betRound.roundTime * 1000);
                });
            }
        });
    } else {
        interaction.reply(`**${user.username}** joined the current betting round with ${pluralize('cat', amount, true)} (${((amount / betRound.total) * 100).toFixed(2)}% chance).`);
    }
}

function generateRoundEmbed(client: Client, isEnded: boolean = false): EmbedBuilder {
    let pList = '';
    const embed = new EmbedBuilder()
        .setAuthor({
            name: `Betting Round - Total: ${pluralize('cat', betRound.total, true)}`,
            iconURL: 'https://media.discordapp.net/attachments/1467535812391473203/1467549353895002142/youwhat.png?ex=6980c957&is=697f77d7&hm=f27f8414a1627bb833827e2a1144b7445096b9cdec5aca45876a930585f2d362'
        })
        .setColor(config.embedColor);
    
    Object.keys(betRound.players).forEach(ply => {
        const curAmount = betRound.players[ply];
        const username = client.users.cache.get(ply)?.username || ply;
        pList += `${pluralize('cat', curAmount, true)} (${((curAmount / betRound.total) * 100).toFixed(2)}%) - **${username}**\n`;
    });
    
    embed.setDescription(pList);
    
    return embed;
}

function shuffleArray<T>(a: T[]): T[] {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        let x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}