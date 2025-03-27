import { getPool } from '../../config/db';
import Logger from '../../config/logger';

const getGenres = async (): Promise<any> => {
    Logger.info(`Reading all genres`);
    const conn = await getPool().getConnection();
    const query = 'SELECT id AS genreId, name FROM genre';
    const [rows] = await conn.query(query);
    await conn.release();
    return rows;
};

const getPlatforms = async (): Promise<any> => {
    Logger.info(`Reading all genres`);
    const conn = await getPool().getConnection();
    const query = 'SELECT id AS platformId, name FROM platform';
    const [rows] = await conn.query(query);
    await conn.release();
    return rows;
};

const getGame = async (id: number) : Promise<any> => {
    const conn = await getPool().getConnection();
    const query = `select game.id as gameId, game.title, game.genre_id as genreId, game.creator_id as creatorId,
                       user.first_name as creatorFirstName, user.last_name as creatorLastName, game.price, CAST(AVG(game_review.rating) as float) as rating,
                       group_concat(distinct game_platforms.platform_id) as platformIds,
                       game.creation_date as creationDate, game.description,
                       count(distinct owned.id) as numberOfOwners, count(distinct wishlist.id) as numberOfWishlists
                       from game left join user on creator_id = user.id left join game_review on game.id = game_review.game_id
                       left join game_platforms on game.id = game_platforms.game_id
                       left join owned on game.id = owned.game_id left join wishlist on game.id = wishlist.game_id where game.id = ?;`;
    const [gameRows] = await conn.query(query, [id]);
    await conn.release();
    if (gameRows.length === 0) {
        return null;
    }
    return gameRows[0];
}

const getAuth = async (token: string) : Promise<any> => {
    const conn = await getPool().getConnection();
    const query = `SELECT * FROM user WHERE auth_token = ?`;
    const [authRows] = await conn.query(query, [token]);
    await conn.release();
    if (authRows.length > 0 && authRows[0].auth_token) {
        return authRows[0];
    } else {
        return false;
    }
}

