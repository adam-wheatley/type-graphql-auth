import { Resolver, Query, Mutation, Arg, Ctx, UseMiddleware} from 'type-graphql';
import { User } from '../../entity/User';
import { Context } from '../../types/Context';
import { isAuth } from '../../utils/isAuth';

@Resolver()
export class MeResolver {
    @Query(() => User, { nullable: true })
    @UseMiddleware(isAuth)
    me(
        @Ctx() { payload }: Context,
    ) {
        try {
            return User.findOne(payload!.userId);
        } catch (err) {
            return new Error('There was an issue trying to retreive user details.');
        }
    }

    @Mutation(() => Boolean, { nullable: true })
    @UseMiddleware(isAuth)
    async updateMe(
        @Ctx() { payload }: Context,
        @Arg('firstName') firstName?: string,
        @Arg('lastName') lastName?: string,
        @Arg('dateOfBirth', { nullable: true }) dateOfBirth?: Date,
    ) {

        try {
            const user = await User.findOne(payload!.userId);
            await User.update(user!.id, { 
                firstName: firstName ? firstName : user!.firstName,
                lastName: lastName ? lastName : user!.lastName,
                dateOfBirth: dateOfBirth ? dateOfBirth : user!.dateOfBirth,
            });
            return true;
        } catch (err) {
            return new Error('There was an error updating your profile.');
        }
    }
}
