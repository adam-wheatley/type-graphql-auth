import { Resolver, Mutation, Arg, ObjectType, Field, Ctx } from 'type-graphql';
import { hash, compare } from 'bcryptjs';
import { User } from '../../entity/User';
import { Context } from '../../types/Context';
import { createAccessToken, sendRefreshToken } from '../../utils/auth';
import { getConnection } from 'typeorm';

@ObjectType()
class LoginResponse {
    @Field() accessToken: string
    @Field(() => User) user: User;
}

@Resolver()
export class AuthResolver {
    @Mutation(() => Boolean)
    async logout(
        @Ctx() { res }: Context
    ) {
        res.clearCookie('jid', {
            path: '/refresh_token',
        });
        return true;
    }

    @Mutation(() => User, { nullable: true })
    async register(
        @Arg('email') email: string,
        @Arg('password') password: string,
        @Arg('firstName') firstName?: string,
        @Arg('lastName') lastName?: string,
    ) {
        const hashedPassword = await hash(password, 12);
        try {
            const user = await User.create({
                email,
                password: hashedPassword,
                firstName,
                lastName,
            }).save();

            return user;
        } catch (err) {
            return new Error('Failed to register new user.');
        }
    }

    @Mutation(() => Boolean)
    async revokeRefreshTokensForUser(
        @Arg('userId', () => String) userId: string,
    ) {
        await getConnection().getRepository(User).increment({ id: userId }, 'tokenVersion', 1);
        return true;
    }

    @Mutation(() => LoginResponse)
    async login(
        @Arg('email') email: string,
        @Arg('password') password: string,
        @Ctx() { res }: Context
    ): Promise<LoginResponse> {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            throw new Error('Could not find user!');
        }

        const valid = await compare(password, user.password);
        if (!valid) {
            throw new Error('Bad Password!');
        }

        sendRefreshToken(res, user);

        return {
            accessToken: createAccessToken(user),
            user
        };
    }
}