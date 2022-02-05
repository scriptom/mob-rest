import {Server} from "socket.io";
import * as settings from "./infrastructure/settings.json";
import {Action} from "./domain/mob-object";

const io = new Server(settings.port);

const ACTION_MAP: Map<Action, (message: string) => void> = new Map<Action, (message: string) => void>([
    [Action.RESTORE, (message: string) => {

    }]
])

io.on('connection', () => {
    console.log(`Accepted connection`);
});
