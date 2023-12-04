import express from "express";
import http from "http";

import cors from "cors";
import { Server } from "socket.io";
const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
let onlineUsers = [];
io.on("connection", (socket) => {


  socket.on("user_online", (data) => {
    onlineUsers.push(data.username);
       socket.username = data.username;
         io.emit("update_user_list", onlineUsers);
       console.log("online users", onlineUsers);
  });

  socket.on("disconnect", () => {
    // Remove the username from your array
    const index = onlineUsers.indexOf(socket.username);
    if (index > -1) {
      onlineUsers.splice(index, 1);
    }
    io.emit("update_user_list", onlineUsers);
        console.log("updated online users", onlineUsers);
  });

  socket.on("join_room", (data) => {
    socket.join(data);
    console.log(`user with ${socket.id} joined room ${data} `);
  });

  // Listen for 'typing' event
  socket.on("User_typing", (typingData) => {
    console.log(typingData.Author + " is typing in room " + typingData.room);
    // Broadcast 'userTyping' event to all other clients in the same room
    socket.to(typingData.room).emit("userTyping", typingData);
  });

  // Listen for 'stopped typing' event
  socket.on("stopped_typing", (typingData) => {
    console.log("typingdata is ", typingData);
    console.log(
      typingData.Author + " stopped typing in room " + typingData.room
    );
    // Broadcast 'userStoppedTyping' event to all other clients in the same room
    socket.to(typingData.room).emit("userStoppedTyping", typingData);
  });

  socket.on("send_message", (data) => {
    console.log(data);
    socket.to(data.room).emit("recive_message", data);
    console.log("Socket rooms:", socket.rooms);
  });
});

server.listen(3001, () => {
  console.log("server running");
});
