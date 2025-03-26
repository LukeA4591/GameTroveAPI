import { getPool } from '../../config/db';
import Logger from '../../config/logger';

const getReviews = async (gameId: number) : Promise<any> => {
    const conn = await getPool().getConnection();
    const query = `select game_review.user_id as reviewer_id, first_name as reviewerFirstName,
    last_name as reviewerLastName, rating, review, timestamp from game_review left join user
    on user_id = user.id where game_id = ? order by timestamp`;
    const [ reviews ] = await conn.query(query, [ gameId ]);
    await conn.release();
    return reviews;
}

export { getReviews }