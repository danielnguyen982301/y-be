#!/usr/bin/env node

/**
 * Module dependencies.
 */

import app from "../app";
import debugM from "debug";
import http from "http";
import { Server } from "socket.io";
import { FollowNotif, Message, RepostNotif } from "../helpers/utils";

// import socket from 'socket.io';

type ServerToClientEvents = {
  privateMessage: (message: Message) => void;
  mentionNotif: () => void;
  replyNotif: () => void;
  toggleRepostNotif: (notif: RepostNotif) => void;
  toggleFollowNotif: (notif: FollowNotif) => void;
  deleteNotif: () => void;
};

type ClientToServerEvents = {
  privateMessage: (message: Message) => void;
  mentionNotif: (targets: string[]) => void;
  replyNotif: (recipient: string) => void;
  toggleRepostNotif: (notif: RepostNotif) => void;
  toggleFollowNotif: (notif: FollowNotif) => void;
  deleteNotif: (recipients: string[]) => void;
};

type InterServerEvents = {
  ping: () => void;
};

type SocketData = {
  userId: string;
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

  socket.on("mentionNotif", (mentionedTargets) => {
    socket.to(mentionedTargets).emit("mentionNotif");
  });

  socket.on("replyNotif", (recipient) => {
    socket.to(recipient).emit("replyNotif");
  });

  socket.on("toggleRepostNotif", (notif) => {
    socket.to(notif.recipient).emit("toggleRepostNotif", notif);
  });

  socket.on("toggleFollowNotif", (notif) => {
    socket.to(notif.recipient).emit("toggleFollowNotif", notif);
  });

  socket.on("deleteNotif", (recipients) => {
    socket.to(recipients).emit("deleteNotif");
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
