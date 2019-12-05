import { sign } from 'jsonwebtoken';
import { Response } from 'express';
import { User } from '../entity/User';

export const createAccessToken = (user: User) => sign(
    { userId: user.id }, 
    process.env.ACCESS_TOKEN_SECRET!, 
    { expiresIn: '15m' }
);

export const createRefreshToken = (user: User) => sign(
    {
        userId: user.id,
        tokenVersion: user.tokenVersion
    },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: "7d" }
);

export const sendRefreshToken = async (res: Response, user: User) => {
    var date = new Date();
    var oneWeek = 7 * 24 * 60 * 60 * 1000;
    date.setTime(date.getTime() + oneWeek * 4);

    res.cookie(
        'jid',
        createRefreshToken(user),
        {
            httpOnly: true,
            path: '/refresh_token',
            expires: date,
        }
    );
}
