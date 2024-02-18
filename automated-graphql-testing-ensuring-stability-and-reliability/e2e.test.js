import express from "express";
import { ApolloServer } from "apollo-server-express";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs } from "./schema";
import { resolvers } from "./resolvers";
import db from "./db";

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const server = new ApolloServer({ schema });

const startServer = async () => {
  await server.start();
  const app = express();
  server.applyMiddleware({ app });

  const port = process.env.PORT || 4000; // Use environment variable or default port

  return new Promise((resolve) => {
    app.listen(port, () => {
      console.log(`Server ready at http://localhost:${port}/graphql`);
      resolve(app);
    });
  });
};

const request = require("supertest");

describe("End-to-End Tests", () => {
  let app;

  beforeAll(async () => {
    app = await startServer();
  });

  test("Query: Get Movies", async () => {
    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
          query {
            movies {
              id
              title
              genre
            }
          }
        `,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data.movies");
    expect(response.body.data.movies).toHaveLength(db.movies.length);
  });

  test("Mutation: Add Movie", async () => {
    const initialMoviesCount = db.movies.length;

    const response = await request(app)
      .post("/graphql")
      .send({
        query: `
          mutation {
            addMovie(movie: { title: "New Movie", genre: ["Action", "Adventure"] }) {
              id
              title
              genre
            }
          }
        `,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data.addMovie");
    expect(response.body.data.addMovie).toHaveProperty("id");
    expect(response.body.data.addMovie.title).toBe("New Movie");
    expect(response.body.data.addMovie.genre).toEqual(["Action", "Adventure"]);

    expect(db.movies.length).toBe(initialMoviesCount + 1);
    const newMovie = db.movies.find((movie) => movie.title === "New Movie");
    expect(newMovie).toBeTruthy();
  });

  afterAll(async () => {
    await server.stop();
  });
});

process.on("exit", () => {
  server.stop();
});
