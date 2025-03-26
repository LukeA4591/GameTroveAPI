import { getPool } from '../../config/db';
import Logger from '../../config/logger';

const getReviews = async (gameId: number) : Promise<any> => {
    const conn = await getPool().getConnection();
    const query = `select game_review.user_id as reviewerId, first_name as reviewerFirstName,
    last_name as reviewerLastName, rating, review, timestamp from game_review left join user
    on user_id = user.id where game_id = ? order by timestamp desc`;
    const [ reviews ] = await conn.query(query, [ gameId ]);
    await conn.release();
    return reviews;
}

const setReviews = async (
    gameId: number,
    userId: number,
    rating: number,
    review: string | null
): Promise<any> => {
    const conn = await getPool().getConnection();
    try {
        const gameQuery = `SELECT * FROM game WHERE id = ?`;
        const reviewQuery = `SELECT * FROM game_review WHERE game_id = ?`;
        const [games] = await conn.query(gameQuery, [gameId]);
        const [reviews] = await conn.query(reviewQuery, [gameId]);

        if (games.length === 0) {
            return 'GAME_DNE';
        }

        if (games[0].creator_id === userId) {
            return 'CREATOR';
        }
        for (const existingReview of reviews) {
            if (existingReview.user_id === userId) {
                return 'REVIEWED';
            }
        }
        const insertQuery = `INSERT INTO game_review (game_id, user_id, rating, review, timestamp) VALUES (?, ?, ?, ?, NOW())`;
        await conn.query(insertQuery, [gameId, userId, rating, review]);
        return 'SUCCESS';
    } catch (err) {
        Logger.error(err);
        throw err;
    } finally {
        conn.release();
    }
};


export { getReviews, setReviews }