import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const videosSchema =new mongoose.Schema({
    id: {
        type: String,
        require: true,
        unique:true
    },
    videoFile: {
        type: String
    },
    thumbnail: {
        type: String,
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }, 
    title: {
        type: String,
        required:true,

    },
    description : {
        type:String,
        required:true
    },
    duration: {
        type: Number, //
        required: true
    },
    views :{
        type: Number,
        default:0
    },

    isPublished: {
        type: Boolean,
        default : true
    }

    // USING mongoose-aggregate-paginate-v2
    // npm i mongoose-aggregate-paginate-v2
    
    //bcrypt  : Hash our password 
    // jsonwebtoken(JWT): used for token creation
    // npm i jsonwebtoken bcrypt
},{timestamps: true})

videoSchema.plugin()
export const Videos = mongoose.model("Videos",videosSchema)