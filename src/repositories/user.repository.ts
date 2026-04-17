import pool from '../config/db';
import { UserStatus } from "../utils/middlewares/validators"

export interface UserEntity {
    uuid: string;
    email: string;
    password?: string;
    name: string;
    googleUid ?: string | null;
    profile_image ?: string | null;
    phone ?: string | null;
    github_url ?: string | null;
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
        userData.profile_image_url || null,
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

export const patchStatusByEmail = async (uuid: string, teamId: number, status: string): Promise<UserEntity | null> => {
    const sql = 'UPDATE team_member SET status = $1 WHERE user_id = $2 AND team_id = $3 RETURNING *';
    const params = [status, uuid, teamId]
    const { rows } = await pool.query(sql, params);
    return rows[0] || null;
};

export const patchStatus = async (uuid: string, status: string): Promise<UserEntity | null> => {
    const sql = 'UPDATE team_member SET status = $1 WHERE user_id = $2 RETURNING *';
    const params = [status, uuid]
    const { rows } = await pool.query(sql, params);
    return rows[0] || null;
};

export const getStatus = async (uuid: string) => {
    const sql = 'SELECT status FROM team_member WHERE user_id = $1';
    const { rows } = await pool.query(sql, [uuid]);
    return rows[0]?.status || null;
}

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
        userData.profile_image_url || null,
        userData.google_uid || null
    ];

    await pool.query(sql, params); 

    return userData.uuid;
};

export const updateProfileImage = async (userId: string, imageUrl: string) => {
    const sql = `UPDATE users SET profile_image = $1 WHERE uuid = $2`;
    await pool.query(sql, [imageUrl, userId]);
};
