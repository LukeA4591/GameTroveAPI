import { getPool } from '../../config/db';
import Logger from '../../config/logger';

const getGameImage = async (gameId: number) : Promise<any> => {
    const conn = await getPool().getConnection();
    const gameQuery = `select * from game where id = ?`;
    const [gameRow] = await conn.query(gameQuery, [gameId]);
    await conn.release();
    if (gameRow.length === 0) {
        return 'DNE';
    } else if (gameRow[0].image_filename === null ) {
        return 'DNE';
    }
    return gameRow[0].image_filename;
}

const setGameImage = async (gameId: number, userId: number, filename: string) : Promise<any> => {
    let newImage: boolean = false;
    const conn = await getPool().getConnection();
    const gameQuery = `select * from game where id = ?`;
    const [gameRow] = await conn.query(gameQuery, [gameId]);
    if (gameRow.length === 0) {
        await conn.release();
        return 'DNE'
    } else if (parseInt(gameRow[0].creator_id, 10) !== userId) {
        await conn.release();
        return 'NOT_OWNER'
    } else if (gameRow[0].image_filename === null) {
        newImage = true;
    }
    const updateImage = `update game set image_filename = ? where id = ?`;
    await conn.query(updateImage, [ filename, gameId ]);
    await conn.release();
    return newImage;
}

export { getGameImage, setGameImage }