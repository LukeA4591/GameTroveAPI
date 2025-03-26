import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as games from "../models/game.model";
import * as schemas from '../resources/schemas.json';
import { validate } from "../services/validator";


const getAllGames = async(req: Request, res: Response): Promise<void> => {
    try {
        // Convert query parameters to their correct types
        const startIndex = req.query.startIndex;
        const count = req.query.count;
        const include = req.query.q as string | null;
        const genreIds = req.query.genreIds as string | null;
        const price = req.query.price ? parseInt(req.query.price as string, 10) : null;
        const platformIds = req.query.platformIds as string | null;
        const creatorId = req.query.creatorId ? parseInt(req.query.creatorId as string, 10) : null;
        const reviewerId = req.query.reviewerId ? parseInt(req.query.reviewerId as string, 10) : null;
        const sortBy = req.query.sortBy as string | null;
        const ownedByMe = req.query.ownedByMe ? req.query.ownedByMe === "true" : null;
        const wishlistedByMe = req.query.wishlistedByMe ? req.query.wishlistedByMe === "true" : null;
        const token = req.header('X-Authorization');
        const validation = await validate(schemas.game_search, req.query);
        if (validation !== true) {
            res.status(400).send();
        }
        let gameList = await games.getGames(
            include,
            genreIds,
            price,
            platformIds,
            creatorId,
            reviewerId,
            sortBy,
            ownedByMe,
            wishlistedByMe,
            token
        );
        if (gameList === 'no auth') {
            res.status(401).send();
            return;
        }
        const numGames = gameList.length;
        if (numGames === 0) {
            res.status(400).send();
            return;
        }
        for (const game of gameList) {
            const platforms = game.platformIds.split(',').map(Number);
            game.platformIds = platforms;
            const rating = game.rating;
            if (!rating) {
                game.rating = 0;
            }
        }
        if (startIndex) {
            gameList = gameList.slice(startIndex);
        }
        if (count) {
            gameList = gameList.slice(0, count);
        }
        // Send the response
        res.status(200).send({"games": gameList, "count": numGames});
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const getGame = async(req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    try {
        if (isNaN(parseInt(id, 10))) {
            res.status(400).send();
            return;
        }
        const game = await games.getGame(parseInt(id, 10));
        const platforms = game.platformIds.split(',').map(Number);
        game.platformIds = platforms;
        if (game.rating === null) {
            game.rating = 0;
        }
        res.status(200).send(game);
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const addGame = async(req: Request, res: Response): Promise<void> => {
    try {
        const title = req.body.title;
        const description = req.body.description;
        const genreId = req.body.genreId;
        const price = req.body.price;
        const platformIds = req.body.platformIds;
        const token = req.header('X-Authorization');
        const validation = await validate(schemas.game_post, req.body);
        const auth = await games.getAuth(token);
        if (!auth) {
            res.status(401).send({error: "auth"});
            return;
        }
        if (validation !== true) {
            res.status(400).send({error: "validation"});
            return;
        }
        const gameId = await games.createGame(title, description, Number(genreId), Number(price), platformIds, token);
        if (gameId === 'TITLE_EXISTS') {
            res.status(403).send({ error: 'title already exists' });
        } else if (gameId === 'INVALID_GENRE') {
            res.status(400).send({error: "genre"});
        } else if (gameId === 'INVALID_PLATFORM') {
            res.status(400).send({error: "platform"});
        } else {
            res.status(201).send({ gameId });
        }
    } catch (err) {
        res.status(500).send({ error: 'Internal Server Error' });
    }
}



const editGame = async(req: Request, res: Response): Promise<void> => {
    try {
        res.statusMessage = "Not Implemented";
        res.status(501).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const deleteGame = async(req: Request, res: Response): Promise<void> => {
    try {
        res.statusMessage = "Not Implemented";
        res.status(501).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}


const getGenres = async(req: Request, res: Response): Promise<void> => {
    try {
        const genres = await games.getGenres();
        res.status(200).send(genres);
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const getPlatforms = async(req: Request, res: Response): Promise<void> => {
    try {
        const platforms = await games.getPlatforms();
        res.status(200).send(platforms);
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}


export {getAllGames, getGame, addGame, editGame, deleteGame, getGenres, getPlatforms};