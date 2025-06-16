import mongoose, { mongo } from "mongoose";
import { refreshAccessToken } from "../controllers/user.controller";

const commentsSchema= mongoose.Schema({

    content:{
        type: String,
        required:true
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Videos"
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
},
{
    timestamps:true
}
)

export const Comments = mongoose.model("Comments",commentsSchema);