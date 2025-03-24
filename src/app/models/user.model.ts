import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2'
import exp from "node:constants";

const insert= async (fName: string, lName: string, email: string, password: string) : Promise<ResultSetHeader> => {
    Logger.info(`Adding user: ${fName} ${lName}, to the database`);
    const conn = await getPool().getConnection();
    const query = 'insert into user (first_name, last_name, email, password) values ( ?, ?, ?, ? )';
    const [ result ] = await conn.query(query, [ fName, lName, email, password ]);
    await conn.release();
    return result;
}

const read = async (id: number) : Promise<any> => {
    Logger.info(`Reading user with id; ${id}`);
    const conn = await getPool().getConnection();
    const query = 'select first_name, last_name, email, auth_token from user where id = ?';
    const [ row ] = await conn.query(query, [ id ]);
    await conn.release();
    return row;
}

const login = async (email: string, password: string, token: string): Promise<any> => {
    Logger.info(`Reading user with email; ${email}`);
    const conn = await getPool().getConnection();
    const query = 'select id from user where email = ? and password = ?';
    const [ result ] = await conn.query(query, [ email, password ]);
    await conn.release();
    if (result.length === 0) {
        return null;
    } else {
        const tokenQuery = 'update user set auth_token = ? where email = ? and password = ?';
        await conn.query(tokenQuery, [ token, email, password ]);
        await conn.release();
    }
    return result;
}

export { insert, read, login }