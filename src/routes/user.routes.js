import { Router } from "express"
import {loginUser, logoutUser, registerUser,refreshAccessToken} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

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



export default userRouter;



