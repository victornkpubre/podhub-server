import { ObjectId } from "mongodb";
import { Model, Schema, model, models } from "mongoose";

interface FavoriteDocument {
    owner: ObjectId
    items: ObjectId[]
}

const favoriteSchema = new Schema<FavoriteDocument>({
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    items: [{type: Schema.Types.ObjectId, ref: "Audio"}]
})

const Favorite = models.Favorite || model("Favorite", favoriteSchema)

export default Favorite as Model<FavoriteDocument>