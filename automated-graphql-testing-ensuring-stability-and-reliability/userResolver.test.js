import { graphql } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import db from "./db";
import { typeDefs } from "./schema";
import { resolvers } from "./resolvers";

// Merge your resolvers with the default resolvers
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

describe("Movie Resolver", () => {
  test("Movie resolver returns correct movie by ID", async () => {
    // Mocking the input parameters
    const source = `
      query {
        movie(id: "1") {
          id
          title
          genre
        }
      }
    `;

    // Execute the query against the schema
    const { data } = await graphql({ schema, source });
    // Expected movie object based on your provided data
    const expectedMovie = db.movies.find((movie) => movie.id === "1");
    // Assertion: Check if the result matches the expected movie object
    expect(data.movie).toEqual(expectedMovie);
  });

  test("Movie resolver returns reviews for the movie", async () => {
    // Mocking the input parameters
    const source = `
      query {
        movie(id: "1") {
          id
          title
          reviews {
            id
            rating
            content
          }
        }
      }
    `;

    // Execute the query against the schema
    const { data } = await graphql({ schema, source });
    // Expected reviews for the movie with ID "1"
    const expectedReviews = db.movieReviews.filter(
      (review) => review.movie_id === "1"
    );
    // Filtering out properties that were not requested
    const filteredReviews = expectedReviews.map((obj) => {
      const { director_id, movie_id, ...rest } = obj;
      return rest;
    });

    // Assertion: Check if the result matches the expected reviews
    expect(data.movie.reviews).toEqual(filteredReviews);
  });
});
