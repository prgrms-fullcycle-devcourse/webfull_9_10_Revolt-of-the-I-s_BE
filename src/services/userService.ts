import * as userRepo from '../repositories/userRepository';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { AppError } from "../utils/response";
import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';
import pusher from '../config/pusher';
import { deleteFileFromS3 } from '../utils/s3';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET

export interface ServiceError {
    statusCode: number;
    message: string;
}

// --- [회원가입 로직] ---
export const signup = async (userData: any, file?: Express.Multer.File): Promise<string> => {
    const existingUser = await userRepo.findUserByEmail(userData.email);
    if (existingUser) {
        throw new AppError(409, "이미 사용 중인 이메일입니다.");
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const userUuid = uuidv4();
    const s3File = file as Express.MulterS3.File;
    const profile_image_url = s3File ? s3File.location : null;
    
    await userRepo.signup({
        ...userData,
        password: hashedPassword,
        uuid: userUuid,
        profile_image_url: profile_image_url,
    });

    return userUuid;
};

// --- [로그인 로직] ---
export const login = async (loginData: any): Promise<{ token: string; user: any } | ServiceError> => {
    const user = await userRepo.findUserByEmail(loginData.email);
    if (!user) {
        throw new AppError(401, "이메일 또는 비밀번호가 일치하지 않습니다");
    }

 
    const isMatch = await bcrypt.compare(loginData.password, user.password!);
    if (!isMatch) {
        throw new AppError(401, "이메일 또는 비밀번호가 일치하지 않습니다");
    }

    const token = jwt.sign(
        { id: user.uuid, email: user.email, name: user.name, profileImage : user.profile_image },
        JWT_SECRET!,
        { expiresIn: '1h' }
    );

    return { token, user };
};

// --- [구글 로그인] ---
type GoogleLoginResponse = 
    | { isNewUser: true; user: any} 
    | { isNewUser: false; token: string; user: any }; 

export const googleLogin = async (idToken: string): Promise<GoogleLoginResponse> => {
    const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID!
    });
    const payload = ticket.getPayload();
    
    if (!payload) throw new AppError(401, "토큰이 유효하지 않습니다.");

    const { sub, email, name } = payload;
    
    const user = await userRepo.findUserByEmail(email!);

    if (!user) {
        return {
            isNewUser: true,
            user: {
                email: email!,
                google_uid: sub,
                name: name || 'Google User',
            }
        };
    }

    const token = jwt.sign(
        { uuid: user.uuid, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
    );

    return {
        isNewUser: false,
        token,
        user
    };
};

interface googleUserData {
    email: string;
    googleUid: string;
    name: string;
    profileImage?: string;
    github_url?: string;
    phone: any;
}

// --- [구글 회원가입] ---
export const googleSignup = async (userData: any, file?: Express.Multer.File) => {
    const existingUser = await userRepo.findUserByEmail(userData.email);
    if (existingUser) {
        throw new AppError(409, "이미 가입된 이메일입니다.");
    }

    const s3File = file as Express.MulterS3.File;
    const profile_image_url = s3File ? s3File.location : null;
    const newUserUuid = uuidv4();

    await userRepo.signupByGoogle({
        ...userData,
        uuid: newUserUuid,
        password: `GOOGLE_${newUserUuid}`,
        profile_image_url: profile_image_url,
    });

    const token = jwt.sign(
        { uuid: newUserUuid, email: userData.email },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
    );

    return { token, user: userData };
};

// 상태 수정
export const status = async (uuid: string, teamId: number, status: string): Promise<{ user: any } | ServiceError> => {
    const user = await userRepo.patchByEmail(uuid, teamId, status);
    if (!user) {
        throw new AppError(400, "잘못된 입력입니다.");
    }

    pusher.trigger(`team-${teamId}`, "status-updated", {
        email: user.email,
        status: status, 
        name: user.name
    });

    return { user }
};

// 프로필 이미지 수정
export const updateProfileImage = async (email: string, file?: Express.Multer.File) => {
    if (!file) {
        throw new AppError(400, "업로드할 이미지 파일이 없습니다.");
    }
  
    const user = await userRepo.findUserByEmail(email);
    if (!user) {
        throw new AppError(404, "존재하지 않는 유저입니다.");
    }

    const s3File = file as Express.MulterS3.File;
    const newProfileImageUrl = s3File.location;
    const oldProfileImageUrl = user.profile_image; 

    try {
        await userRepo.updateProfileImage(user.uuid, newProfileImageUrl);

        if (oldProfileImageUrl) {
            await deleteFileFromS3(oldProfileImageUrl); 
        }

        return {
            success: true,
            message: "프로필 이미지가 성공적으로 수정되었습니다.",
            imageUrl: newProfileImageUrl 
        };

    } catch (error) {
        await deleteFileFromS3(newProfileImageUrl);
        console.error("프로필 이미지 수정 중 오류:", error);
        throw new AppError(500, "프로필 이미지 수정 중 서버 오류가 발생했습니다.");
    }
};