import { ChatInputCommandInteraction, Role } from 'discord.js';
import pluralize from 'pluralize';
import { getBalance } from '../utilities/balance';
import { resolveMentionable } from '../utilities/roleSelector';

export default async function (interaction: ChatInputCommandInteraction) {
    const resolved = await resolveMentionable(interaction, 'member');
    
    // If no member specified, show balance for the command user
    if (!resolved) {
        const bal = getBalance(interaction.user.id);
        interaction.reply(`**${interaction.user.username}** has ${pluralize('cat', bal, true)}`);
        return;
    }
    
    const { type, members } = resolved;
    
    if (type === 'multiple') {
        // Calculate total balance for all members
        const validMembers = members.filter(m => !m.user.bot);
        let totalBalance = 0;
        
        validMembers.forEach(member => {
            totalBalance += getBalance(member.id);
        });
        
        const mentionable = interaction.options.getMentionable('member');
        const targetName = mentionable instanceof Role ? `@${mentionable.name}` : '@everyone';
        
        const avgBalance = validMembers.length > 0 ? Math.floor(totalBalance / validMembers.length) : 0;
        interaction.reply(`**${targetName}** has a total of ${pluralize('cat', totalBalance, true)} across ${validMembers.length} members (average: ${pluralize('cat', avgBalance, true)} per member)`);
    } else {
        // Single member
        const member = members[0];
        const bal = getBalance(member.id);
        interaction.reply(`**${member.displayName}** has ${pluralize('cat', bal, true)}`);
    }
};