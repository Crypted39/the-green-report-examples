export const typeDefs = `
type Movie {
    id: ID!
    title: String!
    genre: [String!]!
    reviews: [MovieReview!]
}
type MovieReview {
    id: ID!
    rating: Int!
    content: String!
    movie: Movie!
    director: Director!
}
type Director {
    id: ID!
    name: String!
    verified: Boolean!
    movies: [Movie!]
}
type Query {
    movieReviews: [MovieReview]
    movieReview(id: ID!): MovieReview
    movies: [Movie]
    movie(id: ID!): Movie
    directors: [Director]
    director(id: ID!): Director
}
type Mutation {
    addMovie(movie: AddMovieInput!): Movie
    deleteMovie(id: ID!): [Movie]
    updateMovie(id: ID!, edits: EditMovieInput!): Movie
}
input AddMovieInput {
    title: String!,
    genre: [String!]!
}
input EditMovieInput {
    title: String,
    genre: [String!]
}
`;
