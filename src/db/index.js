import mongoose from "mongoose";
import dotenv from "dotenv"

dotenv.config({
    path:"./.env"
});

import {DB_NAME} from "../constants.js";

// async : time kyda lagega to ruke rehne ke liye 
// DATABASE to dusre continent me hai
const connectDB = async() => {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`\n MongoDBconnected !! DB HOST : ${connectionInstance.connection.host}`)
    }catch(error){
        console.log("MONGODB connection error.");
        process.exit(1)
    }
}

export default connectDB;
