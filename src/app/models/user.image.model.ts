import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2';

const read = async (id: number) : Promise<any> => {
    Logger.info(`Getting image for user; ${id}`);
    const conn = await getPool().getConnection();
    const query = 'select image_filename from user where id = ?';
    const [ result ] = await conn.query(query, [ id ]);
    await conn.release();
    return result;
}

export { read }