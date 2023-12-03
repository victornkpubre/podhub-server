import { categories } from "#/utils/auto_categories";
import { Model, ObjectId, Schema, model, models } from "mongoose";

export interface PreferenceDocument {
    _id: ObjectId;
    owner: ObjectId;
    preferences: string[];
}

const preferencesSchema = new Schema<PreferenceDocument>({
    owner: {
        type: String,
        required: true,
        ref: "User"
    },
    preferences: [{
        type: String,
        enum: categories,
        default: 'Others'
    }],
}, {timestamps: true})

const Preferences = models.Preferences || model("Preferences", preferencesSchema)

export default Preferences as Model<PreferenceDocument>

