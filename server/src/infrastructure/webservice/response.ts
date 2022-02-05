import {MobObject} from "../../domain/mob-object";

interface ResourceRelatedLinks {
    links: [
        {
            rel: string;
            uri: string;
        }
    ]
}

export type MobObjectListResponseInstance = MobObject & ResourceRelatedLinks;
