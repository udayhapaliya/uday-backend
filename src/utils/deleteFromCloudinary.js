import { v2 as cloudinary } from "cloudinary";
import { ApiError } from "./apiError.js";

const deleteFile = async (FileCloudinaryUrl) => {
    const { publicId, resourceType } = parseCloudinaryUrl(FileCloudinaryUrl);

    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type:resourceType,
            invalidate:true
        });

        return result;
    }
    catch (error) {
        throw new ApiError(400, "Error occured while deletion of given file",error);
    }
}


const parseCloudinaryUrl = (url) => {
    const regex = /\/video\/upload\/v\d+\/(.+)$|\/raw\/upload\/v\d+\/(.+)$|\/image\/upload\/v\d+\/(.+)$|\/upload\/v\d+\/(.+)$/;
    const match = url.match(regex);

    if (!match) {
        throw new ApiError(400, "Invalid Cloudinary URL structure");
    }

    let resourceType = 'image';
    if (url.includes('/video/upload/')) resourceType = 'video';
    if (url.includes('/raw/upload/')) resourceType = 'raw';

    const fullPathWithExtension = match.filter(Boolean)[1];

    const publicId = fullPathWithExtension.replace(/\.[^/.]+$/, "");

    return { publicId, resourceType };
};

export {deleteFile};