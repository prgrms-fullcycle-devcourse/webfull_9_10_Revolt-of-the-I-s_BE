import pool from '../config/db';
import { UserStatus } from "../utils/validators"

export interface UserEntity {
    uuid: string;
    email: string;
    password?: string;
    name: string;
}

export const signup = async (userData: any): Promise<string> => {
    const sql = `
        INSERT INTO users (uuid, email, password, name, phone, github_url, profile_image, google_uid) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING uuid
    `;

    const params = [
        userData.uuid,
        userData.email,
        userData.password,
        userData.name,
        userData.phone,
        userData.github_url || null,
        userData.profile_image || null,
        userData.google_uid || null
    ];
    const { rows } = await pool.query(sql, params);

    return userData.uuid;
};

export const findUserByEmail = async (email: string): Promise<UserEntity | null> => {
    const sql = 'SELECT * FROM users WHERE email = $1';
    const { rows } = await pool.query(sql, [email]);
    return rows[0] || null;
};

export const patchByEmail = async (uuid: string, teamId: number, status: string): Promise<UserEntity | null> => {
    const sql = 'UPDATE team_member SET status = $1 WHERE user_id = $2 AND team_id = $3 RETURNING *';
    const params = [status, uuid, teamId]
    const { rows } = await pool.query(sql, params);
    return rows[0] || null;
};

export const signupByGoogle = async (userData: any): Promise<number> => {
    const sql = `
        INSERT INTO users (uuid, email, password, name, phone, github_url, profile_image, google_uid) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING uuid
    `;

    const params = [
        userData.uuid,
        userData.email,
        userData.password,
        userData.name,
        userData.phone,
        userData.github_url || null,
        userData.profile_image || null,
        userData.google_uid || null
    ];
    const { rows } = await pool.query(sql, params);

    return userData.uuid;
};