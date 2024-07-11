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
};

type ClientToServerEvents = {
  privateMessage: (messageTo: Omit<Message, "from">) => void;
  getChatUsers: () => void;
};

type InterServerEvents = {
  ping: () => void;
};

type SocketData = {
  sessionId: string;
  userId: string;
  username: string;
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
  const sessionId = socket.handshake.auth.sessionId;
  if (sessionId) {
    const session = sessionStore.findSession(sessionId);
    if (session) {
      socket.data.sessionId = sessionId;
      socket.data.userId = session.userId;
      socket.data.username = session.username;
      return next();
    }
  }
  const { userId, username } = socket.handshake.auth;
  if (!userId) {
    console.log("auth error");
    return next(new Error("invalid user"));
  }
  socket.data.sessionId = `${Date.now()}-${Math.random()}`;
  socket.data.userId = userId;
  socket.data.username = username;
  next();
});

io.on("connection", (socket) => {
  // persist session
  sessionStore.saveSession(socket.data.sessionId, {
    userId: socket.data.userId,
    username: socket.data.username,
  });

  // emit session details
  socket.emit("session", {
    sessionId: socket.data.sessionId,
    userId: socket.data.userId,
  });

  // join the "userID" room
  socket.join(socket.data.userId);

  // fetch existing users
  const users: ChatUser[] = [];
  const messagesPerUser = new Map();
  messageStore.findMessagesForUser(socket.data.userId).forEach((message) => {
    const { from, to } = message;
    const otherUser = socket.data.userId === from ? to : from;
    if (messagesPerUser.has(otherUser)) {
      messagesPerUser.get(otherUser).push(message);
    } else {
      messagesPerUser.set(otherUser, [message]);
    }
  });
  sessionStore.findAllSessions().forEach((session) => {
    users.push({
      userId: session.userId,
      username: session.username,
      messages: messagesPerUser.get(session.userId) || [],
    });
  });

  socket.on("getChatUsers", () => {
    socket.emit("users", users);
  });

  // notify existing users
  // socket.broadcast.emit("user connected", {
  //   userID: socket.userID,
  //   username: socket.username,
  //   connected: true,
  //   messages: [],
  // });

  // forward the private message to the right recipient (and to other tabs of the sender)
  socket.on("privateMessage", ({ content, to }) => {
    const message = {
      content,
      from: socket.data.userId,
      to,
    };
    socket.to(to).to(socket.data.userId).emit("privateMessage", message);
    messageStore.saveMessage(message);
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
