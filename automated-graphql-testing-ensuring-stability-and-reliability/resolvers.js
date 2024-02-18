import db from "./db.js";
import { v4 as generateRandomId } from "uuid";

export const resolvers = {
  Query: {
    movies() {
      return db.movies;
    },
    movieReviews() {
      return db.movieReviews;
    },
    directors() {
      return db.directors;
    },
    movieReview(_, args) {
      return db.movieReviews.find((review) => review.id === args.id);
    },
    movie(_, args) {
      return db.movies.find((movie) => movie.id === args.id);
    },
    director(_, args) {
      return db.directors.find((director) => director.id === args.id);
    },
  },
  Movie: {
    reviews(parent) {
      return db.movieReviews.filter((review) => review.movie_id === parent.id);
    },
  },
  Director: {
    movies(parent) {
      return db.movies.filter((movie) =>
        db.movieReviews.some(
          (review) =>
            review.director_id === parent.id && review.movie_id === movie.id
        )
      );
    },
  },
  MovieReview: {
    director(parent) {
      return db.directors.find(
        (director) => director.id === parent.director_id
      );
    },
    movie(parent) {
      return db.movies.find((movie) => movie.id === parent.movie_id);
    },
  },
  Mutation: {
    deleteMovie(_, args) {
      db.movies = db.movies.filter((m) => m.id !== args.id);
      return db.movies;
    },
    addMovie(_, args) {
      let movie = {
        ...args.movie,
        id: generateRandomId(),
      };
      db.movies.push(movie);
      return movie;
    },
    updateMovie(_, args) {
      db.movies = db.movies.map((m) => {
        if (m.id === args.id) {
          return { ...m, ...args.edits };
        }
        return m;
      });
      return db.movies.find((m) => m.id === args.id);
    },
  },
};
