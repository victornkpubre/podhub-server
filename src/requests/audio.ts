import { Request } from "express"

export interface CreatePlaylistRequest extends Request {
    body: {
        title: string
        resId: string
        visibility: "public" | "private"
    }
}

export interface UpdatePlaylistRequest extends Request {
    body: {
        title: string
        id: string
        item: string
        visibility: "public" | "private"
    }
}
