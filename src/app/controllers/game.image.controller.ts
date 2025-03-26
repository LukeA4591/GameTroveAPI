import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as gameImage from "../models/game.image.model";
import * as games from "../models/game.model";
import fs from "fs";
import path from "path";


const getImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const gameId = parseInt(req.params.id, 10);
        if (isNaN(gameId)) {
            res.status(400).send();
            return;
        }
        const result = await gameImage.getGameImage(gameId);
        if (result === 'DNE') {
            res.status(404).send();
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
        const userId = auth.id as number;
        const gameId = parseInt(req.params.id, 10);
        if (isNaN(gameId)) {
            res.status(400).send();
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
        const filename = `game_${gameId}${ext}`;
        const imagePath = path.join(__dirname, "../../../storage/images", filename);
        const writeStream = fs.createWriteStream(imagePath);
        req.pipe(writeStream);
        writeStream.on("error", (err: any) => {
            Logger.error(err);
            res.status(500).send({ error: "Failed to save image" });
        });
        const result = await gameImage.setGameImage(gameId, userId, filename);
        if (result === true) {
            res.status(201).send();
        } else if (result === false) {
            res.status(200).send();
        } else if (result === 'DNE') {
            res.status(404).send();
        } else if (result === 'NOT_OWNER') {
            res.status(403).send();
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}


export {getImage, setImage};