const getGames = async (
    include?: string | null,
    genreIds?: string | null,
    price?: number | null,
    platformIds?: string | null,
    creatorId?: number | null,
    reviewerId?: number | null,
    sortBy?: string | null,
    ownedByMe?: boolean | null,
    wishlistedByMe?: boolean | null,
    token?: string | null
    ): Promise<any> => {
    const conn = await getPool().getConnection();
    try {
        const checkIdQuery = `SELECT * FROM user WHERE id = ?`;
        const checkGenresQuery = `SELECT * FROM genre WHERE id = ?`;
        const checkPlatformQuery = `SELECT * FROM platform WHERE id = ?;`;
        let query = `select game.id as gameId,
                            game.title,
                            game.genre_id as genreId,
                            game.creation_date as creationDate,
                            game.creator_id as creatorId,
                            game.price,
                            user.first_name as creatorFirstName,
                            user.last_name as creatorLastName,
                            CAST(AVG(game_review.rating) as float) as rating,
                            group_concat(distinct game_platforms.platform_id) as platformIds
                            from game
                            left join user on creator_id = user.id
                            left join game_review on game.id = game_review.game_id
                            left join game_platforms on game.id = game_platforms.game_id
                            left join owned on game.id = owned.game_id
                            left join wishlist on game.id = wishlist.game_id `;
        const conditions: string[] = [];
        let genresArray: string[] = [];
        let platformsArray: string[] = [];
        if (include) {
            conditions.push(`(game.description LIKE '%${include}%' OR game.title LIKE '%${include}%')`);
        }
        if (price !== null && price !== undefined) {
            conditions.push(`game.price <= ${price}`);
        }
        if (reviewerId) {
            conditions.push(`game_review.user_id = ${reviewerId}`);
        }
        if (creatorId) {
            conditions.push(`game.creator_id = ${creatorId}`);
        }
        if (ownedByMe) {
            const authUser = await getAuth(token)
            if (authUser) {
                conditions.push(`owned.user_id = ${authUser.id}`);
            } else {
                return 'no auth';
            }
        }
        if (wishlistedByMe) {
            const authUser = await getAuth(token)
            if (authUser) {
                conditions.push(`wishlist.user_id = ${authUser.id}`);
            } else {
                return 'no auth';
            }
        }
        if (reviewerId || reviewerId === 0) {
            const [reviewerRows] = await conn.query(checkIdQuery, [reviewerId]);
            if (reviewerRows.length === 0) {
                await conn.release();
                return 'REVIEW_ID_DNE';
            }
        }
        if (creatorId || creatorId === 0) {
            const [creatorRows] = await conn.query(checkIdQuery, [creatorId]);
            if (creatorRows.length === 0) {
                await conn.release();
                return 'CREATOR_ID_DNE';
            }
        }
        if (genreIds) {
            genresArray = Array.isArray(genreIds) ? genreIds : [genreIds];
            for (const genreId of genresArray) {
                const [genreRows] = await conn.query(checkGenresQuery, [genreId]);
                if (genreRows.length === 0) {
                    await conn.release();
                    return 'GENRE_ID_DNE';
                }
            }
        }
        if (platformIds) {
            platformsArray = Array.isArray(platformIds) ? platformIds : [platformIds];
            for (const platformId of platformsArray) {
                const [platformRows] = await conn.query(checkPlatformQuery, [platformId]);
                if (platformRows.length === 0) {
                    await conn.release();
                    return 'PLATFORM_ID_DNE';
                }
            }
        }
        if (genreIds) {
            genresArray = Array.isArray(genreIds) ? genreIds : [genreIds];
        }
        if (genresArray.length > 0) {
            conditions.push(`game.genre_id IN (${genresArray.map(id => Number(id)).join(',')})`);
        }
        if (platformIds) {
            platformsArray = Array.isArray(platformIds) ? platformIds : [platformIds];
        }
        if (platformsArray.length > 0) {
            conditions.push(`game_platforms.platform_id IN (${platformsArray.map(id => Number(id)).join(',')})`)
        }
        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }
        query += ` GROUP BY game.id, game.title, game.genre_id, game.creator_id, user.first_name, user.last_name, game.price`;

        let orderClause = ' ORDER BY ';
        if (sortBy) {
            switch (sortBy) {
                case 'ALPHABETICAL_ASC':
                    orderClause += 'game.title ASC';
                    break;
                case 'ALPHABETICAL_DESC':
                    orderClause += 'game.title DESC';
                    break;
                case 'PRICE_ASC':
                    orderClause += 'game.price ASC';
                    break;
                case 'PRICE_DESC':
                    orderClause += 'game.price DESC';
                    break;
                case 'CREATED_ASC':
                    orderClause += 'game.creation_date ASC';
                    break;
                case 'CREATED_DESC':
                    orderClause += 'game.creation_date DESC';
                    break;
                case 'RATING_ASC':
                    orderClause += 'rating ASC';
                    break;
                case 'RATING_DESC':
                    orderClause += 'rating DESC';
                    break;
                default:
                    orderClause += 'game.creation_date';
            }
        } else {
            orderClause += 'game.creation_date';
        }

        query += orderClause;
        const [rows] = await conn.query(query);
        return rows;
    } finally {
        await conn.release();
    }
};

