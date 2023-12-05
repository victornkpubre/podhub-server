import express from "express";
import "dotenv/config";
import "./db";
import authRouter from "#/routers/auth"
import audioRouter from "#/routers/audio"
import favoriteRouter from "#/routers/favorite"
import playlistRouter from '#/routers/playlist'
import profileRouter from '#/routers/profile'
import historyRouter from '#/routers/history'
import { errorHandler } from "./middleware/errors";

const path = require('path')
const app = express();
const PORT = 8989;



app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static('src/public'));


app.use("/auth", authRouter);
app.use("/audio", audioRouter);
app.use("/favorite", favoriteRouter);
app.use("/playlist", playlistRouter);
app.use("/profile", profileRouter);
app.use("/history", historyRouter);

app.use(errorHandler)

app.get('/', (req, res ) => {
    res.status(404).sendFile("./public/")
})

app.get('*', (req, res ) => {
    res.status(404).json({
        error: "Not Found!"
    })
})

app.listen(PORT, () => {
    console.log("Port is listening on port " + PORT)
});
