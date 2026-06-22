import mongoose, { Scheme } from "mongoose";

const subsciptionScheme = new Scheme({
    subscriber: {
        type: Scheme.Types.ObjectId,
        ref: "User"
    },
    channel: {
        type: Scheme.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true })

export const Subsciption = mongoose.model("Subsciption", subsciptionScheme);

