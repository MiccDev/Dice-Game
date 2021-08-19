const socket = io();
const users = document.querySelector("div.users");
let rollBtn = document.getElementById("rollBtn");
const currentPlayer = document.getElementById("player");
const num1Display = document.getElementById("num1");
const num2Display = document.getElementById("num2");
const msg = document.getElementById("msg");

let username;
let me = null;
let spareGot = false;

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
    me = players[username];
    for(let player in players) {
        let plr = players[player];
        addToPlayerList(plr.username);
    }
});

socket.on("update", (players) => {
    for(let name in players) {
        let player = players[name];
        if(name === username) me = player;
    }
})


socket.on("updateCurrentlyPlaying", (username) => {
    currentPlayer.innerText = `Current Player: ${username}`
})

socket.on("updateDieImages", (imgPath) => {
    num1Display.innerHTML = `<img src="${imgPath.img1}" width="60" height="60">`;
    num1Display.style.paddingRight = '20px';
    num2Display.innerHTML = `<img src="${imgPath.img2}" width="60" height="60">`;
})
// socket.on("playing", (playingData) => {
//     roll(playingData.nums.one, playingData.nums.two);
// })

socket.on("message", (data) => {
    if(data.name == "spare") {
        spareGot = true;
    }
    spareGot = false;
    msg.innerText = data.message;
})

function update() {
    if(me == null) return;

    if(me.playing) {
        if(!spareGot) {
            removeAllListeners();
            rollBtn.addEventListener("click", handleRollBtnClick, true);
        } else {
            removeAllListeners();
            rollBtn.addEventListener("click", handleOneRollBtnClick, true);
        }
    } else {
        removeAllListeners();
    }
}

const removeAllListeners = () => {
    rollBtn.removeEventListener("click", handleRollBtnClick, true);
    rollBtn.removeEventListener("click", handleOneRollBtnClick, true);
}

const handleRollBtnClick = (ev) => {
    ev.preventDefault();
    socket.emit("roll", me);
}

const handleOneRollBtnClick = (ev) => {
    ev.preventDefault();
    socket.emit("rollOneDie", me);
    num2Display.innerHTML = '';
    num1Display.style.paddingRight = "-15px";
}

setInterval(update, 60 / 1000);