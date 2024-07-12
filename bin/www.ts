#!/usr/bin/env node

/**
 * Module dependencies.
 */

import app from "../app";
import debugM from "debug";
import http from "http";
import { Server } from "socket.io";
import {
  InMemoryMessageStore,
  InMemorySessionStore,
  Message,
} from "../helpers/utils";
import { Types } from "mongoose";

// import socket from 'socket.io';
type ChatUser = {
  userId: string;
  username: string;
  messages: Message[];
};

type ServerToClientEvents = {
  session: (session: { sessionId: string; userId: string }) => void;
  users: (users: ChatUser[]) => void;
  privateMessage: (message: Message) => void;
  newMessages: (numberOfMes: number) => void;
};

type ClientToServerEvents = {
  privateMessage: (message: Message) => void;
  newMessages: (numberOfMes: number) => void;
};

type InterServerEvents = {
  ping: () => void;
};

type SocketData = {
  // sessionId: string;
  userId: string;
  // username: string;
};

const debug = debugM("backend:server");
/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

const sessionStore = new InMemorySessionStore();
const messageStore = new InMemoryMessageStore();

io.use((socket, next) => {
  const { userId } = socket.handshake.auth;
  socket.data.userId = userId;
  next();
});

io.on("connection", (socket) => {
  socket.join(socket.data.userId);

  // forward the private message to the right recipient (and to other tabs of the sender)
  socket.on("privateMessage", (message) => {
    socket
      .to(message.to)
      .to(socket.data.userId)
      .emit("privateMessage", message);
    // messageStore.saveMessage(message);
  });

  socket.on("newMessages", (newMessages) => {
    socket.emit("newMessages", newMessages);
  });

  // notify users upon disconnection
  socket.on("disconnect", async () => {
    const matchingSockets = await io.in(socket.data.userId).fetchSockets();
    const isDisconnected = matchingSockets.length === 0;
    // if (isDisconnected) {
    //   // notify other users
    //   socket.broadcast.emit("user disconnected", socket.userID);
    //   // update the connection status of the session
    //   sessionStore.saveSession(socket.sessionID, {
    //     userID: socket.userID,
    //     username: socket.username,
    //     connected: false,
    //   });
    // }
  });
});

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: string) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: any) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr?.port;
  debug("Listening on " + bind);
}
