import * as users from '../models/user.model';
import { Request, Response } from "express";
import Logger from '../../config/logger';
import * as schemas from '../resources/schemas.json';
import { validate } from "../services/validator";
import crypto from "crypto";

const register = async (req: Request, res: Response): Promise<void> => {
    const validation = await validate(schemas.user_register, req.body);
    if (validation !== true) {
        res.status(400).send({ error: "Invalid request body" });
        return;
    }
    const { firstName, lastName, email, password } = req.body;
    try {
        const result = await users.insert(firstName, lastName, email, password);
        if (result === 'EMAIL_IN_USE') {
            res.status(403).send();
        } else {
            res.status(201).send({ userId: result.insertId });
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

const login = async (req: Request, res: Response): Promise<void> => {
    const validation = await validate(schemas.user_login, req.body);
    if (validation !== true) {
        res.status(400).send({ error: "Invalid request body" });
        return;
    }

    try {
        const token = crypto.randomBytes(16).toString("hex");
        const result = await users.login(req.body.email, req.body.password, token);

        if (result === null) {
            res.status(401).send({ error: "Invalid email or password" });
            return;
        }
        res.status(200).send({ userId: result[0].id, token });
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

const logout = async (req: Request, res: Response): Promise<void> => {
    const token = req.header('X-Authorization');
    if (!token) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    try {
        const result = await users.logout(token);

        if (result.affectedRows === 0) {
            res.status(401).send({ error: "Unauthorized" });
        } else {
            res.status(200).send();
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

const view = async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.id;
    try {
        const result = await users.read(parseInt(userId, 10));
        if (result.length === 0) {
            res.status(404).send({ error: "User not found" });
            return;
        }
        const { first_name, last_name, email, auth_token } = result[0];
        const token = req.header('X-Authorization');
        if (auth_token === token) {
            res.status(200).send({ firstName: first_name, lastName: last_name, email });
        } else {
            res.status(200).send({ firstName: first_name, lastName: last_name });
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

const update = async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.id;
    const authToken = req.header('X-Authorization');
    const updateData = req.body;
    let idNum: number;
    try {
        idNum = parseInt(userId, 10);
        if (isNaN(idNum)) throw new Error("Invalid user ID format");
    } catch (err) {
        res.status(400).send({ error: "Invalid user ID" });
        return;
    }
    const validationResult = await validate(schemas.user_edit, updateData);
    if (validationResult !== true) {
        res.status(400).send({ error: "Invalid request body" });
        return;
    }
    try {
        const user = await users.getUserByToken(authToken);
        if (!user) {
            res.status(401).send({ error: "Unauthorized" });
            return;
        }
        if (user.id !== idNum) {
            res.status(403).send({ error: "Cannot edit another user's information" });
            return;
        }
        if (updateData.email) {
            const emailExists = await users.checkEmailExists(updateData.email);
            if (emailExists) {
                res.status(403).send({ error: "Email is already in use" });
                return;
            }
        }
        if (updateData.password || updateData.currentPassword) {
            if (!updateData.currentPassword) {
                res.status(400).send({ error: "Current password required to update password" });
                return;
            }
            if (updateData.currentPassword === updateData.password) {
                res.status(403).send({error: "Current and new passwords must not be the same"});
                return;
            }
            const isPasswordCorrect = await users.verifyPassword(user.id, updateData.currentPassword);
            if (!isPasswordCorrect) {
                res.status(401).send({ error: "Invalid current password" });
                return;
            }
        }
        await users.updateUser(idNum, updateData);
        res.status(200).send({ message: "User updated successfully" });
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
};

export { register, login, logout, view, update };
