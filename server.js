// var express = require('express');
// var app = express();

// var server = app.listen(3000, () => {
//     console.log("server is running on port", server.address().port);
// });

// app.use(express.static(__dirname));

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// let usersLookingForMatch = [];

// Serve static files from the "public" directory
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

// Serve the other static files (e.g. CSS, JS, images) directly from the root directory
app.use(express.static(__dirname));

// Handle incoming Socket.IO connections
// io.on('connection', function (socket) {
//     console.log('a user connected');

//     socket.on('connect', (msg) => {
//         console.log('message: ' + msg);

//     })
//     // When a user sends a message, broadcast it to all other connected users
//     socket.on('message', function (msg) {
//         console.log('message: ' + msg);
//         io.emit('message', msg);
//     });



//     // When a user disconnects, log it to the console
//     socket.on('disconnect', function () {
//         console.log('user disconnected');
//     });
// });

const waitingUserIds = new Set();

// Handle incoming Socket.IO connections
io.on("connection", socket => {
    console.log(`New User connected with ID ${socket.id}`);

    // Add the user to the waiting list

    // Handle the "disconnect" event
    socket.on("disconnect", () => {
        console.log(`User disconnected with ID ${socket.id}`);

        // Remove the user from the waiting list
        waitingUserIds.delete(socket.id);

        // If the user had a partner, notify the partner that they disconnected
        if (socket.partner) {
            socket.partner.emit("partner disconnected");
            socket.partner.partner = null;
            socket.partner = null;

            // Remove the disconnected partner's socket ID from the waitingUserIds set
            for (const id of waitingUserIds) {
                const waitingSocket = io.sockets.sockets.get(id);
                if (waitingSocket && waitingSocket.id === socket.partner) {
                    waitingUserIds.delete(id);
                    break;
                }
            }
        }
    });

    // Handle the "connect to random user" message
    socket.on("connect to random user", () => {
        // If the user already has a partner, do nothing
        if (socket.partner) {
            return io.to(socket.id).emit('already connected');
        }

        // Add the user to the waiting list
        waitingUserIds.add(socket.id);

        // If there is only one user in the waiting list, do nothing
        if (waitingUserIds.size <= 1) {
            return io.to(socket.id).emit('waiting for user');
        }

        // Choose a random user from the waiting list
        const partnerId = Array.from(waitingUserIds).filter(id => id !== socket.id)[Math.floor(Math.random() * (waitingUserIds.size - 1))];

        // If no user is available, do nothing
        if (!partnerId) {
            return io.to(socket.id).emit('waiting for user');
        }

        // Get the partner's socket object
        const partnerSocket = io.sockets.sockets.get(partnerId);

        // If the partner is no longer in the waiting list, do nothing
        if (!partnerSocket || partnerSocket.partner) {
            return io.to(socket.id).emit('waiting for user');
        }

        // Connect the two users
        waitingUserIds.delete(socket.id);
        waitingUserIds.delete(partnerId);
        socket.partner = partnerSocket;
        partnerSocket.partner = socket;
        socket.emit("partner connected", partnerId);
        partnerSocket.emit("partner connected", socket.id);
        console.log(waitingUserIds);
    });
    socket.on('message', function (msg) {
        console.log('new message: ' + msg);
        if (socket.partner) {
            // Send the message to the partner
            socket.partner.emit('message', msg);
        }
    });
});


// Start the server
http.listen(3000, function () {
    console.log('listening on *:3000');
});