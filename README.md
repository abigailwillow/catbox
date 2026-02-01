# catbox

[Add catbox to your server](https://discordapp.com/oauth2/authorize?client_id=538350337803812885&permissions=8&scope=bot)  
(catbox is currently not in a stable state, use at your own risk)

## Setup Instructions

### Prerequisites
1. Make sure you have [NodeJS](https://nodejs.org/en/download/) v16.11.0 or higher installed.
2. A Discord Bot Token from the [Discord Developer Portal](https://discord.com/developers/applications)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure the bot:**
   - Edit `cfg/config.json` and add your Discord bot token
   - Customize the prefix, activity, and other settings as needed

3. **Enable Required Intents:**
   The bot requires these Privileged Gateway Intents to be enabled in the Discord Developer Portal:
   - Go to https://discord.com/developers/applications
   - Select your bot application
   - Navigate to the "Bot" section
   - Enable these Privileged Gateway Intents:
     - ✅ **MESSAGE CONTENT INTENT**
     - ✅ **SERVER MEMBERS INTENT**
   - Save your changes

4. **Start the bot:**
   ```bash
   npm start
   ```

### Required Files

The following files and directories are required (created automatically if missing):
- `cfg/config.json` - Bot configuration
- `data/userdata.json` - User balance and streak data
- `data/temp.json` - Temporary game state
- `data/backups/` - Hourly backups directory

## Cat

Thanks to everyone who helped me with this project, especially

- [KrypteK](https://github.com/KrispyteK) for coding several major features.
- [Lizreu](https://github.com/Lizreu) for checking my code whenever I get frustrated.
- [Vioxtar](https://github.com/Vioxtar) for testing and suggesting many features.
- [Sikerow](https://github.com/Sikerow) for being overly addicted to playing with catbox.
- [Octo](https://github.com/OctothorpeObelus) and [Classic](https://github.com/BartNixon) for help with designing.
- [Kieran](https://github.com/andyz1) for cats and memes.
