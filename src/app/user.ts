type User = {
    /**
     * User id as defined by the database
     */
    user_id: number,
    /**
     * Users first name as entered when created
     */
    firstName: string
    /**
     * Users last name as entered when created
     */
    lastName: string
    /**
     * Users email  as entered when created
     */
    email: string
    /**
     * Users password as entered when created
     */
    password: string | null
}