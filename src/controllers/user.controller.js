import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';

const registerUser = asyncHandler(async (req, res) => {
    // get user details (from frontend)
    // all validation 
    // check if user already exists
    // check image stored through multer locally, - after check for images, check for avatar - then upload to cloudinary
    // create user object - entry in db
    // remove password and refresh token field from response
    // check for user response -> response correctly got or not
    // then return response

    const { fullName, email, username, password } = req.body;

    if ([fullName, email, username, password].some((field) => {
        return !field || field.trim() === '';
    })) {
        throw new ApiError(400, 'All fields are required');
    }

    const exitedUser = await User.findOne({
        $or: [{ email }, { username }],
    });

    if (exitedUser) {
        throw new ApiError(400, 'User already exists with this email or username');
    }

    if (req.files) {
        const { avatar, coverImage } = req.files;
        if (avatar && avatar[0]) {
            const avatar = await uploadOnCloudinary(avatar[0].path);
        }
        else {
            throw new ApiError(400, 'Avatar image is required');
        }

        if (coverImage && coverImage[0]) {
            const coverImage = await uploadOnCloudinary(coverImage[0].path);
        }
    }

    if (!avatar) {
        throw new ApiError(400, 'Avatar image is required');
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage ? coverImage.url : null,
        email,
        password,
        username : username.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if(!createdUser){
        throw new ApiError(500, 'User registration failed');
    }

    return res.status(201).json(new ApiResponse(201, 'User registered successfully', createdUser));
});


export { registerUser };