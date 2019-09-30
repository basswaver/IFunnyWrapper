# iFunny.js

[![Discord](https://img.shields.io/discord/624473515327881216?label=Discord&style=flat-square&logo=discord)](https://discord.gg/7WJZM9q)
[![Docs](https://img.shields.io/badge/Docs-Online-success?style=flat-square)](http://216.16.208.63:80/)

A simple wrapper for the iFunny API

```js
const ifunny = require('iFunny')
const robot = new ifunny.Client({ prefix: '-' })

robot.on('ready', async (fresh) => {
    await robot.socket.start()
})

robot.handler.on('message' async () => {
    message.reply('Hello, world!')
})

robot.command.on('ping', async (message, args) => {
    message.reply('Pong!')
})

robot.login('username', 'password')
```
