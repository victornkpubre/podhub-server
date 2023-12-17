import { RequestHandler } from "express";
import Audio from "#/models/audio";
import Playlist from "#/models/playlist";
import { CreatePlaylistRequest, UpdatePlaylistRequest } from "#/requests/audio";
import { isValidObjectId } from "mongoose";
import { PopulatedFavList } from "#/utils/types";
import { SpotifyApi, AccessToken, } from "@spotify/web-api-ts-sdk";


export const createPlaylist: RequestHandler = async (req: CreatePlaylistRequest, res) => {
    const {title, resId, visibility} = req.body
    const ownerId = req.user.id

    if(resId) {
        const audio = await Audio.findById(resId)
        if(!audio) {
            return res.status(404).json({error: "Could not found the audio"})
        }
    }

    const duplicateTitle = await Playlist.findOne({title: title})
    console.log(duplicateTitle)

    if(duplicateTitle) return res.status(422).json({error: "You already have a playlist with this title"})

    const newPlaylist = new Playlist({
        title,
        owner: ownerId,
        visibility
    })

    if(resId) 
        newPlaylist.items = [resId as any]
    
    await newPlaylist.save()
    
    res.status(201).json({
        Playlist: {
            id: newPlaylist._id,
            title: newPlaylist.title,
            visibility: newPlaylist.visibility
        }
    })

}


export const updatePlaylist: RequestHandler = async (req: UpdatePlaylistRequest, res) => {
    const {id, item, title, visibility} = req.body
    const playlist = await Playlist.findOneAndUpdate(
        {_id: id, owner: req.user.id},
        {title, visibility}, 
        {new: true}
    )

    if(!playlist) return res.status(404).json({error: "Playlist not found"})

    if(item) {
        const audio = await Audio.findById(item)
        if(!audio) return res.status(404).json({error: "Audio not found"})
        
        await Playlist.findByIdAndUpdate(playlist._id, {
            $addToSet: {items: item}
        })
        
    }

    res.json({playlist: {
        id: playlist._id,
        title: playlist.title,
        visibility: playlist.visibility
    }})

}


export const removePlaylist: RequestHandler = async (req: UpdatePlaylistRequest, res) => {

    const  {playlistId, resId, all} = req.query

    if(all === "yes" ) {
        const playlist = await Playlist.findByIdAndDelete({
            _id: playlistId,
            owner: req.user.id
        })
    
        if(!playlist) return res.status(404).json({error: "Playlist not found!"})

    }

    const playlist = await Playlist.findOneAndUpdate({
        _id: playlistId,
        owner: req.user.id
    }, {
        $pull: {items: resId}
    })

    if(!playlist) return res.status(404).json({error: "Playlist not found!"})

    res.status(200).json({success: true})

}

export const getPlaylistByProfile: RequestHandler = async (req, res) => {
    const {pageNo = "0", limit = "20"} = req.query as { pageNo: string; limit: string}

    const data = await Playlist.find({
        owner: req.user.id,
        visibility: {$ne: 'auto'}
    })
    .skip(parseInt(pageNo) * parseInt(limit))
    .limit(parseInt(limit))
    .sort('-createdAt')

    const playlist = data.map((item) => {
        return {
            id: item._id,
            title: item.title,
            itemsCount: item.items.length,
            visibility: item.visibility
        }
    })

    res.json({playlist})

}

export const getAudios: RequestHandler = async (req, res) => {
    const {playlistId} = req.params;
    console.log("Getting Audios")

    if( !isValidObjectId(playlistId)) 
        return res.status(422).json({error: "Audio is is invalid"})

    const playlist = await Playlist.findOne({
        owner: req.user.id,
        _id: playlistId
    }).populate<PopulatedFavList>({
        path: "items",
        populate: {
            path: "owner",
            select: "name"
        }
    })

    const audios = playlist?.items.map((item) => {
        
        return {
            id: item._id,
            title: item.title,
            category: item.category,
            file: item.file.url,
            poster: item.poster?.url,
            owner: {name: item.owner.name, id: item.owner._id ,}
        }
    })


    res.json({
        audioslist: {
            id: playlist?._id,
            title: playlist?.title,
            audios
        }
    })
}

export const spotifysearch: RequestHandler = async (req, res) => {
    //get list of audio id
    const audios = req.body.audios

    //search spotify bt audio titles return response
    //filter audio response by artist and album return list of spotify ids
    //create list of unmatched audios

    // res.json({data: data})
}

export const spotifysearch2: RequestHandler = async (req, res) => {

    const accessToken = {
        access_token: req.body.access_token,
        token_type: req.body.token_type,
        expires_in: req.body.expires_in,
        refresh_token: req.body.refresh_token,
    }

    console.log(accessToken)
    
    const sdk = SpotifyApi.withAccessToken('d5d8bfeb561e44c09bab30a30037f3b0', accessToken as AccessToken)
    console.log(sdk)
    
    const items = await sdk.search("The Beatles", ["artist"]);
    console.log(items)


    res.json({data: items})
}