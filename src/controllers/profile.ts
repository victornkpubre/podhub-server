import { RequestHandler } from "express";
import { ObjectId, PipelineStage, Types, isValidObjectId } from "mongoose";
import User from "#/models/user";
import Audio from "#/models/audio";
import { PaginationQuery } from "#/utils/types";
import { OwnerPopulation } from "#/utils/types";
import Playlist from "#/models/playlist";
import History from "#/models/history";
import moment from "moment";
import { getUserPreviousHistory } from "#/utils/helper";
import AutoGeneratedPlaylist from "#/models/autoGeneratedPlaylist";
import Preferences from "#/models/preferences";

export const UpdateFollowings: RequestHandler = async (req, res) => {
    const {profileId} = req.params
    let status: "added" | "removed"


    if( !isValidObjectId(profileId)) 
        return res.status(422).json({error: "Audio is is invalid"})

    const profile = await User.findById(profileId)
    if(!profile) return res.status(404).json({error: "Profile not found!"})

    const alreadyAFollower = await User.findOne({
        _id: profileId, 
        followers: req.user.id
    })

    if(alreadyAFollower) {
        await User.updateOne(
            {_id: profileId},
            {$pull: {followers: req.user.id}}
        )
        status = "removed"
    }
    else {
        await User.updateOne(
            {_id: profileId},
            {$addToSet: {followers: req.user.id}}
        )
        status = "added"
    }

    if(status === "added") {
        await User.updateOne(
            {_id: req.user.id},
            {$addToSet: {followings: profileId}}
        )
    }

    if(status === "removed") {
        await User.updateOne(
            {_id: req.user.id},
            {$pull: {followings: profileId}}
        )
    }

    res.json({status})
}

export const getUploads: RequestHandler = async (req, res) => {
    const {limit="0", pageNo= "0"} = req.query as PaginationQuery
    console.log(req.user)

    const data = await Audio.find({owner: req.user.id})
        .skip(parseInt(limit) * parseInt(pageNo))
        .limit(parseInt(limit))
        .sort("-createdAt")

    const audios = data.map((item) => {
        return {
            id: item._id,
            title: item.title,
            about: item.about,
            file: item.file.url,
            category: item.category,
            poster: item.poster,
            date: item.poster?.url,
            owner: {name: req.user.name, id: req.user.id}
        }
    })

    res.json({audios})
}

export const getPublicUploads: RequestHandler = async (req, res) => {
    const {limit="0", pageNo= "0"} = req.query as PaginationQuery
    const {profileId} = req.params
    console.log(req.user)

    if( !isValidObjectId(profileId)) 
        return res.status(422).json({error: "Audio is is invalid"})

    const data = await Audio.find({owner: profileId})
        .skip(parseInt(limit) * parseInt(pageNo))
        .limit(parseInt(limit))
        .sort("-createdAt")
        .populate<OwnerPopulation>("owner")

    const audios = data.map((item) => {
        return {
            id: item._id,
            title: item.title,
            about: item.about,
            file: item.file.url,
            poster: item.poster?.url,
            date: item.poster?.url,
            owner: {name: item.owner.name, id: item.owner._id}
        }
    })

    res.json({audios})
}

export const getPublicProfile: RequestHandler = async (req, res) => {
    const {profileId} = req.params

    console.log(profileId)

    if( !isValidObjectId(profileId)) 
        return res.status(422).json({error: "invalid id"})

    const user = await User.findById(profileId)
    if(!user) return res.status(422).json({error: "User not found"})

    res.json({profile: {
        id: user._id,
        name: user.name,
        followers: user.followers.length,
        avatar: user.avatar?.url
    }})
}

export const getPublicPlaylist: RequestHandler = async (req, res) => {
    const {limit="0", pageNo= "0"} = req.query as PaginationQuery
    const {profileId} = req.params

    if( !isValidObjectId(profileId))
        return res.status(422).json({error: "Audio is is invalid"})

    const playlist = await Playlist.find({
        owner: profileId,
        visibility: "public"
    })
        .skip(parseInt(limit) * parseInt(pageNo))
        .limit(parseInt(limit))
        .sort("-createdAt")

    const audios = playlist.map((item) => {
        return {
            id: item._id,
            title: item.title,
            itemCount: item.items.length,
            visibility: item.visibility
        }
    })
    
        res.json({playlist: audios})

}

