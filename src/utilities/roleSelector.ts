import { GuildMember, Role, ChatInputCommandInteraction } from 'discord.js';

export interface ResolvedMentionable {
    type: 'single' | 'multiple';
    members: GuildMember[];
}

/**
 * Resolves a mentionable option into one or more guild members.
 * Supports @user, @role, and @everyone mentions.
 * 
 * @param interaction - The command interaction
 * @param optionName - The name of the mentionable option to resolve
 * @returns An object containing the type of mention and array of resolved members
 */
export async function resolveMentionable(
    interaction: ChatInputCommandInteraction, 
    optionName: string
): Promise<ResolvedMentionable | null> {
    // Try to get as a member (handles user mentions)
    const member = interaction.options.getMember(optionName);
    if (member && member instanceof GuildMember) {
        return {
            type: 'single',
            members: [member]
        };
    }
    
    // Try to get as a role (handles role mentions)
    const role = interaction.options.getRole(optionName);
    if (role && role instanceof Role) {
        // Fetch all guild members to ensure role.members is populated
        await interaction.guild?.members.fetch();
        const members = Array.from(role.members.values());
        console.log(`Resolved role ${role.name} to ${members.length} members.`);
        return {
            type: 'multiple',
            members: members
        };
    }
    
    return null;
}

/**
 * Gets all members from the guild (for @everyone support)
 * 
 * @param interaction - The command interaction
 * @returns Array of all guild members
 */
export async function getAllMembers(interaction: ChatInputCommandInteraction): Promise<GuildMember[]> {
    if (!interaction.guild) {
        return [];
    }
    
    const members = await interaction.guild.members.fetch();
    return Array.from(members.values()).filter(member => !member.user.bot);
}
