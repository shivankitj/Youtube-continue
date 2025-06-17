import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.models.js"
import { uploadOnCLoudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiRespose.js";
import jwt from "jsonwebtoken"
import { Subscription } from "../models/subscription.models.js";
import mongoose, { mongo } from "mongoose";



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

const changeCurrentPassword = asyncHandler( async (req,res) => {
    const {oldPassword, newPassword,confirmPassword} = req.body

    if(!(newPassword === confirmPassword)){
        throw new ApiError(400,"Confirm pass and newPass are not same.")
    }

    // Agar ye password change kar raha hai to pakka login hai
    // auth.middleware.js chala hoga aur req.user add ho gaya hoga
    
    const user= await User.findById(req.user?._id);
    const isValidPass= await user.isPasswordCorrect(oldPassword);
    if(!isValidPass){
        throw new ApiError(400,"Invalid old Password");
    }
    user.password=newPassword;
    await user.save({validateBeforeSave:false});

    return res.status(200)
    .json(
        new ApiResponse(200,{},"Password change successfully.")
    )
})

const getCurrentUser = asyncHandler(async (req,res) =>{
     //  id or _id confused

    return res.status(200)
    .json(
        new ApiResponse(200,req.user,"Current user fetched sucessfully.")
    );
});

// koi files update karana rahe ho to laga endpoint/contollers rakhna
const updateAccountDetails = asyncHandler( async (req,res) => {
    const {fullName, email} = req.body

    if(!fullName || !email){
        throw new ApiError(400,"both feilds required.")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,{
            $set: {
                fullName:fullName,
                email: email
            }
            // $set: {
            //     fullName,
            //     email
            // }
        },
        {new: true}
    ).select("-password");

    return res.status(200)
    .json(
        new ApiResponse(200,user,"Account Details Updated successfully.")
    )
});

const updateUserAvatar = asyncHandler(async (req,res)=> {
     const avatarLocalPath= req.file?.path
     if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing.");
     }

     const avatar = await uploadOnCLoudinary(avatarLocalPath)

     if(!avatar.url){
        throw new ApiError(400,"Error while uploading on cloudinary avatar.");
     }

     const user= await User.findByIdAndUpdate(req.user?._id,
        {
            $set: 
            {
                avatar: avatar.url
            }
        },
        {new:true}
     ).select("-password")

     return res.status(200)
     .json(
        new ApiResponse(200,
            user,
            "Avatar updated successfully.")
     )
});

const updateFiles = asyncHandler(async (req, res) => {
    const avatarFile = req.files?.avatar?.[0];
    const coverImageFile = req.files?.coverImage?.[0];

    if (!avatarFile && !coverImageFile) {
        throw new ApiError(400, "At least one file is required.");
    }

    let avatar, coverImage;

    if (avatarFile?.path) {
        avatar = await uploadOnCLoudinary(avatarFile.path);
    }

    if (coverImageFile?.path) {
        coverImage = await uploadOnCLoudinary(coverImageFile.path);
    }

    if (!avatar?.url && !coverImage?.url) {
        throw new ApiError(400, "Error while uploading files to Cloudinary.");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                ...(avatar?.url && { avatar: avatar.url }),
                ...(coverImage?.url && { coverImage: coverImage.url })
            }
        },
        { new: true }
    ).select("-password");

    return res.status(200).json(
        new ApiResponse(200, user, "Files updated successfully.")
    );
});

const getUserChannelProfile= asyncHandler( async (req,res)=>{
    const {userName} = req.params;

    if(!userName?.trim()){
        throw new ApiError(400,"usrName is missing.")
    }
    const channel = User.aggregate([
        {
            $match: {
                userName: userName?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions" ,
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"

            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        // abhi tak humne sab data ekktha kar liya hai
        {
            $addFields:{
                subscriberCount: {
                    $size:"$subscribers"
                },
                
                channelSubscribedToCount: {
                    $size: "$subscribeTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in :[req.user?.id, "subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                },
                $project: {
                    fullName: 1,
                    username: 1,
                    subscriberCount: 1,
                    channelSubscribedToCount: 1,
                    isSubscribed: 1,
                    avatar: 1,
                    coverImage: 1,
                    email:1,
                    createdAt: 1
                }
            
            }
        }
        //model ka naam change ho jata hai "User" ko "users" database me.
    ])  // arrys return hota hai pipeline ke through

    if (!(channel).length ){
        throw new ApiError(404,"Channel doesnot exist.")
    }
    console.log(channel);

    return res.status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully.")
    )
});

const getWatchHistory = asyncHandler(async(req,res)=>{
    // req.user._id give you string of Id 
    const user =await User.aggregate([
        {
            $match: {
                // _id: req.user._id  WRONG (mongoose yaha pe kaam nahi karta hai)
                _id: new mongoose.Types.ObjectId(req.user._id)
            },
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project: {
                                        fullName: 1,
                                        userName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }

                ]
            }
        }
    ]);

    return res.status(200)
    .json(new ApiResponse(
        200,
        user[0].watchHistory,
        "watch histroy fetched successfully."))
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateFiles,
    getUserChannelProfile,
    getWatchHistory
};
