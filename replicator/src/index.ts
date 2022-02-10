import {Server, Socket} from 'socket.io';
import {Command, ReplicationResult, RestoreResult, Vote} from "./types";
import randomSuggestionHandler from "./utils/random-suggestion-handler";
import commitReplica from "./utils/commit-replica";
import restoreObjects from "./utils/restore-objects";

const port = Number.parseInt(process.argv[2]);
const io: Server = new Server(Number.isNaN(port) ? 6000 : port);
type Suggestion = 'COMMIT' | 'ABORT' | 'AZAR';
const VOTE_REQUEST = 'VOTE_REQUEST';
io.on('connection', (socket: Socket) => {
    socket.on(VOTE_REQUEST, (suggestion: Suggestion, callback: (vote: Vote) => void) => {
        let vote: Vote;
        switch (suggestion) {
            case "AZAR":
                vote = randomSuggestionHandler();
                break;
            case "ABORT":
                vote = 'VOTE_ABORT';
                break;
            case 'COMMIT':
                vote = 'VOTE_COMMIT';
                break;
        }
        callback(vote);
    });
    socket.on(<Command>'GLOBAL_ABORT', async (callback: (result: ReplicationResult) => void) => {
        console.log(`Received GLOBAL_ABORT from ${socket.conn.remoteAddress}`);
        console.log('Aborting commit of contents.');
        callback({
            message: 'Aborted by GLOBAL_ABORT',
            success: false
        });
    });

    socket.on(<Command>'GLOBAL_COMMIT', async (contents: string, callback: (result: ReplicationResult) => void) => {
        console.log(`Received GLOBAL_COMMIT from ${socket.conn.remoteAddress}`);
        try {
            await commitReplica(contents, 'replica/repository.xml');
            callback({message: '', success: true});
        } catch (e) {
            const err = e instanceof Error ? e.message : e as string;
            callback({message: err, success: false});
        }
    });

    socket.on('RESTORE', async (callback: (result: RestoreResult) => void) => {
        console.log(`Received RESTORE from ${socket.conn.remoteAddress}`);
        try {
            const contents = await restoreObjects('replica/repository.xml');
            callback({
                error: '',
                contents
            });
        } catch (e) {
            const error = e instanceof Error ? e.message : e as string;
            callback({
                error,
                contents: ''
            });
        }
    });
    console.log(`Connection accepted - ${socket.conn.remoteAddress}`);
});

console.log(`App started listening in port ${port}`);