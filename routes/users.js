var express = require("express");
var router = express.Router();
var User = require("../models/user");
var helpers = require("../helpers/util");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const accessTokenSecret = "youraccesstokensecret";

router.get("/", async function (req, res, next) {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get("/chats/:username", helpers.isLoggedIn, async function (req, res, next) {
  try {
    let listChat = [];
    if (req.body.sendername && req.params.username) {
      const users = await User.find({
        $or: [
          { username: req.body.sendername },
          { username: req.params.username },
        ],
      });
      let mappedSenderChats = [];
      let mappedReceiverChats = [];
      for (let i = 0; i < users.length; i++) {
        const element = users[i];
        if (element.chats[req.body.sendername]) {
          mappedReceiverChats = element.chats[req.body.sendername].map(
            (chatReceiver) => {
              return (chatReceiver = { ...chatReceiver, status: "Receiver" });
            }
          );
        }
        if (element.chats[req.params.username]) {
          mappedSenderChats = element.chats[req.params.username].map(
            (chatSender) => {
              return (chatSender = { ...chatSender, status: "Sender" });
            }
          );
        }
      }

      listChat = mappedSenderChats.concat(mappedReceiverChats);

      listChat.sort((a, b) => {
        return a.createdAt - b.createdAt;
      });
    } else {
      return res.json(listChat);
    }

    res.json(listChat);
  } catch (err) {
    res.status(500).json(err);
  }
}
);

router.put("/chats/:username", helpers.isLoggedIn, async function (req, res, next) {
  try {
    const sender = await User.findOne({ username: req.body.sendername });
    const receiver = await User.findOne({ username: req.params.username });
    const receiverUsername = receiver.username;
    const chat = {
      content: req.body.content,
      createdAt: Date.now(),
      _id: uuidv4(),
    };
    if (!sender.chats[receiverUsername]) {
      sender.chats[receiverUsername] = [];
    }
    sender.chats[receiverUsername].push(chat);
    sender.markModified(`chats`);
    sender.save();
    res.json(chat);
  } catch (err) {
    res.status(500).json(err);
  }
}
);

router.delete("/chats/:username/chat/:chatid", helpers.isLoggedIn, async function (req, res, next) {
  try {
    const user = await User.findOne({ username: req.body.sendername });

    user.chats[req.params.username] = user.chats[req.params.username].filter(
      (chat) => {
        return chat._id !== req.params.chatid;
      }
    );
    user.markModified(`chats`);
    user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json(err);
  }
}
);

router.put("/chats/:username/chat/:chatid", helpers.isLoggedIn, async function (req, res, next) {
  try {
    const user = await User.findOne({ username: req.body.sendername });
    let response = {}

    user.chats[req.params.username] = user.chats[req.params.username].map(
      (chat) => {
        if (chat._id == req.params.chatid) {
          chat.content = req.body.content;
          response = chat
        }
        return chat;
      }
    );
    user.markModified(`chats`);
    user.save();
    res.json(response);
  } catch (err) {
    res.status(500).json(err);
  }
}
);

router.post("/", async function (req, res, next) {
  try {
    let user = await User.findOne({ username: req.body.username });
    if (user) {
      if (!user.token) {
        const refreshToken = jwt.sign(
          { username: req.body.username },
          accessTokenSecret
        );
        const filter = { username: req.body.username };
        const update = { token: refreshToken };

        user = await User.findOneAndUpdate(filter, update, {
          new: true,
        });
      }

      const userVerified = jwt.verify(user.token, accessTokenSecret);
      if (!userVerified) {
        const refreshToken = jwt.sign(
          { username: user.username },
          accessTokenSecret
        );
        const filter = { username: user.username };
        const update = { token: refreshToken };

        user = await User.findOneAndUpdate(filter, update, {
          new: true,
        });
      }

      const response = {
        data: {
          username: user.username,
        },
        token: user.token,
      };
      return res.json(user);
    }

    const accessToken = jwt.sign(
      { username: req.body.username },
      accessTokenSecret
    );
    req.body.token = accessToken;
    newUser = await User.create(req.body);
    newUser.chats = {};
    newUser.markModified("chats");
    newUser.save();
    const response = {
      data: {
        username: newUser.username,
      },
      token: newUser.token,
    };
    res.json(newUser);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.put("/:id", async function (req, res, next) {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.delete("/:id", async function (req, res, next) {
  try {
    const user = await User.findByIdAndDelete(req.params.id, {
      new: true,
    });
    res.json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
