import { ChatInputCommandInteraction, GuildMember, Role } from 'discord.js';
import pluralize from 'pluralize';
import { getBalance, changeBalance } from '../utilities/balance';
import localization from '../../resources/localization.json';
import { resolveMentionable } from '../utilities/roleSelector';

export default async function (interaction: ChatInputCommandInteraction) {
    const user = interaction.member as GuildMember;
    const amount = interaction.options.getInteger('number', true);
    
    if (getBalance(user.id) < amount) { 
        interaction.reply(localization.error.no_cats); 
        return;
    }
    if (amount <= 0) { 
        interaction.reply(localization.error.invalid_amount); 
        return;
    }

    const resolved = await resolveMentionable(interaction, 'member');
    
    if (!resolved) {
        interaction.reply(localization.error.invalid_user);
        return;
    }

    const { type, members } = resolved;
    
    // Calculate total cost
    const totalCost = type === 'multiple' ? amount * members.length : amount;
    
    if (getBalance(user.id) < totalCost) { 
        interaction.reply(`You don't have enough cats! You need ${pluralize('cat', totalCost, true)} but only have ${pluralize('cat', getBalance(user.id), true)}.`); 
        return;
    }
    
    // Deduct total cost from sender
    changeBalance(user.id, -totalCost);
    
    // Give cats to each member
    if (type === 'multiple') {
        const validMembers = members.filter(m => !m.user.bot);
        
        if (validMembers.length === 0) {
            // Refund if no valid members
            changeBalance(user.id, totalCost);
            interaction.reply('No valid members found to give cats to.');
        } else {
            validMembers.forEach(member => {
                changeBalance(member.id, amount);
            });
            
            const mentionable = interaction.options.getMentionable('member');
            const targetName = mentionable instanceof Role ? `@${mentionable.name}` : 'everyone';
            interaction.reply(`**${user.displayName}** has given ${pluralize('cat', amount, true)} to each member of **${targetName}** (${validMembers.length} members, ${pluralize('cat', totalCost, true)} total).`);
        }
    } else {
        // Single member
        const member = members[0];
        changeBalance(member.id, amount);
        interaction.reply(`**${user.displayName}** has given ${pluralize('cat', amount, true)} to **${member.displayName}**.`);
    }
};