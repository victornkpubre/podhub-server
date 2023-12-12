import Audio, { AudioDocument } from "#/models/audio";
import Favorite from "#/models/favorite";
import { PaginationQuery, PopulatedFavList } from "#/utils/types";
import { RequestHandler } from "express";
import { ObjectId, isValidObjectId } from "mongoose";


export const toggleFavorite: RequestHandler = async (req, res) => {
    const audioId = req.query.audioId as string
    let status = "added" || "removed";

    if( !isValidObjectId(audioId)) 
        return res.status(422).json({error: "Audio is is invalid"})

    const audio = await Audio.findById(audioId);
    if(!audio) 
        return res.status(404).json({error: 'Resource not found'})

    const alreadyExists = await Favorite.findOne({
        owner: req.user.id,
        items: audioId
    })

    if(alreadyExists) {
        //remove fav from fav list
        await Favorite.updateOne(
            {owner: req.user.id},
            {$pull: {items: audioId}}
        )
        status = "removed"
    }
    else {
        const favorite = await Favorite.findOne({owner: req.user.id})

        if(favorite) {
            //trying to add new audio to the old list
            await Favorite.updateOne(
                {owner: req.user.id},
                {$addToSet: {items: audioId}}
            )
        }
        else {
            //trying to create new favorite list
            await Favorite.create({ owner: req.user.id, items: [audioId] })
        }

        status = "added"
    }

    if(status === "added"){
        await Audio.findByIdAndUpdate(
            audioId,
            {$addToSet: {likes: req.user.id}}
        )
    }

    if(status === "removed"){
        await Audio.findByIdAndUpdate(
            audioId,
            {$pull: {likes: req.user.id}}
        )
    }

    res.json({status})
}

export const getFavorite: RequestHandler = async (req, res) => {
    const userID = req.user.id
    const {limit="20", pageNo = "0"} = req.query as PaginationQuery

    const favorites = await Favorite.aggregate([
        {$match: {owner: userID}},
        {$project: {
            audioIds: {
                $slice: [
                    "$items",
                    parseInt(limit) * parseInt(pageNo),
                    parseInt(limit)
                ]
            }
        }},
        {$lookup: {
            from: "audios",
            localField: "audioIds",
            foreignField: "_id",
            as: "audioInfo"
        }},
        {$unwind: "$audioInfo"},
        {$lookup: {
            from: "users",
            localField: "audioInfo.owner",
            foreignField: "_id",
            as: "ownerInfo"
        }},
        {$unwind: "$ownerInfo"},
        {$project: {
            _id: 0,
            id: "$audioInfo._id",
            title: "$audioInfo.title",
            about: "$audioInfo.about",
            file: "$audioInfo.file.url",
            poster: "$audioInfo.poster",
            owner: {name: "$ownerInfo.name", id: "$ownerInfo._id"}
        }}
    ])

    res.json({favorites})
}

export const getIsFavorite: RequestHandler = async (req, res) => {
    const audioId = req.query.audioId as string

    if(!isValidObjectId(audioId)) 
        return res.status(422).json({error: "Invalid audio id!"})
    
    const favorite = await Favorite.findOne({
        owner: req.user.id,
        items: audioId
    })

    return res.json({result: favorite? true: false})


}