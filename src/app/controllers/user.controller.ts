import * as users from '../models/user.model';
import { Request, Response } from "express";
import Logger from '../../config/logger';
import * as schemas from '../resources/schemas.json';
import { validate } from "../services/validator";
import crypto from "crypto";

const register = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`POST /users - Registering user: ${req.body.firstName} ${req.body.lastName}`);

    const validation = await validate(schemas.user_register, req.body);
    if (validation !== true) {
        Logger.warn("User registration failed: Invalid request body.");
        res.status(400).json({ error: "Invalid request body" });
        return;
    }
    const { firstName, lastName, email, password } = req.body;
    try {
        const result = await users.insert(firstName, lastName, email, password);
        Logger.info(`User registered successfully with ID: ${result.insertId}`);
        res.status(201).json({ userId: result.insertId });
    } catch (err) {
        Logger.error(`User registration failed: ${err}`);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const login = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`POST /users/login - Attempting login for user: ${req.body.email}`);

    const validation = await validate(schemas.user_login, req.body);
    if (validation !== true) {
        Logger.warn("User login failed: Invalid request body.");
        res.status(400).json({ error: "Invalid request body" });
        return;
    }

    try {
        const token = crypto.randomBytes(16).toString("hex");
        const result = await users.login(req.body.email, req.body.password, token);

        if (result === null) {
            Logger.warn(`Login failed for user ${req.body.email}: Invalid credentials.`);
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }

        Logger.info(`User ${req.body.email} logged in successfully.`);
        res.status(200).json({ userId: result[0].id, token });
    } catch (err) {
        Logger.error(`User login failed: ${err}`);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const logout = async (req: Request, res: Response): Promise<void> => {
    const token = req.header('X-Authorization');
    Logger.http(`POST /users/logout - Attempting logout for token: ${token}`);

    if (!token) {
        Logger.warn("Logout attempt failed: No authentication token provided.");
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    try {
        const result = await users.logout(token);

        if (result.affectedRows === 0) {
            Logger.warn(`Logout failed: Token not found or already invalid.`);
            res.status(401).json({ error: "Unauthorized" });
        } else {
            Logger.info(`User logged out successfully.`);
            res.status(200).send();
        }
    } catch (err) {
        Logger.error(`User logout failed: ${err}`);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const view = async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.id;
    Logger.http(`GET /users/${userId} - Retrieving user details`);

    try {
        const result = await users.read(parseInt(userId, 10));

        if (result.length === 0) {
            Logger.warn(`User with ID ${userId} not found.`);
            res.status(404).json({ error: "User not found" });
            return;
        }

        const { first_name, last_name, email, auth_token } = result[0];
        const token = req.header('X-Authorization');

        if (auth_token === token) {
            Logger.info(`User ${userId} details retrieved successfully (with email).`);
            res.status(200).json({ firstName: first_name, lastName: last_name, email });
        } else {
            Logger.info(`User ${userId} details retrieved successfully (without email).`);
            res.status(200).json({ firstName: first_name, lastName: last_name });
        }
    } catch (err) {
        Logger.error(`Failed to retrieve user ${userId}: ${err}`);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const update = async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.id;
    const authToken = req.header('X-Authorization');
    const updateData = req.body;

    Logger.http(`PATCH /users/${userId} - Attempting to update user details`);

    let idNum: number;
    try {
        idNum = parseInt(userId, 10);
        if (isNaN(idNum)) throw new Error("Invalid user ID format");
    } catch (err) {
        Logger.warn(`Invalid user ID format: ${userId}`);
        res.status(400).json({ error: "Invalid user ID" });
        return;
    }

    const validationResult = await validate(schemas.user_edit, updateData);
    if (validationResult !== true) {
        Logger.warn(`User update failed: Invalid request body.`);
        res.status(400).json({ error: "Invalid request body" });
        return;
    }

    try {
        const user = await users.getUserByToken(authToken);
        if (!user) {
            Logger.warn(`Unauthorized update attempt: Invalid token.`);
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        if (user.id !== idNum) {
            Logger.warn(`Forbidden update attempt: User ${user.id} tried to edit user ${idNum}`);
            res.status(403).json({ error: "Cannot edit another user's information" });
            return;
        }

        if (updateData.email) {
            const emailExists = await users.checkEmailExists(updateData.email);
            if (emailExists) {
                Logger.warn(`User update failed: Email ${updateData.email} is already in use.`);
                res.status(403).json({ error: "Email is already in use" });
                return;
            }
        }

        if (updateData.password || updateData.currentPassword) {
            if (!updateData.currentPassword) {
                Logger.warn(`Password update failed: Missing current password.`);
                res.status(400).json({ error: "Current password required to update password" });
                return;
            }
            if (updateData.currentPassword === updateData.password) {
                Logger.warn(`Password update failed: Current and new passwords are the same.`);
                res.status(403).json({ error: "Current and new passwords must not be the same" });
                return;
            }

            const isPasswordCorrect = await users.verifyPassword(user.id, updateData.currentPassword);
            if (!isPasswordCorrect) {
                Logger.warn(`Password update failed: Incorrect current password.`);
                res.status(401).json({ error: "Invalid current password" });
                return;
            }
        }

        await users.updateUser(idNum, updateData);
        Logger.info(`User ${idNum} updated successfully.`);
        res.status(200).json({ message: "User updated successfully" });
    } catch (err) {
        Logger.error(`User update failed: ${err}`);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export { register, login, logout, view, update };