export const getRecommendByProfile: RequestHandler = async (req, res) => {
    const user = req.user
    console.log(user)
    let matchOptions: PipelineStage.Match = { $match: {_id: { $exists: true}}}
    
    if(user) {
        const usersPreviousHistory = await History.aggregate([
            {$match: {owner: user.id}},
            {$unwind: "$all"},
            {$match: {
                "all.date": {
                    $gte: moment().subtract(30, "days").toDate()
                }
            }},
            {$group: {_id: "$all.audio"}},
            {$lookup: {
                from: "audios",
                localField: "_id",
                foreignField: "_id",
                as: "audioData"
            }},
            {$unwind: "$audioData"},
            {$group: {
                _id: null, 
                category: {
                    $addToSet: "$audioData.category"
                }
            }},
        ])

        if(usersPreviousHistory?.length) {
            const categories = usersPreviousHistory[0].category
            if (categories.length) {
                matchOptions = {$match: {category: {$in: categories}}}
            }
        }

    }

    const audios = await Audio.aggregate([
        matchOptions,
        {$sort: {
            "likes.count": -1
        }},
        {$limit: 10},
        {$lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner"
        }},
        {$unwind: "$owner"},
        {$project: {
            _id: 0,
            id: "$_id",
            title: "$title", 
            category: "$category",
            about: "$about",
            file: "$file",
            poster: "$poster",
            owner: {name: "$owner.name", id: "$owner._id"}
        }}
    ])

    res.json({audios})
}

export const generateAutoPlaylist: RequestHandler = async (req, res) => {
    const user = req.user
    //get audios that match preferences

    if(user) {
        console.log("User verfied")
        //get preferences 
        const pref = await Preferences.findOne({owner: user.id}) 
        let preferences;
        if(pref) {
            preferences = pref.preferences
        }
        else {
            preferences = ["Education"]
        }
        console.log("Preferences: "+preferences)

        //find playlist preference match
        const playlist = await AutoGeneratedPlaylist.findOne({
            title: "Mix - "+preferences.join(", ")
        })
        if(!playlist){
            //generate new playlist
            console.log("Generating Playlist")
            const audios = await Audio.aggregate<{id: ObjectId}>([
                {$match: {
                    category: {$in: preferences}
                }},
                {$project: {
                    _id: 0,
                    id: "$_id" 
                }}
            ])

            const list = audios.map((item) => item.id)
            const newPlaylist = await AutoGeneratedPlaylist.create({
                title: "Mix - "+preferences.join(", "),
                items: list
            })

            return res.json({newPlaylist})
        }
        else {
            console.log("Found Playlist")
            return res.json({playlist})
        }
    }

    res.status(404).json({error: "Unauthorized Access"})
}

export const getAutoGeneratedPlaylist: RequestHandler = async (req, res) => {

    //Create playlist based on user history - 20 samples
    const [result] = await History.aggregate([
        {$match: {owner: req.user.id}},
        {$unwind: "$all"},
        {$group: {_id: "$all.audio", items: {$addToSet: "$all.audio"}}},
        {$sample: {size: 20}},
        {$group: {_id: null, items: {$push: "$_id"}}},
    ])

    //if History base playlist is possible update Made for you
    const title = "Made For You"
    if(result) {
        await Playlist.updateOne(
            {owner: req.user.id, title},
            {$set: {title, items: result.items, visibility: "auto"}},        
            {upsert: true}
        )
    }

    const categories = await getUserPreviousHistory(req)
    let matchOptions: PipelineStage.Match = {
        $match: {_id: { $exists: true}}
    }

    if(categories?.length) {
        matchOptions = { $match: {title: { $in: categories}}}
    }

    const agpl = await AutoGeneratedPlaylist.aggregate([
        matchOptions,
        {$sample: {size: 4}},
        {$project: {
            _id: 0,
            id: "$_id",
            title: "$title",
            itemsCount: {$size: "$items"}
        }}
    ])

    // const list = await Playlist.findOne({
    //     owner: req.user.id, title
    // })

    // const playlist = agpl.concat({
    //     id: list?._id,
    //     title: list?.title,
    //     itemsCount: list?.items.length
    // })

    // console.log(list)
    const playlist = agpl
    res.json({playlist})

}


export const getFollowersProfile: RequestHandler = async (req, res) => {
    const {limit = "20", pageNo = "0"} = req.query as PaginationQuery

    const [result] = await User.aggregate([
        {$match: {_id: req.user.id}},
        {$project: {
            followers: {
                $slice: [
                    "$followers",
                    parseInt(pageNo) * parseInt(limit),
                    parseInt(limit)
                ]
            }
        }},
        {$unwind: "$followers"},
        {$lookup: {
            from: "users",
            localField: "followers",
            foreignField: "_id",
            as: "userInfo"
        }},
        {$unwind: "$userInfo"},
        {$group: {
            _id: null,
            followers: {
                $push: {
                    id: "$userInfo._id",
                    name: "$userInfo.name",
                    avatar: "$userInfo.avatar.url"
                }
            }
        }}
    ])

    if(!result) {
        return res.json({followers: []})
    }

    res.json({followers: result.followers})
}

