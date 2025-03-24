import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as userImage from '../models/user.image.model';


const getImage = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    try {
        const imagePath = await userImage.read(parseInt(id, 10));

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const setImage = async (req: Request, res: Response): Promise<void> => {
    try {
        res.statusMessage = "Not Implemented";
        res.status(501).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const deleteImage = async (req: Request, res: Response): Promise<void> => {
    try {
        res.statusMessage = "Not Implemented";
        res.status(501).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

export {getImage, setImage, deleteImage}