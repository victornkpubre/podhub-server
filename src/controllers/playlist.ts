import { RequestHandler } from "express";
import Audio from "#/models/audio";
import Playlist from "#/models/playlist";
import { CreatePlaylistRequest, UpdatePlaylistRequest } from "#/requests/audio";
import { isValidObjectId } from "mongoose";
import { AudioItem, MigrationResult, PopulatedFavList } from "#/utils/types";
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

const processString = ( str: string): string => {
    return (str).toLowerCase()
}

const albumProcessRegex = (str: string): string => {
    return str.split(' ').join('/s*')
}

export const spotifymigrate: RequestHandler = async (req, res) => {
    const accessToken = {
        access_token: req.body.access_token,
        token_type: req.body.token_type,
        expires_in: req.body.expires_in,
        refresh_token: req.body.refresh_token,
    }
    const sdk = SpotifyApi.withAccessToken('d5d8bfeb561e44c09bab30a30037f3b0', accessToken as AccessToken)

    const audioList = req.body.audio_list as AudioItem[]
    const matchList: MigrationResult = []

    for (let i = 0; i < audioList.length; i++) {
        const item = audioList[i];
        const itemTitle = processString(item.title)
        const itemArtist = processString(item.artist!)
        const itemAlbum = processString(item.album!)

        const result = await sdk.search(`${itemTitle}%20track:${itemTitle}%20album:${itemAlbum}%20artist:${itemArtist}`, ['track'], undefined, 40)
         
        result.tracks.items.forEach((track) => {

            // console.log("Artist")
            // console.log(processString(track.artists[0].name))
            // console.log(itemArtist)

            // console.log("Track")
            // console.log(processString(track.name))
            // console.log(itemTitle)

            // console.log("Album")
            // console.log(processString(track.album.name))
            // console.log(itemAlbum)

            // console.log("Images")
            // console.log(track.album.images)
            

            const spotifyTrack = {
                id: track.id, 
                title: track.name, 
                artist: track.artists[0].name, 
                album: track.album.name, 
                image: track.album.images.length? track.album.images[1].url: undefined 
            }

            console.log("Found a match")
            console.log(processString(item.title))
            console.log(processString(spotifyTrack.title))
            console.log(processString(spotifyTrack.album))
            console.log(processString(spotifyTrack.artist))
            console.log(processString(spotifyTrack.artist)  === processString(item.artist!)
            && processString(spotifyTrack.title) === processString(item.title) 
            && processString(spotifyTrack.album) === processString(item.album!) )

            console.log(albumProcessRegex(itemAlbum))

            const albumRegex = new RegExp(`^${albumProcessRegex(itemAlbum)}/s*(.*)`, "i");

            const trackWasFound = processString(spotifyTrack.artist) === itemArtist
                && processString(spotifyTrack.title) === itemTitle 
                && albumRegex.test(processString(spotifyTrack.album)) 

            

            if (trackWasFound) {
                console.log(matchList)
                const matchIndex = matchList.findIndex((match) => { 
                    console.log(match.item.id)
                    console.log(item.id)
                    console.log( match.item.id === item.id)

                    return match.item.id === item.id
                })


                console.log("Track was found")
                console.log(spotifyTrack)

                console.log("Match Index")
                console.log(matchIndex)
                
                if(matchIndex == -1 || !matchList.length) {
                    console.log("adding to match list")
                    matchList.push({
                        item: item,
                        matches: [spotifyTrack]
                    })
                }
                else {
                    console.log("adding to matches")
                    matchList[matchIndex].matches.push(spotifyTrack)
                }
            }
        })
    }
   
    res.json({data: matchList})
}

export const createSpotifyPlaylist: RequestHandler = async (req, res) => {
    const accessToken = {
        access_token: req.body.access_token,
        token_type: req.body.token_type,
        expires_in: req.body.expires_in,
        refresh_token: req.body.refresh_token,
    }
    const playlist = req.body.playlist as string[]
    const title = req.body.title

    const sdk = SpotifyApi.withAccessToken('d5d8bfeb561e44c09bab30a30037f3b0', accessToken as AccessToken)
    const id = (await sdk.currentUser.profile()).id

    const playlists = (await sdk.playlists.getUsersPlaylists(id)).items
    for (let i = 0; i < playlists.length ; i++) {
        const playlist = playlists[i];
        if(playlist.name === title) return res.status(404).json({error: "Playlist already exists"}) 
    }

    //create playlist
    const spotifyPlaylist = await sdk.playlists.createPlaylist(id, {name: title})
    await sdk.playlists.addItemsToPlaylist(spotifyPlaylist.id, playlist)

    res.json({playlist: spotifyPlaylist})
}