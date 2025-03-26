import { getPool } from '../../config/db';
import Logger from '../../config/logger';

const deleteOwnedOrWish = async (gameId: number, userId: number, owned: boolean): Promise<any> => {
    let table;
    if (owned) {
        table = 'owned';
    } else {
        table = 'wishlist';
    }
    const conn = await getPool().getConnection();
    const gameQuery = `select * from game where id = ?`;
    const query = `select * from ${table} where game_id = ? and user_id = ?`;
    const [rows] = await conn.query(query, [ gameId, userId ]);
    const [gameRow] = await conn.query(gameQuery, [ gameId ]);
    if (gameRow.length === 0) {
        await conn.release();
        return 'GAME_DNE';
    }
    if (rows.length === 0) {
        await conn.release();
        return 'GAME_NOT';
    }
    const delQuery = `DELETE FROM ${table} WHERE game_id = ? AND user_id = ?`;
    await conn.query(delQuery, [gameId, userId]);
    await conn.release();
    return 'SUCCESS';
}

const addToOwned = async (gameId: number, userId: number) : Promise<any> => {
    const conn = await getPool().getConnection();
    const gameQuery = `select * from game where id = ?`;
    const ownedQuery = `select * from owned where game_id = ? and user_id = ?`;
    const wishlistQuery = `select * from wishlist where game_id = ? and user_id = ?`;
    const [gameRow] = await conn.query(gameQuery, [gameId]);
    const [ownedRow] = await conn.query(ownedQuery, [gameId, userId]);
    const [wishlistRow] = await conn.query(wishlistQuery, [gameId, userId]);
    if (gameRow.length === 0) {
        await conn.release();
        return 'GAME_DNE';
    } else if (gameRow[0].creator_id === userId) {
        await conn.release();
        return 'GAME_CREATOR';
    } else if (ownedRow.length !== 0) {
        await conn.release();
        return 'GAME_ALREADY_OWNED';
    }
    const insertQuery = `INSERT INTO owned (game_id, user_id) VALUES (?, ?)`;
    await conn.query(insertQuery, [gameId, userId]);
    if (wishlistRow.length > 0) {
        const deleteWishlistQuery = `DELETE FROM wishlist WHERE game_id = ? AND user_id = ?`;
        await conn.query(deleteWishlistQuery, [gameId, userId]);
    }
    await conn.release();
    return 'GAME_ADDED';
}

const addToWishlist = async (gameId: number, userId: number) : Promise<any> => {
    const conn = await getPool().getConnection();
    const gameQuery = `select * from game where id = ?`;
    const ownedQuery = `select * from owned where game_id = ? and user_id = ?`;
    const wishlistQuery = `select * from wishlist where game_id = ? and user_id = ?`;
    const [gameRow] = await conn.query(gameQuery, [gameId]);
    const [ownedRow] = await conn.query(ownedQuery, [gameId, userId]);
    const [wishlistRow] = await conn.query(wishlistQuery, [gameId, userId]);
    if (gameRow.length === 0) {
        await conn.release();
        return 'GAME_DNE';
    } else if (gameRow[0].creator_id === userId) {
        await conn.release();
        return 'GAME_CREATOR';
    } else if (ownedRow.length !== 0) {
        await conn.release();
        return 'GAME_ALREADY_OWNED';
    } else if (wishlistRow.length !== 0 ) {
        await conn.release();
        return 'GAME_ALREADY_WISHLIST';
    }
    const insertQuery = `INSERT INTO wishlist (game_id, user_id) VALUES (?, ?)`;
    await conn.query(insertQuery, [gameId, userId]);
    await conn.release();
    return 'GAME_ADDED';
}

export { deleteOwnedOrWish, addToOwned, addToWishlist }