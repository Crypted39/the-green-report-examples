import { graphql } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import db from "./db";
import { typeDefs } from "./schema";
import { resolvers } from "./resolvers";

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

test("Integration Test: Adding a Movie", async () => {
  const mutation = `
    mutation {
      addMovie(movie: { title: "New Movie", genre: ["Action", "Adventure"] }) {
        id
        title
        genre
      }
    }
  `;

  const initialMoviesCount = db.movies.length;

  const { data } = await graphql({ schema, source: mutation });
  expect(data.addMovie.id).toEqual(expect.any(String));
  expect(data.addMovie.title).toEqual("New Movie");
  expect(data.addMovie.genre).toEqual(["Action", "Adventure"]);

  // Check if the new movie is added to the mock database
  expect(db.movies.length).toBe(initialMoviesCount + 1);
  const newMovie = db.movies.find((movie) => movie.title === "New Movie");
  expect(newMovie).toBeTruthy();
});
