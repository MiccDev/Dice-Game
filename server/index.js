const http = require('http');
const express = require('express');
const socketio = require('socket.io');

const app = express();

const clientPath = `${__dirname}/../client`;

app.use(express.static(clientPath));

const server = http.createServer(app);

/**
 * @type {socketio.Server}
 */
const io = socketio(server);

const makeId = () => {
    return (Math.floor(Math.random() * 10000) + 1).toString();
}

let gameData = {
    id: null
};

let playerAmount = 0;
let players = {};

io.on('connection', (socket) => {
    // console.log("Connection got!");
    socket.on("join", (username) => {
        if(players[username]) return socket.emit("error", {
            value: "Username already taken!",
            retry: true
        });
        console.log(`User '${username}' has joined the server!`)
        players[socket] = {
            game: gameData.id,
            username: username,
            playerId: playerAmount,
            playing: false
        }
        playerAmount++;
        // socket.emit("connection", (players[username]));
        io.local.emit("playerJoined", players);
    });

    socket.on("leave", (socket) => {
        delete players[socket];
    })

    // socket.emit("playerJoined", players);
})

server.on('error', (err) => {
    console.error('Server error: ', err);
});

server.listen(8080, () => {
    console.log('Server started on 8080!')
    gameData.id = makeId();
    console.log("Your game id is:", gameData.id)
});