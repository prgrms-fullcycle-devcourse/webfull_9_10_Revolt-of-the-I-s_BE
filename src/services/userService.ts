import * as userRepo from '../repositories/userRepository';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET

export interface ServiceError {
    statusCode: number;
    message: string;
}

class AppError extends Error {
  constructor(public statusCode: number, public message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

// --- [회원가입 로직] ---
export const signup = async (userData: any): Promise<string> => {
    const existingUser = await userRepo.findUserByEmail(userData.email);
    if (existingUser) {
        throw new AppError(409, "이미 사용 중인 이메일입니다.");
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const userUuid = uuidv4();

    await userRepo.signup({
        ...userData,
        password: hashedPassword,
        uuid: userUuid
    });

    return userUuid;
};

// --- [로그인 로직] ---
export const login = async (loginData: any): Promise<{ token: string } | ServiceError> => {
    const user = await userRepo.findUserByEmail(loginData.email);
    if (!user) {
        return { statusCode: 401, message: "이메일 또는 비밀번호가 일치하지 않습니다." };
    }

 
    const isMatch = await bcrypt.compare(loginData.password, user.password!);
    if (!isMatch) {
        return { statusCode: 401, message: "이메일 또는 비밀번호가 일치하지 않습니다." };
    }

    const token = jwt.sign(
        { id: user.uuid, email: user.email },
        JWT_SECRET!,
        { expiresIn: '365d' }
    );

    return { token };
};

// --- [구글 로그인] ---
export const googleLogin = async (idToken: string): Promise<{ token: string }> => {

    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID!, 
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
        const error: any = new Error("유효하지 않은 구글 토큰입니다.");
        error.statusCode = 401;
        throw error;
    }

    const { email, name, picture } = payload;

    let user = await userRepo.findUserByEmail(email);

    if (!user) {
        const newUserUuid = uuidv4();
        const signupData = {
            email,
            name: name || 'Google User',
            password: `GOOGLE_${newUserUuid}`,
            uuid: newUserUuid
        };

        await userRepo.signup(signupData);
        
        user = { 
            uuid: newUserUuid, 
            email: email,
            name: signupData.name 
        };
    }

    const token = jwt.sign(
        { uuid: user!.uuid, email: user!.email },
        process.env.JWT_SECRET!,
        { expiresIn: '365d' }
    );

    return { token };
};