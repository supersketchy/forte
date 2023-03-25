import path from "path";
import express from "express";
import session from "express-session";
import memorystore from "memorystore";
import multer from "multer";
import cors from "cors";
import crypto from "crypto";
import db from "./db.js";
import { fileURLToPath } from 'url';

// Session store
const MemoryStore = memorystore(session);

// Path
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const upload = multer({ dest: path.join(__dirname, "../uploads") })

// Express
const app = express()
let about = path.join(__dirname, "../about")

// Set about directory path
if (!process.env.custom_about) {
    about = "/about"
}

// Middleware
app.use(cors({ credentials: true, origin: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(session({
    secret: crypto.randomBytes(64).toString('hex'),
    resave: false,
    saveUninitialized: true,
    store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
        maxAge: 86400000,
    }
}))
app.use(express.static(path.join(__dirname, "../dist")))
app.use(express.static(path.join(__dirname, "../uploads")))
app.use("/about", express.static(about))

// Authentication functions
function isAdmin(req, res, next) {
    if (req.session.user && req.session.user == 'forte') next()
    else next('route')
}

function isAuthenticated(req, res, next) {
    // Federated check
    if (req.headers.hasOwnProperty('federated')) {
        db.is_federated(req.query).then((ok) => {
            if (ok) next()
            else res.status(401).json({ "status": "error", "message": "Federation failed." })
        })
        return
    }

    // Normal check
    db.is_authenticated(req.query).then((ok) => {
        if (ok) next()
        else res.status(401).json({ "status": "error", "message": "Session expired." })
    })
}

// Server alive check
app.get("/alive", (req, res) => {
    res.status(200).json({ "status": "alive", "version": process.env.version })
})

// Dashboard
app.get("/auth", (req, res) => {
    let status = (req.session.user && req.session.user == 'forte');
    res.status(200).json({
        "status": status,
    })
})

app.post("/login", db.admin_login)
app.get("/session", db.admin_session)
app.get("/log_off", (req, res, next) => {
    delete req.session.user
    res.json({
        "success": "logged off."
    })
})

app.get("/config", isAdmin, db.get_config)
app.put("/config", isAdmin, db.update_config)
app.get("/status", isAdmin, db.get_status)
app.get("/pgp_keys", isAdmin, db.get_pgp_keys)

app.get("/get_users", isAdmin, db.get_users)
app.post("/add_user", isAdmin, db.add_user)
app.post("/remove_user", isAdmin, db.remove_user)

app.get("/search/artist/:query", isAdmin, db.search_artist)
app.get("/search/album/:query", isAdmin, db.search_album)
app.get("/search/track/:query", isAdmin, db.search_track)

app.put("/artist/:id", isAdmin, db.update_artist)
app.put("/album/:id", isAdmin, db.update_album)
app.put("/track/:id", isAdmin, db.update_track)

// API
app.get("/api/test", isAuthenticated, (req, res, next) => {
    res.status(200).json({ "success": "session up to date." })
})

app.get("/api/session", db.session)
app.get("/api/session/check", isAuthenticated, (req, res, next) => {
    res.status(200).json({ "status": "success" })
})

app.post("/api/cover", isAuthenticated, upload.single('cover'), db.upload_cover)

app.get("/api/search/:query", isAuthenticated, db.search)
app.get("/api/stream/:id", isAuthenticated, db.stream)
app.head("/api/stream/:id", isAuthenticated, db.stream_head)

app.get("/api/artists/:offset", isAuthenticated, db.get_artists)
app.get("/api/albums/:offset", isAuthenticated, db.get_albums)

app.get("/api/profile", isAuthenticated, db.get_profile)
app.get("/api/profile/history", isAuthenticated, db.get_history)
app.post("/api/profile/history/add", isAuthenticated, db.add_history)
app.get("/api/profile/tracks/:offset", isAuthenticated, db.get_profile_tracks)
app.get("/api/profile/albums/:offset", isAuthenticated, db.get_profile_albums)
app.get("/api/profile/artists/:offset", isAuthenticated, db.get_profile_artists)
app.get("/api/profile/playlists", isAuthenticated, db.get_profile_playlists)
app.post("/api/profile/create_playlist", isAuthenticated, upload.single('cover'), db.create_playlist)

app.get("/api/user/:id", isAuthenticated, db.get_user)
app.get("/api/user/:id/history", isAuthenticated, db.get_user_history)
app.get("/api/user/:id/tracks/:offset", isAuthenticated, db.get_user_tracks)
app.get("/api/user/:id/playlists", isAuthenticated, db.get_user_playlists)
app.get("/api/user/:id/albums/:offset", isAuthenticated, db.get_user_albums)
app.get("/api/user/:id/artists/:offset", isAuthenticated, db.get_user_artists)
app.get("/api/user/:id/friends", isAuthenticated, db.get_user_friends)

app.get("/api/track/:id", isAuthenticated, db.get_track)
app.get("/api/track/:id/basic", isAuthenticated, db.get_track_basic)
app.get("/api/track/:id/love", isAuthenticated, db.love_track)
app.get("/api/track/:id/unlove", isAuthenticated, db.unlove_track)
app.get("/api/track/:id/loved", isAuthenticated, db.get_track_loved)

app.get("/api/artist/:id", isAuthenticated, db.get_artist)
app.get("/api/artist/:id/love", isAuthenticated, db.love_artist)
app.get("/api/artist/:id/unlove", isAuthenticated, db.unlove_artist)
app.get("/api/artist/:id/loved", isAuthenticated, db.get_artist_loved)

app.get("/api/album/:id", isAuthenticated, db.get_album)
app.get("/api/album/:id/tracks", isAuthenticated, db.get_album_tracks)
app.get("/api/album/:id/love", isAuthenticated, db.love_album)
app.get("/api/album/:id/unlove", isAuthenticated, db.unlove_album)
app.get("/api/album/:id/loved", isAuthenticated, db.get_album_loved)

app.get("/api/all/albums", isAuthenticated, db.get_all_albums)
app.get("/api/random/track", isAuthenticated, db.get_random_track)
app.get("/api/random/tracks", isAuthenticated, db.get_random_tracks)

app.get("/api/friends", isAuthenticated, db.get_friends)
app.get("/api/friends/:id", isAuthenticated, db.check_friends)
app.post("/api/friends/add", isAuthenticated, db.add_friend)
app.post("/api/friends/remove", isAuthenticated, db.remove_friend)

app.get("/api/playlist/:id", isAuthenticated, db.get_playlist)
app.get("/api/playlist/:id/delete", isAuthenticated, db.delete_playlist)
app.get("/api/playlist/:id/tracks", isAuthenticated, db.get_playlist_tracks)
app.post("/api/playlist/:id/add_track", isAuthenticated, db.add_track_to_playlist)
app.post("/api/playlist/:id/delete_track", isAuthenticated, db.delete_track_to_playlist)
app.get("/api/playlist/:id/loved", isAuthenticated, db.get_playlist_loved)

app.post("/api/lyrics", isAuthenticated, db.get_lyrics)

app.get("/api/lastfm/auth", isAuthenticated, db.get_lastfm_auth)
app.post("/api/lastfm/auth", isAuthenticated, db.lastfm_auth)
app.post("/api/lastfm/artist", isAuthenticated, db.get_lastfm_artist)
app.post("/api/lastfm/scrobble", isAuthenticated, db.lastfm_scrobble)
app.get("/api/lastfm/profile/:username", isAuthenticated, db.get_lastfm_profile)

// Federated API
app.post("/f/api", isAuthenticated, db.federated_api)
app.get("/f/challenge/:domain", db.get_federation_challenge)

// Error Handling
app.use((req, res, next) => {
    res.redirect("/")
})

export default app