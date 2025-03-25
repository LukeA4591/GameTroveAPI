import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2'
import logger from "../../config/logger";

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
    let query = `select game.id as gameId, game.title, game.genre_id as genreId, game.creation_date as creationDate, game.creator_id as creatorId,
                    game.price, user.first_name as creatorFirstName, user.last_name as creatorLastName, CAST(AVG(game_review.rating) as float) as rating,
                    group_concat(distinct game_platforms.platform_id) as platformIds from game left join user on creator_id = user.id
                    left join game_review on game.id = game_review.game_id left join game_platforms on game.id = game_platforms.game_id
                    left join owned on game.id = owned.game_id left join wishlist on game.id = wishlist.game_id `;

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
        const userQuery = `SELECT * FROM user WHERE auth_token = ?`;
        const [authRows] = await conn.query(userQuery, [token]);
        if (authRows.length > 0 && authRows[0].auth_token) {
            conditions.push(`owned.user_id = ${authRows[0].id}`);
        } else {
            return 'no auth';
        }
    }
    if (wishlistedByMe) {
        const userQuery = `SELECT * FROM user WHERE auth_token = ?`;
        const [authRows] = await conn.query(userQuery, [token]);
        if (authRows.length > 0 && authRows[0].auth_token) {
            conditions.push(`wishlist.user_id = ${authRows[0].id}`);
        } else {
            return 'no auth';
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
    await conn.release();
    return rows;
};



export { getGenres, getPlatforms, getGame, getGames }