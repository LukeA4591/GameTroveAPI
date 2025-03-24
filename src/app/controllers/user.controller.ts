import * as users from '../models/user.model';
import {Request, response, Response} from "express";
import Logger from '../../config/logger';
import * as schemas from '../resources/schemas.json';
import{validate} from "../services/validator";
import crypto from "crypto";
import logger from "../../config/logger";


const register = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`POST create a user; ${req.body.firstName} ${req.body.lastName}`)
    const validation = await validate(schemas.user_register, req.body);
    if (validation !== true) {
        res.status(400).send();
        return;
    }
    const fName = req.body.firstName;
    const lName = req.body.lastName;
    const email = req.body.email;
    const password = req.body.password;
    try {
        const result = await users.insert(fName, lName, email, password);
        res.status(201).send({"userId": result.insertId});
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const login = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`POST login to user; ${req.body.email}`);
    const validation = await validate(schemas.user_login, req.body);
    if (validation !== true) {
        res.status(400).send();
        return;
    }
    try {
        const token = crypto.randomBytes(16).toString("hex");
        const result = await users.login(req.body.email, req.body.password, token);
        if (result === null) {
            res.status(401).send();
            return;
        } else {
            res.status(200).send({"userId": result[0].id, "token": token});
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        res.statusMessage = "Not Implemented";
        res.status(501).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const view = async (req: Request, res: Response): Promise<void> => {
    const Id = req.params.id;
    Logger.http(`GET user with id: ${Id}`);
    try {
        const result = await users.read(parseInt(Id, 10));
        if (result.length === 0) {
            res.status(404).send();
        } else {
            const fName = result[0].first_name;
            const lName = result[0].last_name;
            const email = result[0].email;
            const tokenDB = result[0].auth_token;
            const token = req.headers['X-Authorization'];
            logger.info(typeof token);
            if (tokenDB === token) {
                res.status(200).send({
                    "firstName": fName,
                    "lastName": lName,
                    "email": email
                });
            } else {
                res.status(200).send({
                    "firstName": fName,
                    "lastName": lName,
                });
            }
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

const update = async (req: Request, res: Response): Promise<void> => {
    try {
        res.statusMessage = "Not Implemented";
        res.status(501).send();
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

export {register, login, logout, view, update}