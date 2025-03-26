import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as userImage from '../models/user.image.model';
import path from "path";
import * as games from "../models/game.model";
import fs from "fs";


const getImage = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    try {
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
            res.status(400).send();
            return;
        }
        const result = await userImage.getUserImage(userId);
        if (result === 'DNE') {
            res.status(404).send();
            return;
        }
        const imagePath = path.join(__dirname, "../../../storage/images", result);
        res.sendFile(imagePath);
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const setImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.header('X-Authorization');
        const auth = await games.getAuth(token);
        if (!auth) {
            res.status(401).send({error: "auth"});
            return;
        }
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
            res.status(400).send();
            return;
        }
        if (userId !== auth.id) {
            res.status(403).send();
            return;
        }
        const contentType = req.header("Content-Type");
        let ext: string;

        if (contentType === "image/jpeg") {
            ext = ".jpg";
        } else if (contentType === "image/png") {
            ext = ".png";
        } else if (contentType === "image/gif") {
            ext = ".gif";
        } else {
            res.status(400).send({ error: "Unsupported image type" });
            return;
        }
        const filename = `game_${userId}${ext}`;
        const imagePath = path.join(__dirname, "../../../storage/images", filename);
        const writeStream = fs.createWriteStream(imagePath);
        req.pipe(writeStream);
        writeStream.on("error", (err: any) => {
            Logger.error(err);
            res.status(500).send({ error: "Failed to save image" });
        });
        const result = await userImage.setUserImage(userId, filename);
        if (result === true) {
            res.status(201).send();
        } else if (result === false) {
            res.status(200).send();
        } else if (result === 'DNE') {
            res.status(404).send();
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const deleteImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.header('X-Authorization');
        const auth = await games.getAuth(token);
        if (!auth) {
            res.status(401).send({error: "auth"});
            return;
        }
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
            res.status(400).send();
            return;
        }
        if (userId !== auth.id) {
            res.status(403).send();
            return;
        }
        const result = await userImage.deleteImage(userId);
        if (result === 'DNE') {
            res.status(404).send();
        } else if (result === 'SUCCESS') {
            res.status(200).send();
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

export {getImage, setImage, deleteImage}