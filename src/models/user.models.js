import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import dotenv from "dotenv"

dotenv.config({
    path:"./.env"
});



const userSchema = new mongoose.Schema({
    
    userName: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true,
        index: true   // searching feild enable karne ke liye 
    },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar : {
        type: String,  //cloudnary url freely available
        required: true,
    },
    coverImage: {
        type: String,
    },
    watchHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Videos"
    }],

    password: {
        type: String,
        required: true,
    },
    refreshToken: {
        type: String,
    }


},
{
    timestamps: true
}
)

userSchema.pre("save",async function(next) {
    if(!this.isModified("password")) return next()
        
    this.password = await bcrypt.hash(this.password,10)
    next() 
})

userSchema.methods.isPasswordCorrect =async function(password){
   return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken = function(){
        return jwt.sign(
            {
            _id: this._id,
            email:this.email,
            userName:this.userName,
            fullname:this.fullName
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: process.env.ACCESS_TOKEN_EXPIRY
            }
    )
}

userSchema.methods.generateRefreshToken=function(){
    return jwt.sign(
            {
            _id: this._id,
            email:this.email,
            userName:this.userName,
            fullname:this.fullName
            },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRY
            }
    )
}


// JWT is a bearer token (its like a key jo chabhi bhejga usko data bhej dega)
export const User = mongoose.model("User",userSchema)
