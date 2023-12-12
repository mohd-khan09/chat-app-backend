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
    //   console.log("online users", onlineUsers);
  });

  socket.on("disconnect", () => {
    // Remove the username from your array
    const index = onlineUsers.indexOf(socket.username);
    if (index > -1) {
      onlineUsers.splice(index, 1);
    }
    io.emit("update_user_list", onlineUsers);
    // console.log("updated online users", onlineUsers);
  });

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    const clients = io.sockets.adapter.rooms.get(roomId);
    const usernames = [];
    for (const clientId of clients) {
      // Get the socket of each client in the room
      const clientSocket = io.sockets.sockets.get(clientId);
      // Add the username to the usernames array
      usernames.push(clientSocket.username);
    }
    //  console.log(`Users in room ${roomId}: ${usernames.join(", ")}`);
    // console.log(`user with ${socket.id} joined room ${roomId}`);
    socket.emit("users_in_room", { roomId, usernames });
    io.to(roomId).emit("users_in_room", { roomId, usernames });
  });

  socket.on("leave_room", (roomId) => {
    socket.leave(roomId);
    // console.log(`user with ${socket.id} left room ${roomId}`);

    // Get the list of users in the room
    const clients = io.sockets.adapter.rooms.get(roomId);
    const usernames = [];
    if (clients) {
      for (const clientId of clients) {
        const clientSocket = io.sockets.sockets.get(clientId);
        usernames.push(clientSocket.username);
      }
    }
    // Emit 'users_in_room' event with the updated list of users
    io.emit("users_in_room", { roomId, usernames });
    io.to(roomId).emit("users_in_room", { roomId, usernames });
  });
  // Listen for 'typing' event
  socket.on("User_typing", (typingData) => {
    //  console.log(typingData.Author + " is typing in room " + typingData.room);
    // Broadcast 'userTyping' event to all other clients in the same room
    socket.to(typingData.room).emit("userTyping", typingData);
  });

  // Listen for 'stopped typing' event
  socket.on("stopped_typing", (typingData) => {
    // console.log("typingdata is ", typingData);
    // console.log(
    //   typingData.Author + " stopped typing in room " + typingData.room
    // );
    // Broadcast 'userStoppedTyping' event to all other clients in the same room
    socket.to(typingData.room).emit("userStoppedTyping", typingData);
  });

  socket.on("send_message", (data) => {
    console.log("data from send_message", data);
    io.emit("recive_message_all", data);
    // console.log("data from recive_message_all", data);
    // console.log("Message sent to all clients");
  });

  socket.on("send_message", (data) => {
    // console.log("data from send message 2", data);
    socket.to(data.room).emit("recive_message", data);
    // console.log("Socket rooms:", socket.rooms);
  });
});

server.listen(3001, () => {
  console.log("server running");
});
