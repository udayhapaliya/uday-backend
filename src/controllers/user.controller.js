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
        throw new ApiError(409, 'User already exists with this email or username');
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, 'Avatar image is required');
    }

    let coverImageLocalPath = null;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0]?.path;
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

    if(!avatar) {
        throw new ApiError(500, 'Avatar image upload failed');
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(500, 'User registration failed');
    }

    return res.status(201).json(new ApiResponse(201, 'User registered successfully', createdUser));
});


export { registerUser };