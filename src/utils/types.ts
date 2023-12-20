import { AudioDocument } from "#/models/audio";
import { ObjectId } from "mongoose";

export type PopulatedFavList = {items: AudioDocument<{_id: ObjectId, name: string}>[]}
export type OwnerObject = {_id: ObjectId, name: string}
export type PaginationQuery = {pageNo: string; limit: string}
export type OwnerPopulation = AudioDocument<{_id: ObjectId, name: string}>
export type SpotifyAudio = {id: string, title: string, artist: string, album: string, image?: string}
export type AudioItem = {
    id: string, 
    title: string, 
    artist: string, 
    album: string, 
    about: string, 
    category: string
    file: string
    poster: string
    owner: {
        name: string
        id: string
    }
}
export type MigrationMatch = {
    item: AudioItem, 
    matches: SpotifyAudio[]
}
export type MigrationResult = MigrationMatch[]