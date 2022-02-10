import {Action} from "../../domain/mob-object";

export interface MobObjectCreateRequest {
    name?: string;
    action?: Action;
}
