import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';

const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_BUCKET_NAME!,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
            const extension = path.extname(file.originalname);
            const basename = path.basename(file.originalname, extension);
            cb(null, `archives/${Date.now()}_${basename}${extension}`);
        },
        
    }),
    limits: { fileSize: 20 * 1024 * 1024 },
});

export const deleteFileFromS3 = async (fileUrl: string) => {
    try {
        const decodedUrl = decodeURIComponent(fileUrl);
        const key = decodedUrl.split(`${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`)[1];

        if (!key) return;

        const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
        });

        await s3.send(command);
    } catch (error) {
        console.error('S3 파일 삭제 실패:', error);
    }
};