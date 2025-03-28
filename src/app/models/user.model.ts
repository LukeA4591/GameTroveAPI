import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2'

const insert= async (fName: string, lName: string, email: string, password: string) : Promise<any> => {
    Logger.info(`Adding user: ${fName} ${lName}, to the database`);
    const conn = await getPool().getConnection();
    const checkEmailQuery = `select * from user where email = ?`;
    const query = 'insert into user (first_name, last_name, email, password) values ( ?, ?, ?, ? )';
    const [ emailResult ] = await conn.query(checkEmailQuery, [email]);
    const [ result ] = await conn.query(query, [ fName, lName, email, password ]);
    await conn.release();
    if (emailResult.length > 0) {
        return 'EMAIL_IN_USE';
    }
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

const logout = async (token: string): Promise<any> => {
    Logger.info(`Logging out user`);
    const conn = await getPool().getConnection();
    const query  = 'update user set auth_token = null where auth_token = ?'
    const [ result ] = await conn.query(query,  [ token ]);
    await conn.release();
    return result;
}

const getUserByToken = async (token: string): Promise<any> => {
    Logger.info(`Fetching user with token: ${token}`);
    const conn = await getPool().getConnection();
    const query = 'SELECT id, password FROM user WHERE auth_token = ?';
    const [rows] = await conn.query(query, [token]);
    await conn.release();
    return rows.length > 0 ? rows[0] : null;
};

const checkEmailExists = async (email: string): Promise<boolean> => {
    Logger.info(`Checking if email exists: ${email}`);
    const conn = await getPool().getConnection();
    const query = 'SELECT id FROM user WHERE email = ?';
    const [rows] = await conn.query(query, [email]);
    await conn.release();
    return rows.length > 0;
};

const verifyPassword = async (userId: number, currentPassword: string): Promise<boolean> => {
    Logger.info(`Verifying password for user ID: ${userId}`);
    const conn = await getPool().getConnection();
    const query = 'SELECT id FROM user WHERE id = ? AND password = ?';
    const [rows] = await conn.query(query, [userId, currentPassword]);
    await conn.release();
    return rows.length > 0;
};

const updateUser = async (userId: number, updateData: any): Promise<void> => {
    Logger.info(`Updating user ID: ${userId}`);
    const conn = await getPool().getConnection();

    let query = 'UPDATE user SET ';
    const values = [];

    if (updateData.firstName) {
        query += 'first_name = ?, ';
        values.push(updateData.firstName);
    }
    if (updateData.lastName) {
        query += 'last_name = ?, ';
        values.push(updateData.lastName);
    }
    if (updateData.email) {
        query += 'email = ?, ';
        values.push(updateData.email);
    }
    if (updateData.password) {
        query += 'password = ?, ';
        values.push(updateData.password);
    }

    query = query.slice(0, -2);
    query += ' WHERE id = ?';
    values.push(userId);

    await conn.query(query, values);
    await conn.release();
};


export { insert, read, login, logout, checkEmailExists, updateUser, getUserByToken, verifyPassword }