import mongoose, { mongo } from "mongoose";
import { Tweets } from "./tweets.models";

const likesSchema= mongoose.Schema({
    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comments"
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Videos"
    },
    likedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    tweet:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "Tweets"
    }
    
},{timestamps: true})


export const Likes = mongoose.model("Likes",likesSchema);