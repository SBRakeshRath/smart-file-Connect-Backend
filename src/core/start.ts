// socket io server

import { Server } from "socket.io";
import { createServer } from "http";
import { config } from "dotenv";
import { createRoom } from "../events/createRoom.js";
import JoinRoom from "../events/joinRoom.js";
import fileChunkReceive from "../events/fileChunkReceive.js";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
config();

const httpServer = createServer();

const rlink =
  "rediss://red-cr6ptrqj1k6c73d8vpi0:T2kNC3ZCzGcgZvKI7x3ul3sWPpAL9QwI@oregon-redis.render.com:6379";
config();


const pubClient = createClient({
  url: rlink,
});
const subClient = pubClient.duplicate();

pubClient.on("error", (err) => {
  console.log(err);
});
pubClient.on("success", (err) => {
  console.log(err);
});

subClient.on("error", (err) => {
  console.log(err);
});
subClient.on("success", (err) => {
  console.log(err);
});

// await Promise.all([pubClient.connect(), subClient.connect()]);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },

  // adapter: createAdapter(pubClient, subClient),
});



io.on("connection", (socket) => {
  console.log("a user connected with id: " + socket.id);
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("create-room", () => {
    createRoom(socket);
  });
  socket.on("join-room", (roomId) => {
    JoinRoom(socket, roomId);
  });
  socket.on("send-file-info", ({ totalChunks, roomID, name }) => {
    //send the file info to the room

    socket.to(roomID).emit("receive-file-info", { totalChunks, name });

    // tell the sender that the file info has been received
    socket.emit("file-info-sent", true);
  });

  socket.on("send-file-chunk", ({ chunk, roomID }) => {
    fileChunkReceive(socket, roomID, chunk);
  });

  socket.on("send-chat", ({ chat, roomID }) => {
    //send the chat to the room

    socket.to(roomID).emit("chat-received", chat);

    console.log(
      "chat sent to room - " +
        roomID +
        " - chat - " +
        chat +
        " - by - " +
        socket.id
    );
  });
});

console.log("port", process.env.PORT);

httpServer.listen(process.env.PORT || 8080, () => {
  console.log("listening on", process.env.PORT || 8080);
});
