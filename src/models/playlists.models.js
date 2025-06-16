import mongoose from "mongoose";

const platlistsSchema = mongoose.Schema({

    name:{
        type: String,
        required: true
    },
    description:{
        type: String
    },
    videos:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Videos"
    }]
    ,
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }

},{timestamps:true})

export const Playlists = mongoose.model("Playlists",platlistsSchema);