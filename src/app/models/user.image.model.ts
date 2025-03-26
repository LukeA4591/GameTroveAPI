import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2';
import {promises} from "node:dns";

const getUserImage = async (id: number) : Promise<any> => {
    const conn = await getPool().getConnection();
    const userQuery = `select * from user where id = ?`;
    const [userRow] = await conn.query(userQuery, [id]);
    await conn.release();
    if (userRow.length === 0) {
        return 'DNE';
    } else if (userRow[0].image_filename === null ) {
        return 'DNE';
    }
    return userRow[0].image_filename;
}

const setUserImage = async (userId: number, filename: string) : Promise<any> => {
    let newImage: boolean = false;
    const conn = await getPool().getConnection();
    const userQuery = `select * from user where id = ?`;
    const [userRow] = await conn.query(userQuery, [userId]);
    if (userRow.length === 0) {
        await conn.release();
        return 'DNE'
    } else if (userRow[0].image_filename === null) {
        newImage = true;
    }
    const updateImage = `update user set image_filename = ? where id = ?`;
    await conn.query(updateImage, [ filename, userId ]);
    await conn.release();
    return newImage;
}

const deleteImage = async (userid: number) : Promise<any> => {
    const conn = await getPool().getConnection();
    const query = `UPDATE user SET image_filename = NULL WHERE id = ?`;
    const [userRow] = await conn.query(query, [userid]);
    if (userRow.length === 0) {
        await conn.release();
        return 'DNE'
    }
    return 'SUCCESS';
}


export { getUserImage, setUserImage, deleteImage }