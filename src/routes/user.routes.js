import { Router } from "express"
import {    
    loginUser,
    logoutUser,
    registerUser,
    refreshAccessToken,
    updateFiles, 
    changeCurrentPassword,
    getCurrentUser, 
    updateUserAvatar, 
    updateAccountDetails, 
    getUserChannelProfile, 
    getWatchHistory
    } from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { verify } from "jsonwebtoken";
import { get } from "mongoose";

const userRouter= Router();

userRouter.get("/ping", (req, res) => {
    res.send("User route is connected!");
});

//yaha pe upload middleware se aaya hai
userRouter.post("/register",
    upload.fields(
    [
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1  
        }
    ]
) ,registerUser);


userRouter.route("/login").post(loginUser)
userRouter.route("/logout").post(verifyJWT,logoutUser)  
// verifyJWT ke baad logout user run hua?
// kyoki humne middle ware me next likh rakha hai

userRouter.route("/refresh-token").post(refreshAccessToken);
userRouter.route("/updateFiles").patch(verifyJWT,
    upload.fields(
    [
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1  
        }
    ]
) ,updateFiles);

userRouter.route("/change-assword").post(verifyJWT ,changeCurrentPassword);
userRouter.route("/cureent-user").post(verifyJWT,getCurrentUser);
userRouter.route("/update-account").patch(verifyJWT,updateAccountDetails)
userRouter.route("/update-avatar")
.patch(
    verifyJWT,
    upload.single("avatar"),
    updateUserAvatar
    );
    
userRouter.route("/c/:username").get(verify,getUserChannelProfile)
// username params se le rahe hai 
userRouter.route("/history").get(verifyJWT,getWatchHistory);

export default userRouter;



