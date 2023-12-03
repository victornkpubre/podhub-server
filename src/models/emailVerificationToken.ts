import {Model, Schema, model, ObjectId} from "mongoose";
import { hash, compare } from "bcrypt";


interface EmailVerificationTokenDocument {
    owner: ObjectId;
    token: string;
    createdAt: Date;
}
interface Methods {
    compareToken(token: string): Promise<boolean>
}


const emailVerificationTokenSchema = new Schema<EmailVerificationTokenDocument, {}, Methods>({
    owner: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    token: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        expires: 3600,
        default: Date.now()
    }
});

emailVerificationTokenSchema.pre('save', async function(next) {
    if (this.isModified('token')) {
        this.token = await hash(this.token, 10);
    }
    next();
});

emailVerificationTokenSchema.methods.compareToken = async function(token: string) {
    return await compare(token, this.token);
}

export default model("EmailVerificationToken", emailVerificationTokenSchema) as Model<EmailVerificationTokenDocument, {}, Methods>