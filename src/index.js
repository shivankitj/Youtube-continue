// const dotnev =require('dotenv').config({path: './env'})
import dotenv from 'dotenv'

// jitni jaldi application load ho utni jaldi environment variable har jagah availabale hona chahiye
// isliye jo first file load ho rahi hai kosis karo ki usme hi env file load ho jaye...
// import mongoose from "mongoose";
// import { DB_NAME } from "./constants.js";
import connectDB from './db/index.js'
import {app} from './app.js'

dotenv.config({
    path: './.env'
})

connectDB().then(()=> {
    app.listen(process.env.PORT ||8000 , () => {
        console.log(`A server is runnning at port : ${process.env.PORT}`);
    })
}).catch((err)=>{
    console.log("Mongo db connectionr failed !!! ", err);

})

/*
import express from "express";
const app = express()

;(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        app.on("error",(error)=>{
            console.log("ERROR : ",error);
            throw error;
        })

        app.listen(process.env.PORT,()=>{
            console.log(`app is listening. on  port ${process.env.PORT}`);
        })
    } catch (error) {
        console.error("ERROR : ", error);
        throw error;
    }
})();
*/