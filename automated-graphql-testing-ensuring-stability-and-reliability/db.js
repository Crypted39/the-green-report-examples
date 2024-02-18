let movies = [
  { id: "1", title: "Inception", genre: ["Sci-Fi", "Action"] },
  { id: "2", title: "The Shawshank Redemption", genre: ["Drama"] },
  { id: "3", title: "Pulp Fiction", genre: ["Crime", "Drama"] },
  { id: "4", title: "The Dark Knight", genre: ["Action", "Crime"] },
  { id: "5", title: "Forrest Gump", genre: ["Drama", "Romance"] },
];

let directors = [
  { id: "1", name: "Christopher Nolan", verified: true },
  { id: "2", name: "Quentin Tarantino", verified: false },
  { id: "3", name: "Frank Darabont", verified: true },
];

let movieReviews = [
  {
    id: "1",
    rating: 9,
    content: "Amazing film!",
    director_id: "1",
    movie_id: "2",
  },
  {
    id: "2",
    rating: 8,
    content: "Mind-bending plot!",
    director_id: "1",
    movie_id: "1",
  },
  {
    id: "3",
    rating: 7,
    content: "Quirky and unconventional.",
    director_id: "2",
    movie_id: "3",
  },
  {
    id: "4",
    rating: 5,
    content: "Could have been better.",
    director_id: "3",
    movie_id: "4",
  },
  {
    id: "5",
    rating: 8,
    content: "Heartwarming and inspiring.",
    director_id: "3",
    movie_id: "5",
  },
  {
    id: "6",
    rating: 7,
    content: "Clever and engaging.",
    director_id: "1",
    movie_id: "2",
  },
  {
    id: "7",
    rating: 10,
    content: "A masterpiece!",
    director_id: "2",
    movie_id: "1",
  },
];

export default { movies, directors, movieReviews };
