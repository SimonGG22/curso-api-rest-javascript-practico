//Data

const api = axios.create({
    baseURL: 'https://api.themoviedb.org/3/',
    headers:{
        'Content-Type':'application/json;charset=utf-8'
    },
    params: {
        'api_key': API_KEY,
        'language': localStorage.getItem("lang")
            ? localStorage.getItem("lang")
            : navigator.language[0] + navigator.language[1], 
    },
})

function likedMovieList(){
    const item =JSON.parse(localStorage.getItem('liked_movies'))
    let movies

    if (item){
        movies = item
    } else {
        movies = {}
    }    
    return movies
}

function likeMovie(movie){
    const likedMovies = likedMovieList ();

    if (likedMovies[movie.id]){
        likedMovies[movie.id] = undefined;
    } else {
        likedMovies[movie.id] = movie;        
    }

    localStorage.setItem('liked_movies',JSON.stringify(likedMovies))
}

//Utils

const lazyLoader = new IntersectionObserver ((entries)=>{
    entries.forEach((entry)=>{
        if (entry.isIntersecting){
            const url = entry.target.getAttribute('data-img')
            entry.target.setAttribute('src', url)
        }
    })
});

function createMovies (movies, container, {lazyLoad = false, clean = true}={}) {
    
    if(clean){
        container.innerHTML = '';
    }
    
    movies.forEach(movie => {
        const movieContainer = document.createElement('div');
        movieContainer.classList.add('movie-container');

        const movieImg = document.createElement('img')
        movieImg.classList.add('movie-img');
        movieImg.setAttribute('alt', movie.title);
        movieImg.setAttribute(
            lazyLoad ? 'data-img':'src',
            'https://image.tmdb.org/t/p/w300' + movie.poster_path
        )  
        movieImg.addEventListener('click', () =>{
            location.hash = '#movie=' + movie.id;
        })      
        movieImg.addEventListener('error', ()=>{
            movieImg.setAttribute(
                'src', 
                'https://static.platzi.com/static/images/error/img404.png'
            )
        })

        const movieBtn = document.createElement('button')
        movieBtn.classList.add('movie-btn');
        likedMovieList()[movie.id] && movieBtn.classList.add ('movie-btn--liked')
        movieBtn.addEventListener('click',()=>{
            movieBtn.classList.toggle('movie-btn--liked')
            likeMovie(movie)
            getLikedMovies()
        });

        if (lazyLoad) {
            lazyLoader.observe(movieImg)
        }
        movieContainer.appendChild(movieImg);
        movieContainer.appendChild(movieBtn)
        container.appendChild(movieContainer)

    });
}

function createCategories (categories, container){
    container.innerHTML = "";

    categories.forEach(category => {

        const categoryContainer = document.createElement('div');
        categoryContainer.classList.add('category-container');

        const categoryTitle = document.createElement('h3')
        categoryTitle.classList.add('category-title');
        categoryTitle.setAttribute('id', 'id' + category.id);
        categoryTitle.addEventListener('click', () => {
            location.hash = `#category=${category.id}-${category.name}`
        })
        const categoryTitleText = document.createTextNode(category.name);

        categoryTitle.appendChild(categoryTitleText);
        categoryContainer.appendChild(categoryTitle);
        container.appendChild(categoryContainer)
    });

}

//llamados a la API

async function getTrendingMoviesPreview () {
    const {data} = await api ('trending/movie/day');
    const movies = data.results;

    createMovies(movies, trendingMoviesPreviewList, true)
}

async function getCategoriesPreview () {
    const {data} = await api ('genre/movie/list');
    const categories = data.genres;

    createCategories(categories, categoriesPreviewList)
}

async function getMoviesByCategory (id) {
    const {data} = await api ('discover/movie', {
        params: {
            with_genres: id
        },
    });
    const movies = data.results;
    maxPage = data.total_pages;

    createMovies(movies, genericSection,{lazyLoad:true});
}

