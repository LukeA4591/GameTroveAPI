import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as games from "../models/game.model";
import * as gameAcitons from "../models/game.action.model";


const addGameToWishlist = async(req: Request, res: Response): Promise<void> => {
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
        const result = await gameAcitons.addToWishlist(gameId, userId);
        if (result === 'GAME_DNE') {
            res.status(404).send();
        } else if (result === 'GAME_CREATOR') {
            res.status(403).send();
        } else if (result === 'GAME_ALREADY_OWNED') {
            res.status(403).send();
        } else if (result === 'GAME_ALREADY_WISHLIST') {
            res.status(400).send();
        } else if (result === 'GAME_ADDED') {
            res.status(200).send();
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const removeGameFromWishlist = async(req: Request, res: Response): Promise<void> => {
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
        const result = await gameAcitons.deleteOwnedOrWish(gameId, userId, false);
        if (result === 'GAME_DNE') {
            res.status(404).send();
        } else if (result === 'GAME_NOT') {
            res.status(403).send();
        } else if (result === 'SUCCESS') {
            res.status(200).send();
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const addGameToOwned = async(req: Request, res: Response): Promise<void> => {
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
        const result = await gameAcitons.addToOwned(gameId, userId);
        if (result === 'GAME_DNE') {
            res.status(404).send();
        } else if (result === 'GAME_CREATOR') {
            res.status(403).send();
        } else if (result === 'GAME_ALREADY_OWNED') {
            res.status(400).send();
        } else if (result === 'GAME_ADDED') {
            res.status(200).send();
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const removeGameFromOwned = async(req: Request, res: Response): Promise<void> => {
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
        const result = await gameAcitons.deleteOwnedOrWish(gameId, userId, true);
        if (result === 'GAME_DNE') {
            res.status(404).send();
        } else if (result === 'GAME_NOT') {
            res.status(403).send();
        } else if (result === 'SUCCESS') {
            res.status(200).send();
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

export {addGameToWishlist, removeGameFromWishlist, addGameToOwned, removeGameFromOwned};