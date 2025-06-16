import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.models.js"
import { uploadOnCLoudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiRespose.js";
import jwt from "jsonwebtoken"



const generateAccessAndRefreshToken = async(userId) => {
    try{
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        
        user.refreshToken= refreshToken;
        await user.save({validateBeforeSave: false})

        return {
            accessToken,
            refreshToken
        }
    }catch (error) {
        throw new ApiError(500,"Somehthing went wrong while genrating Refresh and Access Tokens . ")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    //get user Details
    //validation- Notempty
    //check if user already exist (usename,Email)
    //check for image , check avatar
    // upload on cloudinary
    // create user object - create entry in DB
    // check for user creation
    // return res
   
    console.log("Register endpoint hit");
    console.log("Request Body:", req.body);
    console.log("Files:", req.files);

    const {fullName, email, userName, password } = req.body 
    console.log("email: ",email);

    if ( [fullName,email,userName,password].some((feild)=> feild?.trim() === "")){
        throw new ApiError(400,"Some feids are missing.");
    }
    // if ( fullName === ""){
    //     throw new ApiError(400,"FullName is required.");
    // }

    const existedUser =await User.findOne({
        $or: [{ email },{ userName }]
    })
    
    if(existedUser){
        throw new ApiError(409,"User with email or username exist.")
    }

    const avatarLocalPath= req.files?.avatar[0].path;
    //rq.files aaya kaha se : humne ek middleware banaya hai jaha se files wala 
    // function bana(add) liya req me
    // const coverimageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar to chiye hi, location nahi mila.")
    }

    const avatar = await uploadOnCLoudinary(avatarLocalPath);
    
    const coverImage = await uploadOnCLoudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400,"Avatar to chiye hi,cloudinary pe upload nahi hua.")
    }

    const user = await User.create(
        {
            fullName,
            avatar: avatar?.url,
            coverImage: coverImage?.url||"",
            email,
            password,
            userName: userName?.toLowerCase() || ""

        }
    )

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong. while registering a user. ")
    }
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully.")

        )
});
 
const loginUser = asyncHandler(async (req,res) => {

    //req body se data read karo
    // username or email
    // usr check karo hai ki nahi
    // password check karo
    // refresh aur access token set karo
    // send cookie


    const {email, userName, password} = req.body;
 
    // console.log(req.body)

    if(!userName && !email){
        throw new ApiError(400,"username or password is wrong")
    }

    console.log("Email and username",email, userName);
    // let user;
    // if(userName){
    //     user= await User.findOne({userName});
    // }
    // else if(email){
    //     user= await User.findOne({email});   
    // }

    
    const user= await User.findOne({
        $or: [{email},{userName}]
    })
    
  
    if(!user){
        throw new ApiError(400,"Invalid User ")
    }

    console.log("User from DB:", user);
    const isPassValid= await user.isPasswordCorrect(password)
    if(!isPassValid){
        throw new ApiError(400,"Invalid user credentials.")
    }

    // User : ye wala User mongoose se hai
    // user : ye wala user Database se hai
    
    

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200, 
            {
            user: loggedInUser, accessToken,
            refreshToken
            },
            "User logged In Successfully"
        )
    )

    
});

const logoutUser= asyncHandler(async (req,res) => {
    //cookies ko hata do aur refresh token rest kar do 
    // middleware ka concept user karna padega ?
    // user kaha se laoge kyki logout ke liye form bana ke user id to nahi magoge aise to kisi ko bhi logout kar doge 
    // middleware: Jane se pehle milke jana 

    // humne ek vefifyJWT wale middleware se req.user add kar diya 
    // verifyJWT kaise kaam kiya:
    // (humne acces key generate karte samy jwt.sign me apna data save kar liya tha ,
    //  wahi se id mil gayi fir user ko deke user detail le liya)
    // : humne  jo access token diya tha login karte samy cookies ko usse verify karke user pata kar liya .

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options={
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"user logout successfully."))
});

const refreshAccessToken =  asyncHandler(async (req,res) => {
        const incomingRefreshToken=req.cookies?.refreshToken || req.body?.refreshToken ;
       
        if(!incomingRefreshToken){
             throw new ApiError(400,"Unauthorized request");
        }

         const decodedToken= await jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
         const user =await User.findById(decodedToken?._id)
         if(!user){
             throw new ApiError(400,"Invalid refreshToken.")
        }
            
            console.log("Decoded Token Details : ",decodedToken);
            console.log("User refresh Token : ",user.refreshToken);
            console.log("incoming refresh Token :",incomingRefreshToken);

         if(incomingRefreshToken !== user.refreshToken){
             throw new ApiError(400,"RefreshToken token is Expired or Used.")
 
         }
         
         const options = {
             httpOnly: true,
             secure: true
         }
 
         const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id);
 
         return res.status(200)
             .cookie("accessToken",accessToken,options)
             .cookie("refreshToken",newRefreshToken,options)
             .json(
                 new ApiResponse
                 (200,
                     {
                        accessToken,newRefreshToken
                     },
                 "Access token refreshed successfully."
                 )
             )
        

});



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
};
