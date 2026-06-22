import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';
import jwt from "jsonwebtoken";

const generateTokens = async function (userId) {
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    }
    catch (error) {
        throw new ApiError(500, "Something went wrong while generating acccess and refresh token", error.message);
    }
}

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
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0]?.path;
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

    if (!avatar) {
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


const loginUser = asyncHandler(async (req, res) => {
    // get user details (from frontend)
    // chcek db entry for user with email or username
    // if user not found throw error
    // if user found, check for password match
    // if password not match throw error
    // if password match, generate access token and refresh token
    // store refresh token in db
    // return response with access token and refresh token (tokens in cookies)

    const { email, username, password } = req.body;

    if (!(email || username)) {
        throw new ApiError(400, 'Email and username is required');
    }

    const user = await User.findOne({
        $or: [{ email }, { username }],
    })

    if (!user) {
        throw new ApiError(404, "User doesn't exists");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user crendentials");
    }

    const { accessToken, refreshToken } = await generateTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, "User logged in successfully", {
            user: loggedInUser, accessToken, refreshToken,
        }));
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            }
        },
    )

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "User logged out")
        )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken
        || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or user");
        }

        const options = {
            httpOnly: true,
            secure: true,
        }

        const { newAccessToken, newRefreshToken } =
            await generateTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", newAccessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(200,
                { accessToken: newAccessToken, refreshToken: newRefreshToken },
                "Access token refreshed"
            ))
    }
    catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
})


export { registerUser, loginUser, logoutUser, refreshAccessToken };