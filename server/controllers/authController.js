import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { validationResult } from "express-validator";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};


export const createUser = async (req, res, next) => {
  const errors = validationResult(req);

  // backend validation from express-validator
  if (!errors.isEmpty()) {
    const formatted = {};
    errors.array().forEach(err => {
      formatted[err.param] = err.msg;
    });

    return res.status(400).json({
      success: false,
      errors: formatted
    });
  }

  try {
    const { name, email, password, username} = req.body;

    // email exists?
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        errors: { email: "Email already exists" }
      });
    }

    // username exists?
    const userNameExists = await User.findOne({ username });
    if (userNameExists) {
      return res.status(400).json({
        success: false,
        errors: { username: "Username already exists" }
      });
    }

    // create new user
    const profilePhoto = req.file ? (req.file.path || req.file.secure_url || req.file.url) : null;
    const user = await User.create({ name, email, password, username, profilePhoto });

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      profilePhoto: user.profilePhoto,
      token: generateToken(user._id),
    });
  } catch (err) {
    next(err);
  }
};




export const loginUser = async (req, res, next) => {
  try {
    const { email, password, username } = req.body;

    const user =
      (await User.findOne({ email })) || (await User.findOne({ username }));

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        profilePhoto: user.profilePhoto,
        token: generateToken(user._id),
      });
    } else {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      return next(error); 
    }
  } catch (err) {
    next(err); 
  }
};
