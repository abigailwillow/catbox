import { ChatInputCommandInteraction, GuildMember, Role } from 'discord.js';
import pluralize from 'pluralize';
import { changeBalance } from '../utilities/balance';
import { resolveMentionable } from '../utilities/roleSelector';

export default async function (interaction: ChatInputCommandInteraction) {
    const amount = interaction.options.getInteger('number', true);
    const resolved = await resolveMentionable(interaction, 'member');

    if (!resolved) {
        interaction.reply('Invalid member specified.');
        return;
    }

    const { type, members } = resolved;
    
    if (type === 'multiple') {
        const validMembers = members.filter(m => !m.user.bot);
        
        if (validMembers.length === 0) {
            interaction.reply('No valid members found to spawn cats for.');
            return;
        }
        
        validMembers.forEach(member => {
            changeBalance(member.id, amount);

            console.log(`Spawned ${amount} cats for ${member.displayName} (${member.id})`);
        });
        
        const mentionable = interaction.options.getMentionable('member');
        const targetName = mentionable instanceof Role ? `@${mentionable.name}` : 'everyone';
        interaction.reply(`**${targetName}** was granted ${pluralize('cat', amount, true)} each (${validMembers.length} members, ${pluralize('cat', amount * validMembers.length, true)} total).`);
    } else {
        // Single member
        const member = members[0];
        changeBalance(member.id, amount);
        interaction.reply(`**${member.displayName}** was granted ${pluralize('cat', amount, true)}.`);
    }
};