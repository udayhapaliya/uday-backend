import express from "express";
import connectDB from './db/db.js';
const app = express();

// import mongoose from 'mongoose';
// import { DB_NAME } from './constants';

// dotenv.config({
//     path:'./env'
// });

connectDB();




/*
; (async () => {
    try {
        mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("error", (error) => {
            console.log("error: ", error);
            throw error;
        })

        app.listen(process.env.PORT, () => {
            console.log(`App listening on port: ${process.env.PORT}`);
        })
    }
    catch (error) {
        console.log("error: ", error);
    }
})()
*/