import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt, { decode } from "jsonwebtoken"
import {User} from "../models/user.models.js"
import userRouter from "../routes/user.routes.js";

//yaha pe humne next ka use kiya jaha ,
//jaha bhi kam lage meiddleware ko leke jaoo next me kaam lage next me leke jao 

export const verifyJWT = asyncHandler( async(req,_,next) => {
    try {
       // user agar mobile app user kar raha hoga to header bhejega jisme key Authorization: Bearer <token> hota hai
       // islye "Bearer " ko replace kar diya "" se.
     const token= req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        
     console.log(token);
     if(!token){
         throw new ApiError(401,"Unauthorized request.")
     }
 
     const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
 
     //jwt.sign me tumne id,email username sab passkiya hai 
     // waha se decodedToken me aa gaya  ab id access karlo
     const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
 
     if (!user){
         // discuss about frontend
         throw new ApiError(401, "Invalid Acces Token")
     }
 
     req.user = user;
     next();
   } catch (error) {
        throw new ApiError(401,error?.message ||"Invalid access Token " )
   }

}); 