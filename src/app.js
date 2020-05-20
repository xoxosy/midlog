var { Client, WebhookClient } = require('discord.js');
var request = require('request');
var chalk = require('chalk');
var fs = require('fs');

var config = require('../config');

var client = new Client();

var { log, clear } = console;

// for load image before delete
var loadimg = (url, filename) => request(url).pipe(fs.createWriteStream(`src/storage/${filename}`));

client.once('ready', () => {
  clear();
  log(chalk.green(`logger: connected via ${client.user.tag}`));
});

client.on('message', message => {
  let { author, channel, attachments } = message;

  if (author.bot) return; // ignore bots
  if (channel.type != 'text') return // ignore dm channel

  let attachment = attachments.first();

  if (!attachment) return // if message doesn't have attachment

  let url = attachment.url;
  let extname = attachment.filename.split('.').pop();
  let filename = `${message.id}.${extname}`;

  loadimg(url, filename)
    .on('close', () => log(chalk.blue(`logger: new attachment loaded from ${author.id}`)));
});

client.on('messageDelete', async message => {
  let { author, channel, content } = message;

  if (author.bot) return;
  if (channel.type != 'text') return;

  // read all files dir in storage file
  let storage = fs.readdirSync('src/storage');

  // find file start with message id
  let file = storage.find(file => file.startsWith(message.id));

  if (!file) return log(chalk.yellow('warn: file not found'))

  let logchannel = client.channels.get(config.channel);

  if (!logchannel) return log(chalk.red(`err: channel not found`))

  let options = {
    disableEveryone: false,
    files: [{ attachment: `src/storage/${file}`, name: file }]
  }

  try {
    await logchannel.send(`**المرسل <@${author.id}> 
    الشات <#${channel.id}>**
    **${content.slice(0, 1800)}**`,
      options);
  } catch (err) {
    log(chalk.red(`err: ${err.message}`))
  }

  fs.unlinkSync(`src/storage/${file}`);
});

client.login(config.client.token);