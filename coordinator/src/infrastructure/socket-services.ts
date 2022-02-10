import {ReplicaService, RestoreService} from "../application/services";
import ReplicaServer from "../domain/replica-server";
import {io, Socket} from "socket.io-client";
import {Action, ReplicationResult, RestoreRecount, RestoreResult} from "../types";

export class SocketRestoreService implements RestoreService {
    private readonly RESTORE_REQUEST = 'RESTORE';

    constructor(private readonly _servers: ReplicaServer[]) {
    }

    async restoreObjects(): Promise<RestoreResult> {
        return await Promise.race(this._servers.map((server: ReplicaServer) => {
            const {host, port} = server;
            const serverUrl = `ws://${host}:${port}`;
            console.log(`Attempting to connect to ${serverUrl}`);
            return new Promise<RestoreResult>((resolve, reject) => {
                try {
                    const socket: Socket = io(serverUrl);
                    socket.on('connect', () => {
                        console.log(`Connected to replica server on ${serverUrl} to attempt restoration`);
                        socket.emit(this.RESTORE_REQUEST, resolve);
                    });
                } catch (e) {
                    reject(e);
                }
            });
        }));
    }
}

type FirstPhaseResponse = 'VOTE_COMMIT' | 'VOTE_ABORT';
type CommitVerdict = 'GLOBAL_COMMIT' | 'GLOBAL_ABORT';

export class SocketReplicationService implements ReplicaService {
    private readonly VOTE_REQUEST = 'VOTE_REQUEST';

    constructor(private readonly _servers: ReplicaServer[],
                private readonly _suggestion: Action) {
    }

    async replicateObjects(objects: string): Promise<ReplicationResult> {
        // 1st phase: Send VOTE_REQUEST
        const voteResult = await this._initVoteCycle(this._suggestion);
        console.log(`Vote Cycle ended. Decision: ${voteResult}`);
        const commitVerdict: CommitVerdict = voteResult === 'VOTE_COMMIT' ? 'GLOBAL_COMMIT' : 'GLOBAL_ABORT';
        // 2nd phase: broadcast our verdict
        const partialResults = await this._broadcastCommitResult(commitVerdict, commitVerdict === 'GLOBAL_COMMIT' ? objects : undefined);
        // Carry all messages and reduce messages to inform caller
        return partialResults.reduce((previousValue, currentValue) => {
            const errorsAcc = previousValue.message;
            const newError = currentValue.message;
            return {
                message: `${errorsAcc}
${newError}`.trim(),
                success: previousValue.success && currentValue.success
            };
        });
    }

    private async _initVoteCycle(suggestion: Action): Promise<FirstPhaseResponse> {
        console.log('Initiating Commit Phase 1: Vote request');
        const voteResults = await Promise.all(this._servers.map((server: ReplicaServer) => {
            const {host, port} = server;
            const serverUrl = `ws://${host}:${port}`;
            console.log(`Attempting to connect to ${serverUrl}`);
            return new Promise<FirstPhaseResponse>((resolve) => {
                const socket: Socket = io(serverUrl);
                socket.on('connect', () => {
                    console.log(`Connected to Replica server ${serverUrl} to init voting process [SUGGESTION=${suggestion}]`);
                    socket.emit(this.VOTE_REQUEST, suggestion, resolve);
                });
            });
        }));
        return voteResults.some(result => result === 'VOTE_ABORT') ? 'VOTE_ABORT' : 'VOTE_COMMIT';
    }

    private _broadcastCommitResult(result: CommitVerdict, content?: string): Promise<ReplicationResult[]> {
        console.log('Initiating Commit Phase 2: Commit Verdict');
        return Promise.all(this._servers.map((server: ReplicaServer) => {
            return new Promise<ReplicationResult>(resolve => {
                const {host, port} = server;
                const serverUrl = `ws://${host}:${port}`;
                const socket: Socket = io(serverUrl);
                socket.on('connect', () => {
                    console.log(`Connected to Replica server ${serverUrl} to broadcast result=${result}`);
                    if (result === 'GLOBAL_COMMIT') {
                        socket.emit(result, content, resolve);
                    } else {
                        socket.emit(result, resolve);
                    }
                });
            });
        }));
    }
}