function getPaginatedMoviesByCategory (id) {
    return async function () {
     const {scrollTop, scrollHeight, clientHeight} = document.documentElement;
     const scrollIsBotton = (scrollTop+clientHeight) >= (scrollHeight -15)
 
     const pageIsNotMax = page < maxPage;
 
     if(scrollIsBotton && pageIsNotMax){
         page++
         const {data} = await api ('discover/movie', {
            params: {
                with_genres: id,
                page,
            },
        });
        const movies = data.results;
        createMovies(movies, genericSection, {lazyLoad:true, clean:false})
     }
    }
 }

async function getMoviesBySearch (query) {
    const {data} = await api ('search/movie', {
        params: {
            query,
        },
    });
    const movies = data.results;
    maxPage = data.total_pages;

    createMovies(movies, genericSection);
}

function getPaginatedMoviesBySearch (query) {
   return async function () {
    const {scrollTop, scrollHeight, clientHeight} = document.documentElement;
    const scrollIsBotton = (scrollTop+clientHeight) >= (scrollHeight -15)

    const pageIsNotMax = page < maxPage;

    if(scrollIsBotton && pageIsNotMax){
        page++
        const {data} = await api ('search/movie', {
            params: {
                query,
                page,
            },
        });
        const movies = data.results;
    
        createMovies(movies, genericSection, {lazyLoad:true, clean:false})
    }
   }
}

async function getTrendingMovies () {
    const {data} = await api ('trending/movie/day');
    const movies = data.results;
    maxPage = data.total_pages;

    createMovies(movies, genericSection, {lazyLoad:true, clean:true})

}

async function getPaginatedTrendingMovies () {
    const {scrollTop, scrollHeight, clientHeight} = document.documentElement;
    const scrollIsBotton = (scrollTop+clientHeight) >= (scrollHeight -15)

    const pageIsNotMax = page < maxPage;

    if(scrollIsBotton && pageIsNotMax){
        page++
        const {data} = await api ('trending/movie/day',{
            params: {
                page,
            }
        });
        const movies = data.results;
    
        createMovies(movies, genericSection, {lazyLoad:true, clean:false})
    }

}

async function getMovieById(id){
    const {data : movie} = await api('movie/' + id);

    const movieImgUrl = 'https://image.tmdb.org/t/p/w500' + movie.poster_path
    headerSection.style.background = `
        linear-gradient(
            180deg, 
            rgba(0, 0, 0, 0.35) 19.27%,
            rgba(0, 0, 0, 0) 29.17%
        ),
        url(${movieImgUrl}
        
    `;

    movieDetailTitle.textContent = movie.title;
    movieDetailDescription.textContent = movie.overview;
    movieDetailScore.textContent = movie.vote_average;

    createCategories(movie.genres,movieDetailCategoriesList)
    getRelatedMoviesId(id)
}

async function getRelatedMoviesId(id) {
    const {data} = await api(`movie/${id}/recommendations`);
    const relatedMovies = data.results;

    createMovies(relatedMovies, relatedMoviesContainer)
}

async function setDefaultLang(){ 
    if (!localStorage.getItem("lang")) {
      if (navigator.language.includes("-")) {
        const navLang = navigator.language.split("-");
        localStorage.setItem("lang", navLang[0]);
        } else {
        localStorage.setItem("lang", navigator.language);
        }
    }

    lang.value = localStorage.getItem("lang");

    const langWords = await getWords();

    trendingTitle.innerText = langWords["Trending"];
    trendingPreviewBtn.innerText = langWords["See More"]
    categoriesTitle.innerHTML = langWords["Categories"]
    likedTitle.innerHTML = langWords["Favorite Movies"]
    recommendationTitle.innerHTML = langWords["Recommendations"]
}   

function getLikedMovies() {
    const likedMovies = likedMovieList();
    const moviesArray = Object.values(likedMovies)
    createMovies(moviesArray, likedMovieListArticle, {lazyLoad:true, clean: true})
    
}

async function getWords() {
    const langWords = localStorage.getItem("lang");
    const languagueTexts = await fetch("../src/lang.json");
    const data = await languagueTexts.json();
    return data[langWords];
}

