const socket = io();
const users = document.querySelector("div.users");

let username;

const enterUsername = () => {
    username = prompt("Username: ");
    socket.emit("join", username);
}
enterUsername();

const resetPlayerList = () => {
    users.innerHTML = '';
    let playerText = document.createElement("p");
    playerText.innerText = "Players:";
    playerText.id = "text";
    users.appendChild(playerText);
}

const addToPlayerList = (player) => {
    let p = document.createElement("p");
    p.innerText = player;
    p.id = "user";
    users.appendChild(p);
}

socket.on("error", (/** @type {{value:string,retry:boolean}} */ data) => {
    alert(data.value);
    if(data.retry) { 
        enterUsername();
    }
});

socket.on("playerJoined", (players) => {
    resetPlayerList();
    for(let player in players) {
        let plr = players[player];
        addToPlayerList(plr.username);
    }
});

function update() {
    if(performance.navigation.type == performance.navigation.TYPE_RELOAD) {
        socket.emit("leave", socket);
    }
    requestAnimationFrame(update);
}

requestAnimationFrame(update);