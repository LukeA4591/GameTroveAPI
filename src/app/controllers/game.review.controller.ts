import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as reviews from "../models/game.review.model"
import * as schemas from '../resources/schemas.json';
import { validate } from "../services/validator";
import * as games from "../models/game.model";


const getGameReviews = async(req: Request, res: Response): Promise<void> => {
    try {
        const gameId = parseInt(req.params.id, 10);
        if (isNaN(gameId)) {
            res.status(400).send();
            return;
        }
        const result = await reviews.getReviews(gameId);
        if (result.length === 0) {
            res.status(404).send();
        }
        res.status(200).send(result);
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const addGameReview = async(req: Request, res: Response): Promise<void> => {
    try {
        const validation = await validate(schemas.game_review_post, req.body);
        const token = req.header('X-Authorization');
        const auth = await games.getAuth(token);
        if (validation !== true) {
            res.status(400).send();
        }
        const gameId = parseInt(req.params.id, 10);
        if (isNaN(gameId)) {
            res.status(400).send();
            return;
        }
        if (!auth) {
            res.status(401).send({error: "auth"});
            return;
        }
        const result = await reviews.setReviews(gameId, auth.id, req.body.rating, req.body.review);
        if (result === 'GAME_DNE') {
            res.status(404).send();
        } else if (result === 'CREATOR') {
            res.status(403).send({error: "creator"});
        } else if (result === 'REVIEWED') {
            res.status(403).send({error: "reviewed"});
        } else if (result === 'SUCCESS') {
            res.status(201).send();
        } else {
            res.status(400).send(result);
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}




export {getGameReviews, addGameReview};