export const getFollowersProfilePublic: RequestHandler = async (req, res) => {
    const {limit = "20", pageNo = "0"} = req.query as PaginationQuery
    const {profileId} = req.params

    if(!isValidObjectId(profileId)) return res.status(422).json({error: "Invalid profile id!"})

    const [result] = await User.aggregate([
        {$match: {_id: new Types.ObjectId(profileId)}},
        {$project: {
            followers: {
                $slice: [
                    "$followers",
                    parseInt(pageNo) * parseInt(limit),
                    parseInt(limit)
                ]
            }
        }},
        {$unwind: "$followers"},
        {$lookup: {
            from: "users",
            localField: "followers",
            foreignField: "_id",
            as: "userInfo"
        }},
        {$unwind: "$userInfo"},
        {$group: {
            _id: null,
            followers: {
                $push: {
                    id: "$userInfo._id",
                    name: "$userInfo.name",
                    avatar: "$userInfo.avatar.url"
                }
            }
        }}
    ])

    if(!result) {
        return res.json({followers: []})
    }

    res.json({followers: result.followers})
}

export const getFollowingsProfile: RequestHandler = async (req, res) => {
    const {limit = "20", pageNo = "0"} = req.query as PaginationQuery

    const [result] = await User.aggregate([
        {$match: {_id: req.user.id}},
        {$project: {
            followings: {
                $slice: [
                    "$followings",
                    parseInt(pageNo) * parseInt(limit),
                    parseInt(limit)
                ]
            }
        }},
        {$unwind: "$followings"},
        {$lookup: {
            from: "users",
            localField: "followings",
            foreignField: "_id",
            as: "userInfo"
        }},
        {$unwind: "$userInfo"},
        {$group: {
            _id: null,
            followings: {
                $push: {
                    id: "$userInfo._id",
                    name: "$userInfo.name",
                    avatar: "$userInfo.avatar.url"
                }
            }
        }}
    ])

    if(!result) {
        return res.json({followings: []})
    }

    res.json({followings: result.followings})
}


export const getPlaylistAudios: RequestHandler = async (req, res) => {
    const {limit = "20", pageNo = "0"} = req.query as PaginationQuery
    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)) 
        return res.status(422).json({error: "Invalid audio id!"})

    const aggregationLogic = [
        {$match: {_id: new Types.ObjectId(playlistId)}},
        {$project: {
            items: {
                $slice: [
                    "$items",
                    parseInt(pageNo) * parseInt(limit),
                    parseInt(limit)
                ]
            },
            title: "$title"
        }},
        {$unwind: "$items"},
        {$lookup: {
            from: "audios",
            localField: "items",
            foreignField: "_id",
            as: "audios"
        }},
        {$unwind: "$audios"},
        {$lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "userInfo"
        }},
        {$group: {
            _id: {id: "$_id", title: "$title" },
            audios: {
                $push: {
                    id: "$audios._id", 
                    title: "$audios.title", 
                    about: "$audios.about", 
                    category: "$audios.category", 
                    file: "$audios.file.url",
                    poster: "$audios.poster.url", 
                    owner: {name: "$userInfo.name", id: "$userInfo._id"}
                },
            }
        }},
        {$project: {
            _id: 0,
            id: "$_id.id",
            title: "$_id.title",
            audios: "$$ROOT.audios"
        }}

    ]

    const [resultAuto] = await AutoGeneratedPlaylist.aggregate(aggregationLogic)
    const [resultPlaylist] = await Playlist.aggregate(aggregationLogic)

    if(resultAuto) {
        return res.json({list: resultAuto})
    }

    if(resultPlaylist) {
        return res.json({list: resultPlaylist})
    }

    res.json({list: []})
}

export const getPrivatePlaylistAudios: RequestHandler = async (req, res) => {
    const {limit = "20", pageNo = "0"} = req.query as PaginationQuery
    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)) 
        return res.status(422).json({error: "Invalid audio id!"})

    const aggregationLogic = [
        {$match: {_id: new Types.ObjectId(playlistId), owner: req.user.id}},
        {$project: {
            items: {
                $slice: [
                    "$items",
                    parseInt(pageNo) * parseInt(limit),
                    parseInt(limit)
                ]
            },
            title: "$title"
        }},
        {$unwind: "$items"},
        {$lookup: {
            from: "audios",
            localField: "items",
            foreignField: "_id",
            as: "audios"
        }},
        {$unwind: "$audios"},
        {$lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "userInfo"
        }},
        {$group: {
            _id: {id: "$_id", title: "$title" },
            audios: {
                $push: {
                    id: "$audios._id", 
                    title: "$audios.title", 
                    about: "$audios.about", 
                    category: "$audios.category", 
                    file: "$audios.file.url",
                    poster: "$audios.poster.url", 
                    owner: {name: "$userInfo.name", id: "$userInfo._id"}
                },
            }
        }},
        {$project: {
            _id: 0,
            id: "$_id.id",
            title: "$_id.title",
            audios: "$$ROOT.audios"
        }}

    ]

    const [result] = await Playlist.aggregate(aggregationLogic)

    if(!result) {
        return res.json({followings: []})
    }

    res.json(result)
}

export const getIsFollowing: RequestHandler = async (req, res) => {
    const {profileId} = req.params

    if(!isValidObjectId(profileId)) 
        return res.status(422).json({error: "Invalid audio id!"})

    const user = await User.findOne({
        _id: profileId, followers: req.user.id
    })

    res.json({status: user? true: false})
}
