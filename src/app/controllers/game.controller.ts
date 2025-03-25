import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as games from "../models/game.model";
import logger from "../../config/logger";


const getAllGames = async(req: Request, res: Response): Promise<void> => {
    try {
        // Convert query parameters to their correct types
        const startIndex = req.query.startIndex ? parseInt(req.query.startIndex as string, 10) : null;
        const count = req.query.count ? parseInt(req.query.count as string, 10) : null;
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

        // Allowed sortBy values.
        const allowedSortBy = [
            "ALPHABETICAL_ASC",
            "ALPHABETICAL_DESC",
            "PRICE_ASC",
            "PRICE_DESC",
            "CREATED_ASC",
            "CREATED_DESC",
            "RATING_ASC",
            "RATING_DESC"
        ];

        // Validate sortBy if provided.
        if (sortBy && !allowedSortBy.includes(sortBy)) {
            // Return a 400 error if invalid.
            res.status(400).send({ error: "Invalid sortBy parameter" });
            return;
        }
        // Validate genreIds: ensure each value is a valid number.
        const genresArray: number[] = [];
        if (genreIds) {
            // Normalize to an array
            const genreIdsArr = Array.isArray(genreIds) ? genreIds : [genreIds];
            for (const id of genreIdsArr) {
                const parsed = Number(id);
                if (isNaN(parsed)) {
                    res.status(400).send({ error: "Invalid genreIds parameter" });
                    return;
                }
                genresArray.push(parsed);
            }
        }

        // Validate platformIds similarly if provided.
        const platformsArray: number[] = [];
        if (platformIds) {
            const platformIdsArr = Array.isArray(platformIds) ? platformIds : [platformIds];
            for (const id of platformIdsArr) {
                const parsed = Number(id);
                if (isNaN(parsed)) {
                    res.status(400).send({ error: "Invalid platformIds parameter" });
                    return;
                }
                platformsArray.push(parsed);
            }
        }

        // Validate price: must be a number and non-negative.
        if (price !== null && price !== undefined) {
            if (typeof price !== "number" || price < 0) {
                res.status(400).send({ error: "Invalid price parameter" });
                return;
            }
        }

        // Validate creatorId: must be a number.
        let creatorIdNum: number | null = null;
        if (creatorId !== null && creatorId !== undefined) {
            creatorIdNum = Number(creatorId);
            if (isNaN(creatorIdNum)) {
                res.status(400).send({ error: "Invalid creatorId parameter" });
                return;
            }
        }

        // Validate reviewerId: must be a number.
        let reviewerIdNum: number | null = null;
        if (reviewerId !== null && reviewerId !== undefined) {
            reviewerIdNum = Number(reviewerId);
            if (isNaN(reviewerIdNum)) {
                res.status(400).send({ error: "Invalid reviewerId parameter" });
                return;
            }
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
        res.status(200).send(game);
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const addGame = async(req: Request, res: Response): Promise<void> => {
    try {
        res.statusMessage = "Not Implemented";
        res.status(501).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
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