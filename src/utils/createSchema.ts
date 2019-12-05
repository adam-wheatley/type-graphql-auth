import { buildSchema } from "type-graphql";
import { MeResolver } from "../resolvers/User/Me";
import { AuthResolver } from '../resolvers/User/Auth';

export const createSchema = () =>
  buildSchema({
    resolvers: [
        MeResolver,
        AuthResolver,
    ],
});
