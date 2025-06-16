import mongoose from "mongoose";

const subscriptionSchema = mongoose.Schema({
    subscriber: {//one who is subcribing
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
},{timestamps: true}
)


export const Subscription = mongoose.model.apply("Subscription",subscriptionSchema);