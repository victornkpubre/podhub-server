import { CreateUserRequest, VerifyEmailRequest } from "#/requests/user";
import { RequestHandler } from "express";
import User from "#/models/user";
import { formatProfile, generateToken } from "#/utils/helper";
import EmailVerificationToken from "#/models/emailVerificationToken";
import { sendForgetPasswordMail, sendPassResetSuccessEmail, sendVerificationMail } from "#/utils/mailer";
import { isValidObjectId } from "mongoose";
import PasswordResetToken from "#/models/passwordResetToken";
import { JWT_SECRET, PASSWORD_RESET_LINK } from "#/utils/variables";
import jwt from "jsonwebtoken";
import { MongoServerError } from "mongodb";
import { RequestWithFiles } from "#/middleware/fileparser";
import formidable from "formidable";
import cloudinary from "#/cloud";
const crypto = require('crypto');

export const create:RequestHandler = async (req: CreateUserRequest, res) => {
    const {name, email, password} = req.body;
    const oldUser = await User.findOne({email})

    if(oldUser) return res.status(403).json({error: "Email is already in use!"})

    try {
        const user = await User.create({name, email, password});

        //Generate otp
        const token = generateToken();
        await EmailVerificationToken.create({
            owner: user._id,
            token
        })

        //Send verification email
        try {
            await sendVerificationMail(token, {name, email, userId: user._id.toString()});
        } catch (error) {
            return res.status(500).json({message: error});    
        }

        return res.status(201).json({user});

    } catch (error) {
        console.log(`Error Caught: ${error}`)
        return res.status(500).json({message: (error as MongoServerError).errmsg})
    }
}

export const verifyEmail: RequestHandler = async (req: VerifyEmailRequest, res) => {
    const {token, userId} = req.body;
    const user = await User.findById(userId);

    if(!user) return res.status(403).json({error: "Invalid request!"});
    if(user.verified) return res.status(403).json({error: "User already verified"});
    
    const verificationToken = await EmailVerificationToken.findOne({
        owner: userId
    });

    if(!verificationToken) return res.status(403).json({error: "invalid token! Doesn't Exist"});

    const matched = await verificationToken.compareToken(token);
    if(!matched) return res.status(403).json({error: "Invalid token! No Match"});

    user.verified = true;
    await user?.save();
    await EmailVerificationToken.findByIdAndDelete(verificationToken._id);

    res.json({message: "Your email is verified."});
}

export const sendReVerification: RequestHandler = async (req, res) => {
    const  {userId} = req.body;
    console.log(req.body)
    if (!isValidObjectId(userId)) return res.status(403).json({error: "Invalid request!"})

    const user = await User.findById(userId)
    if(!user) return res.sendStatus(403).json({error: "Invalid request!"})

    if(user.verified) return res.status(403).json({error: "User already verified"});

    await EmailVerificationToken.findOneAndDelete({
        owner: userId
    })

    const token = generateToken();
    await EmailVerificationToken.create({
        owner: user._id,
        token
    })
    await sendVerificationMail(token, {name: user.name, email: user.email, userId: user._id.toString()
    })

    res.json({message: "Please check you'r email"})

}

export const generateForgetPasswordLink: RequestHandler = async (req, res) => {
    const {email} = req.body;
    console.log(req.body)
    const user = await User.findOne({email})

    if(!user) return res.status(403).json({error: 'Account not found!'})

    //generate the link
    await PasswordResetToken.findOneAndDelete({
        owner: user._id
    })

    const token = crypto.randomBytes(36).toString("hex")
    await PasswordResetToken.create({
        owner: user._id,
        token,
    })

    const resetLink = `${PASSWORD_RESET_LINK}?token=${token}&userId=${user._id}`
    await sendForgetPasswordMail({email: user.email, link: resetLink})
    
    res.json({message: "Check your email"})
}


export const grantValid: RequestHandler = async (req, res) => {
    res.json({valid: true});
}


export const updatePassword: RequestHandler = async (req, res) => {
    const {password, userId} = req.body;

    const user = await User.findById(userId)
    if(!user) return res.status(422).json({error: 'Unauthorized Access!'})

    const matched = await user.comparePassword(password)
    if(matched) return res.status(422).json({error: 'The new password must be different!'})

    user.password = password
    await user.save()

    await PasswordResetToken.findOneAndDelete({
        owner: user._id
    })
    
    await sendPassResetSuccessEmail(user.name, user.email)
    res.json({message: "Password resets successfully."})
}

export const signIn: RequestHandler = async (req, res) => {
    const {password, email} = req.body;
    const user = await User.findOne({
        email
    })
    if(!user) return res.status(403).json({error: "User not Found"})

    const matched = await user.comparePassword(password)
    if(!matched) return res.status(403).json({error: "Email or Password don't match"})

    const token = jwt.sign({userId: user._id}, JWT_SECRET);
    user.tokens.push(token);

    await user.save();

    console.log(user)

    res.json({
        profile: {
            id: user._id,
            name: user.name,
            email: user.email,
            verified: user.verified,
            avatar: user.avatar?.url,
            followers: user.followers.length,
            followings: user.followings.length
        },
        token
    })

}

export const updateProfile: RequestHandler = async (req: RequestWithFiles, res) => {
    const {name} = req.body;
    const avatar = req.files?.avatar as formidable.File;

    console.log(req.body)

    const user = await User.findById(req.user.id);
    
    if(!user) throw new Error("something went wrong, user not found")

    if(typeof name !== "string" || name.trim().length < 3) return res.status(422).json({error: "Invalid name!"})

    user.name = name

    if(avatar) {

        if(user.avatar?.publicId) {
            await cloudinary.uploader.destroy(user.avatar.publicId);
        }
        
        const {secure_url, public_id} = await cloudinary.uploader.upload(avatar.filepath, {
            width: 300,
            height: 300,
            crop: "thumb",
            gravity: "face"
        })
    
        user.avatar = {url: secure_url, publicId: public_id}
       
    }

    await user.save();
    res.json({profile: formatProfile(user)});
}

export const sendProfile: RequestHandler = (req, res) => {
    res.json({
        profile: req.user
    });
}

export const LogOut: RequestHandler = async (req, res) => {
    const {fromAll} = req.query
    const token = req.token
    const user = await User.findById(req.user.id)

    if(!user) throw new Error("Something went wrong, user not found!");

    if(fromAll === "yes") user.tokens = []
    else user.tokens = user.tokens.filter((t) => t !== token)

    await user.save()
    res.json({success: true})
}