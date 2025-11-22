import express from "express";
import { createUser, loginUser } from "../controllers/authController.js";
import { validateUser } from "../middlewear/validation/userCreationValidation.js";
import upload from "../middlewear/uploads.js";

const router = express.Router();

router.post("/register", upload.single("profilePhoto"), validateUser, createUser);

router.post("/login", loginUser);

export default router;
