import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import dotenv from "dotenv"
import path from "path";

dotenv.config({
    path: "./.env"
});


 // Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

const uploadOnCLoudinary = async (localFilePath) => {
    try{
        if(!localFilePath) return null;
       const respose = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        //  console.log(response);
        // file has been uploaded.
        // console.log("file is uploaded on cloudinary.\n",respose.url);
        fs.unlinkSync(localFilePath)
        return respose;
    }catch(err){
        fs.unlinkSync(localFilePath);  // remove the locally saved temporary file as the uploaad operation got failed.
        console.log("This is error from cloudinary ",err);
        return null;
    }
}


export { uploadOnCLoudinary };