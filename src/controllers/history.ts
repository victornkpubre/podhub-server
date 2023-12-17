import { RequestHandler } from "express";
import History, { HistoryType } from "#/models/history";
import { PaginationQuery } from "#/utils/types";


export const getHistory: RequestHandler = async (req, res) => {
    const {limit="20", pageNo = "0"} = req.query as PaginationQuery
    const histories = await History.aggregate([
        {$match: {owner: req.user.id}},
        {$project: {
            all: {
                $slice: [
                    "$all", parseInt(pageNo), (parseInt(limit))
                ]
            }
        }},
        {$unwind: "$all"},
        {$lookup: {
            from: "audios",
            localField: "all.audio",
            foreignField: "_id",
            as: "audioInfo"
        }},
        {$unwind: "$audioInfo"},
        {$project: {
            _id: 0,
            id: "$all._id",
            audioId: "$audioInfo._id",
            date: "$all.date",
            title: "$audioInfo.title"
        }},
        {$group: {
            _id: {
                $dateToString: {format: "%Y-%m-%d", date: "$date"},
            },
            audios: { $push: "$$ROOT" },
        }},
        {$project: {
            _id: 0,
            id: "$id",
            date: "$_id",
            audios: "$$ROOT.audios"
        }},
        {$sort: {date: -1}}
    ])

    res.json({histories})
}

export const updateHistory: RequestHandler = async (req, res) => {
    const {audio, progress, date} = req.body
    const history: HistoryType = {audio, progress, date}
    const oldHistory = await History.findOne({owner: req.user.id})

    if(!oldHistory) {
        await History.create({
            owner: req.user.id,
            last: history,
            all: [history]
        })
        return res.json({success: true})
    }

    const today = new Date()
    const startDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    )
    
    const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1
    )

    //get list of audio ids in history
    const histories = await History.aggregate([
        {$match: {owner: req.user.id}},
        {$unwind: "$all"},
        {
            $match: {
                "all.date" : {
                    $gte: startDay,
                    $lt: endOfDay
                }
            }
        },
        {
            $project: {
                _id: 0,
                audio: "$all.audio"
            }
        }
    ])

    const sameAudioInHistory = histories.find((item) => {
        if(item.audio.toString() === audio ) return item;
    })

    console.log(sameAudioInHistory)

    let newHistory;
    if(sameAudioInHistory) {
        console.log("Found same audio")
        newHistory = await History.findOneAndUpdate(
            {
                owner: req.user.id,
                "all.audio": audio
            },
            {
                $set: {
                    "all.$.progress": progress,
                    "all.$.date": new Date(date)
                }
            },
            {
                new: true
            }
        )
    } 
    else {
        newHistory = await History.findByIdAndUpdate( oldHistory,{
            $push: {all: {$each: [history], $position: 0}},
            $set: {last: history},
        }, {new: true})
        console.log("Adding new audio")
    }

    res.json(newHistory)
}


export const removeHistory: RequestHandler = async (req, res) => {

    const removeAll = req.query.all === "yes"

    if(removeAll) {
        await History.findOneAndDelete({owner: req.user.id})
        return res.json({success: true})
    }

    const histories = req.query.histories as string
    const ids = JSON.parse(histories) as string[]

    await History.findOneAndUpdate(
        {owner: req.user.id},
        {$pull: {all: {_id: ids} }}
    )
    res.json({success: true})
}

export const getRecentlyPlayed: RequestHandler = async (req, res) => {
    const match = {$match: {owner: req.user.id}}
    const sliceMatch = {$project: {
        myHistory: {$slice: ["$all", 10]}
    }}
    const dateSort = { 
        $project: {
            histories: {
                $sortArray: {
                    input: "$myHistory",
                    sortBy: {date: -1}
                }
            }
        }
    }
    const unwindWithIndex = {
        $unwind: {path: "$histories", includeArrayIndex: "index"}
    }
    const audioLookup = {
        $lookup: {
            from: "audios",
            localField: "histories.audio",
            foreignField: "_id",
            as: "audioInfo"
        }
    }
    const unwindAudioInfo = {
        $unwind: "$audioInfo"
    }
    const userLookup = {
        $lookup: {
            from: "users",
            localField: "audioInfo.owner",
            foreignField: "_id",
            as: "owner"
        }
    }
    const unwindUser = {
        $unwind: "$owner"
    }
    const projectResult = {
        $project: {
            _id: 0,
            id: "$audioInfo._id",
            title: "$audioInfo.title",
            artist: "$audioInfo.artist",
            album: "$audioInfo.album",
            about: "$audioInfo.about",
            file: "$audioInfo.file.url",
            poster: "$audioInfo.poster.url",
            category: "$audioInfo.category.url",
            owner: {name: "$owner.name", id: "$owner._id"},
            date: "$histories.date",
            progress: "$histories.progress"
        }
    }


    const audios = await History.aggregate([
        match,
        sliceMatch,
        dateSort,
        unwindWithIndex,
        audioLookup,
        unwindAudioInfo,
        userLookup,
        unwindUser,
        projectResult
    ])

    res.json({audios})
}
