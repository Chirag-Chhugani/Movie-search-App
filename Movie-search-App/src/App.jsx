import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_KEY = import.meta.env.VITE_OMDB_API_KEY;
const BASE_URL = "https://www.omdbapi.com/"; // Ensure HTTPS is used // Use HTTPS
console.log(API_KEY);

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchTerm) {
      setLoading(true);
      axios
        .get(`${BASE_URL}?apikey=${API_KEY}&s=${searchTerm}&type=movie&page=1`)
        .then(async (response) => {
          if (!response.data.Search) {
            setMovies([]);
            setFilteredMovies([]);
            setLoading(false);
            return;
          }
          
          const movieList = response.data.Search;
          const detailedMovies = await Promise.all(
            movieList.map(async (movie) => {
              const details = await axios.get(`${BASE_URL}?apikey=${API_KEY}&i=${movie.imdbID}&plot=full`);
              return { ...movie, Genre: details.data.Genre };
            })
          );
          
          setMovies(detailedMovies);
          setFilteredMovies(detailedMovies);
          extractGenres(detailedMovies);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching movies:', error);
          setLoading(false);
        });
    }
  }, [searchTerm]);

  const extractGenres = (movies) => {
    const genreSet = new Set();
    movies.forEach((movie) => {
      if (movie.Genre) {
        movie.Genre.split(', ').forEach((genre) => genreSet.add(genre));
      }
    });
    setGenres([...genreSet]);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSort = (order) => {
    setSortOrder(order);
    const sorted = [...filteredMovies].sort((a, b) => {
      return order === 'asc' ? Number(a.Year) - Number(b.Year) : Number(b.Year) - Number(a.Year);
    });
    setFilteredMovies(sorted);
  };

  const handleFilter = (genre) => {
    setSelectedGenre(genre);
    if (genre === '') {
      setFilteredMovies(movies);
    } else {
      setFilteredMovies(movies.filter((movie) => movie.Genre?.includes(genre)));
    }
  };

  const fetchMovieDetails = (id) => {
    axios
      .get(`${BASE_URL}?apikey=${API_KEY}&i=${id}`)
      .then((response) => setSelectedMovie(response.data))
      .catch((error) => console.error('Error fetching movie details:', error));
  };

  return (
    <div className="container">
      {!selectedMovie ? (
        <div>
          <h1 className="title">OMDB Movie Search</h1>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search for a movie..."
            className="search-box"
          />
          <p className="search-term">Searching for: {searchTerm}</p>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              <div className="controls">
                <select value={selectedGenre} onChange={(e) => handleFilter(e.target.value)} className="dropdown">
                  <option value="">All Genres</option>
                  {genres.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>

                <div className="sort-buttons">
                  <button onClick={() => handleSort('asc')} className="button">Sort by Year (Asc)</button>
                  <button onClick={() => handleSort('desc')} className="button">Sort by Year (Desc)</button>
                </div>
              </div>

              <div className="movie-grid">
                {filteredMovies.map((movie) => (
                  <div key={movie.imdbID} className="movie-card" onClick={() => fetchMovieDetails(movie.imdbID)}>
                    <img src={movie.Poster} alt={movie.Title} className="movie-poster" />
                    <h2 className="movie-title">{movie.Title}</h2>
                    <p className="movie-year">{movie.Year}</p>
                    <p className="movie-genre">{movie.Genre}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="movie-details">
          <button onClick={() => setSelectedMovie(null)} className="button">Back to Results</button>
          <img src={selectedMovie.Poster} alt={selectedMovie.Title} className="movie-poster-large" />
          <h1 className="movie-title-large">{selectedMovie.Title}</h1>
          <p><strong>Year:</strong> {selectedMovie.Year}</p>
          <p><strong>Genre:</strong> {selectedMovie.Genre}</p>
          <p><strong>Director:</strong> {selectedMovie.Director}</p>
          <p><strong>Plot:</strong> {selectedMovie.Plot}</p>
        </div>
      )}
    </div>
  );
};

export default App;
