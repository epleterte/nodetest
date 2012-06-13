#!/usr/bin/env node

var ueberDB = require("ueberDB");
var log4js = require('log4js');
var fs = require('fs');
var async = require('async');
var express = require('express');
var path = require('path');
var  _ = require("underscore");
var connect = require('connect');
var socketio = require('socket.io');

log4js.setGlobalLogLevel("INFO");

var db;
var app;
var io;
var iochan;

async.waterfall([
  function (callback) {
    db = new ueberDB.database("dirty", {"filename" : "dirty.db"}, null, log4js.getLogger("ueberDB"));
    db.init(callback);
  },

  function (callback) {
    app = express.createServer();

    app.use(function (req, res, next) {
      res.header("Server", "NodeTest says hi");
      next();
    });

    app.use(express.cookieParser());
    app.sessionStore = new express.session.MemoryStore();
    app.use(express.session({store: app.sessionStore,
                             key: 'express_sid',
                             secret: "SECRET_STUFF"}));

    io = socketio.listen(app);
    // this is only a workaround to ensure it works with all browers behind a proxy
    io.set('transports', ['xhr-polling']);

    /* Require an express session cookie to be present, and load the
     * session. See http://www.danielbaulig.de/socket-ioexpress for more
     * info */
    io.set('authorization', function (data, accept) {
      if (!data.headers.cookie) return accept('No session cookie transmitted.', false);
      data.cookie = connect.utils.parseCookie(data.headers.cookie);
      data.sessionID = data.cookie.express_sid;
      app.sessionStore.get(data.sessionID, function (err, session) {
        if (err || !session) return accept('Bad session / session has expired', false);
        data.session = new connect.middleware.session.Session(data, session);
        accept(null, true);
      });
    });

    iochan = io.of("/somechannel");
    iochan.on('connection', function (socket) {
      // express session is available in socket.handshake.session

      socket.on("answer", function (args) {
        console.log(["Got some data from client", args]);
      });

      setInterval(function () {
        socket.emit("request", {status: "happy"});
      }, 2000);

    });

    app.get(/\/.*/, function(req, res, next) {
        res.sendfile(path.join(path.dirname(module.filename), "static", req.path), function (err) { if (err) next(); });
    });

    app.listen("4711", "0.0.0.0");

    console.log("Up and running");

    callback(null);  
  }
]);
