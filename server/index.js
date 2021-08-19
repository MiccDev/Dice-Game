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
    return (Math.floor(Math.random() * 2000000) + 1000000).toString();
}

let gameData = {
    id: null
};

let currentlyPlaying = null;

let playerAmount = 0;
let currentPlayingId = 0;
let players = {};

const updateCurrentPlaying = () => {
    let amt = Object.keys(players);
    currentPlayingId++;
    if(currentPlayingId >= amt.length) currentPlayingId = 0;
    for(let username in players) {
        let player = players[username];
        if(player.playerId === currentPlayingId) {
            player.playing = true;
            player.hasPlayed = false;
            currentlyPlaying = username;
        } else if(player.playerId == (currentPlayingId - 1)) {
            player.playing = false;
            player.hasPlayed = true;
        }
    }
    io.local.emit("update", players);
    io.local.emit("updateCurrentlyPlaying", currentlyPlaying);
}

io.on('connection', (socket) => {
    // console.log("Connection got!");
    socket.on("join", (username) => {
        if(players[username]) return socket.emit("error", {
            value: "Username already taken!",
            retry: true
        });
        console.log(`User '${username}' has joined the server!`)
        players[username] = {
            game: gameData.id,
            username: username,
            playerId: playerAmount,
            playing: playerAmount == 0,
            hasPlayed: false,
            isOut: false
        }
        currentlyPlaying = playerAmount == 0 ? username : currentlyPlaying;
        playerAmount++;
        io.local.emit("playerJoined", players);
        io.local.emit("updateCurrentlyPlaying", currentlyPlaying);
    });

    socket.on("rollOneDie", (user) => {
        let num = Math.floor(Math.random() * 6) + 1;

        let msgData = {
            name: "win",
            message: `${user.username} has won the game!`
        }
        
        if(num <= 2) {
            io.local.emit("win", user);
            io.local.emit("message", msgData);
            return;
        } else {
            msgData.name = "next";
            msgData.message = `${user.username} did not win.`
            io.local.emit("message", msgData);
        }
        updateCurrentPlaying();
    })

    socket.on("roll", (user) => {
        io.local.emit("message", { name: "reset", message: "..." })
        let num1 = Math.floor(Math.random() * 6) + 1;
        let num2 = Math.floor(Math.random() * 6) + 1;
        // let playingData = {
        //     nums: {
        //         one: num1,
        //         two: num2
        //     },
        //     user
        // }
        let dieImages = {
            img1: `styles/numbers/number_${num1}.png`,
            img2: `styles/numbers/number_${num2}.png`
        }
        io.local.emit("updateDieImages", dieImages);
        
        let msgData = {
            name: "",
            message: ""
        }

        if(num1 == num2) {
            // Got Doubles
            if(num1 == 1) {
                msgData = {
                    name: "win",
                    message: `${currentlyPlaying} has one the game with two 1's`
                }
                io.local.emit("win", user);
                io.local.emit("message", msgData);
                return;
            }
            return;
        }

        let total = num1 + num2;
        if(total == 5) {
            msgData = {
                name: "rollAgain",
                message: `${currentlyPlaying} is rolling again!`
            }
            io.local.emit("message", msgData);
            return;
        } else if(total == 6 || total == 4) {
            // Complex Code.
            msgData = {
                name: "spare",
                message: `${currentlyPlaying} has rolled a spare and will need to roll again.`
            }
            io.local.emit("message", msgData);
            return;
        }
        //  else if(total == 8) {
        //     let player = players[currentlyPlaying];
        //     player.isOut = true;
        //     console.log(`${currentlyPlaying} got an 8!`);
        //     io.local.emit("update", players);
        //     // TODO: Make a better system than deleting them from the list.
        //     delete players[currentlyPlaying];
        // }

        updateCurrentPlaying();
    })
})

server.on('error', (err) => {
    console.error('Server error: ', err);
});

server.listen(8080, () => {
    console.log('Server started on 8080!')
    gameData.id = makeId();
    console.log("Your game id is:", gameData.id)
});