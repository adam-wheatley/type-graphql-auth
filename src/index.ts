import "reflect-metadata";
import { createConnection, getConnectionOptions } from "typeorm";
import express from "express";
import cors from 'cors';
import { verify } from 'jsonwebtoken';
import { ApolloServer } from "apollo-server-express";
import cookieParser from 'cookie-parser';
import { createSchema } from "./utils/createSchema";
import { User } from './entity/User';
import { createAccessToken, sendRefreshToken } from './utils/auth';

(async () => {
  const app = express();
  app.use(cors({
      origin: 'http://localhost:3000',
      credentials: true,
  }));
  app.use('/refresh_token', cookieParser());
  app.post('/refresh_token', async (req, res) => {
    const token = req.cookies.jid;
    const invalidToken = () => res.send({ ok: false, accessToken: '' });
    if (!token) return invalidToken();

    let payload: any = null;
    try {
      payload = verify(token, process.env.REFRESH_TOKEN_SECRET!);
    } catch (err) {
      return invalidToken();
    }

    const user = await User.findOne({ id: payload.userId });
    if (!user) return invalidToken();
    if (user.tokenVersion !== payload.tokenVersion) return invalidToken();
    sendRefreshToken(res, user);
    return res.send({ ok: true, accessToken: createAccessToken(user) });
  });

  const options = await getConnectionOptions(
    process.env.NODE_ENV || "development"
  );
  await createConnection({ ...options, name: "default" });
  const schema = await createSchema();

  const apolloServer = new ApolloServer({
    schema,
    context: ({ req, res }) => ({ req, res })
  });

  apolloServer.applyMiddleware({ app, cors: false });
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`server started at http://localhost:${port}/graphql`);
  });
})();