const createGame = async (title: string, description: string, genreId: number,
                                              price: number, platformIds: string, token: string
                                              ) : Promise<any> => {
    const conn = await getPool().getConnection();
    try {
        let platformsArray: string[] = [];
        const authUser = await getAuth(token)
        const [existing]: any[] = await conn.query('SELECT id FROM game WHERE title = ?', [title]);
        if (existing.length > 0) {
            return 'TITLE_EXISTS';
        }
        const genre = Number(genreId);
        if (isNaN(genre)) {
            return 'INVALID_GENRE';
        } else {
            const [genreRows]: any[] = await conn.query('SELECT id FROM genre WHERE id = ?', [genreId]);
            if (genreRows.length === 0) {
                return 'INVALID_GENRE';
            }
        }
        platformsArray = Array.isArray(platformIds) ? platformIds : [platformIds];
        const platformNumbers = platformsArray.map(id => Number(id));
        const [platformRows]: any[] = await conn.query(`SELECT id FROM platform WHERE id IN (${platformNumbers.join(',')})`);
        if (platformRows.length !== platformNumbers.length) {
            return 'INVALID_PLATFORM';
        }
        const creatorId = authUser.id;
        // Insert the new game. Assuming the game table has a column "creation_date" (using NOW() to record it).
        const [result]: any = await conn.query('INSERT INTO game (title, description, genre_id, price, creation_date, creator_id) VALUES (?, ?, ?, ?, NOW(), ?)', [title, description, genreId, price, creatorId]);
        const gameId = result.insertId;
        for (const platformId of platformNumbers) {
            await conn.query('INSERT INTO game_platforms (game_id, platform_id) VALUES (?, ?)', [gameId, platformId]);
        }
        return gameId;
    } finally {
        await conn.release();
    }
};

const editGame = async (title: string, description: string, genreId: number,
                        price: number, platformIds: string, gameId: number, userId: number): Promise<any> => {
    const conn = await getPool().getConnection();
    try {
        const getGameQuery = `SELECT * FROM game WHERE id = ?`;
        const checkTitleQuery = `SELECT * FROM game WHERE title = ? AND id != ?`;
        const updateGameQuery = `UPDATE game SET title = ?, description = ?, genre_id = ?, price = ? WHERE id = ?`;
        const deletePlatformsQuery = `DELETE FROM game_platforms WHERE game_id = ?`;
        const insertPlatformQuery = `INSERT INTO game_platforms (game_id, platform_id) VALUES (?, ?)`;
        const [gameRow] = await conn.query(getGameQuery, [gameId]);
        if (gameRow.length === 0) {
            return 'GAME_DNE';
        }
        if (gameRow[0].creator_id !== userId) {
            return 'NOT_CREATOR';
        }
        const [checkTitle]: any = await conn.query(checkTitleQuery, [title, gameId]);
        if (checkTitle.length !== 0) {
            return 'TITLE_EXISTS';
        }
        await conn.query(updateGameQuery, [title, description, genreId, price, gameId]);
        const platformsArray: string[] = Array.isArray(platformIds) ? platformIds : [platformIds];
        const platformNumbers = platformsArray.map(id => Number(id));
        await conn.query(deletePlatformsQuery, [gameId]);
        for (const platformId of platformNumbers) {
            await conn.query(insertPlatformQuery, [gameId, platformId]);
        }
        return 'SUCCESS';
    } finally {
        await conn.release();
    }
};

const deleteGame = async (gameId: number, userId: number) : Promise<any> => {
    const conn = await getPool().getConnection();
    try {
        const getGameQuery = `SELECT * FROM game WHERE id = ?`;
        const checkReviewsQuery = `SELECT * FROM game_review where game_id = ?`
        const deletePlatformsQuery = `DELETE FROM game_platforms WHERE game_id = ?`;
        const deleteOwnedQuery = `DELETE FROM owned WHERE game_id = ?`;
        const deleteWishlistQuery = `DELETE FROM wishlist WHERE game_id = ?`;
        const deleteGameQuery = `DELETE from game where id = ?`;
        const [gameRow] = await conn.query(getGameQuery, [gameId]);
        const [reviewRows] = await conn.query(checkReviewsQuery, [gameId]);
        if (gameRow.length === 0) {
            return 'GAME_DNE';
        }
        if (gameRow[0].creator_id !== userId) {
            return 'NOT_CREATOR';
        }
        if (reviewRows.length !== 0) {
            return 'GAME_REVIEWED';
        }
        await conn.query(deletePlatformsQuery, [gameId]);
        await conn.query(deleteOwnedQuery, [gameId]);
        await conn.query(deleteWishlistQuery, [gameId]);
        await conn.query(deleteGameQuery, [gameId]);
        return 'SUCCESS';
    } finally {
        await conn.release();
    }
}

export { getGenres, getPlatforms, getGame, getGames, createGame, getAuth, editGame, deleteGame }