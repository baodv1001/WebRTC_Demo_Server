const express = require("express");
var cors = require("cors");
const app = express();
app.use(cors());
var http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// Let's start managing connections...
io.sockets.on("connection", function (socket) {
  // Handle 'message' messages
  socket.on("message", async function (message) {
    log("S --> got message: ", message);
    // channel-only broadcast...

    if (message.message.type === "offer") {
      var destination = message.destinationId;
      message = {
        ...message,
        destinationId: message.sourceId,
      };
      io.to(destination).emit("message", message);
    }

    if (message.message == "got user media") {
      message = {
        ...message,
        destinationId: message.sourceId,
      };
    }

    if (message.message.type == "answer" || message.message == "bye") {
      io.to(message.destinationId).emit("message", message);
    }
    if (
      message.message.type == "candidate" ||
      message.message == "got user media"
    ) {
      socket.to(message.room).emit("message", message);
    }
  });
  // Handle 'create or join' messages
  socket.on("create or join", async function (room) {
    const clients = await io.in(room).fetchSockets();
    var numClients = clients.length;
    log("S --> Room " + room + " has " + numClients + " client(s)");
    log("S --> Request to create or join room", room);
    // First client joining...
    if (numClients == 0) {
      socket.join(room);
      socket.emit("created", room);
    } else if (numClients <= 4) {
      // Second client joining...
      io.sockets.in(room).emit("join", room);
      socket.join(room);
      socket.emit("joined", numClients);
    } else {
      // max two clients
      socket.emit("full", room);
    }
  });
  function log() {
    var array = [">>> "];
    for (var i = 0; i < arguments.length; i++) {
      array.push(arguments[i]);
    }
    socket.emit("log", array);
  }
});

server.use("/", (req, res) => {
  res.send("Hello World!");
});

server.listen(process.env.PORT || 8181, () => {
  console.log("listening on *:3000");
});
