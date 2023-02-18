
let homescreen = document.querySelector("#homescreen");
let textChatScreen = document.querySelector("#textChatScreen");

const socket = io();



function dark() {
    document.body.classList.toggle("light");
}

function newTextChat() {
    document.title = 'Dungal'
    homescreen.style.display = "none";
    socket.emit("connect to random user");

    textChatScreen.style.display = "block";
}

document.addEventListener('keydown', e => {
    if (document.activeElement.id === 'textChatInput' && !e.shiftKey && e.key === 'Enter') sendMessage();
})

function sendMessage() {
    if (!document.querySelector('textarea').value || /^\s+$/.test(document.querySelector('textarea').value)) return
    socket.emit('message', document.querySelector('textarea').value);
    const userInput = document.querySelector('textarea').value;
    const encodedInput = document.createElement('div');
    encodedInput.innerText = userInput;
    const safeHtml = encodedInput.innerHTML;

    var caht = document.getElementById('chat');
    caht.innerHTML += `<span style="color: blue";>You:</span> ${safeHtml}<br>`;
    document.querySelector('textarea').value = '';
}

// Store the current user's ID
let currentUserId = null;

// Handle the "connect" event
socket.on("connect", () => {
    console.log("Connected to server!");
    currentUserId = socket.id;
});

// Handle the "disconnect" event
socket.on("disconnect", () => {
    console.log("Disconnected from server!");
    currentUserId = null;
});

socket.on("waiting for user", () => {
    document.querySelector('#textChatInput').disabled = true;
    document.querySelector('#chat').innerHTML = 'Waiting for somone to connect...';

})

// Handle the "partner connected" event
socket.on("partner connected", () => {
    document.querySelector('#textChatInput').disabled = false;
    document.querySelector('#chat').innerHTML = 'You are now connected to a stranger.<br><br>';

});

// Handle the "partner disconnected" event
socket.on("partner disconnected", () => {
    document.querySelector('#textChatInput').disabled = true;

    document.querySelector('#chat').innerHTML += 'Your partner disconneted<br><br><button id="newChat"">New Chat</button>';
    document.querySelector('#newChat').addEventListener('click', () => {
        socket.emit("connect to random user");
    })
});

socket.on('message', function (msg) {
    // if (document.visibilityState === 'hidden') document.title = 'NEW MESSAGE - Dungal'
    console.log('Received message: ' + msg);
    const userInput = msg;
    const encodedInput = document.createElement('div');
    encodedInput.innerText = userInput;
    const safeHtml = encodedInput.innerHTML;

    var caht = document.getElementById('chat');
    caht.innerHTML += `<span style="color: red";>Stranger:</span> ${safeHtml}<br>`;
});