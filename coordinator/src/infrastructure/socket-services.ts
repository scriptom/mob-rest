import {ReplicaService, ReplicationResult, RestoreResult, RestoreService} from "../application/services";
import ReplicaServer from "../domain/replica-server";
import {io, Socket} from "socket.io-client";

export enum FirstPhase {

}

export class SocketRestoreService implements RestoreService {
    private readonly RESTORE_REQUEST = 'RESTORE';

    constructor(private readonly _servers: ReplicaServer[]) {
    }

    async restoreObjects(): Promise<RestoreResult> {
        return await Promise.race(this._servers.map((server: ReplicaServer) => {
            return new Promise<RestoreResult>((resolve, reject) => {
                try {
                    const socket: Socket = io(server);
                    socket.on('connect', () => {
                        const {host, port} = server;
                        console.log(`Connected to replica server on host=${host} and port=${port} to attempt replication`);
                        socket.emit(this.RESTORE_REQUEST, (data: string) => {
                            resolve(JSON.parse(data));
                        });
                    });
                } catch (e) {
                    reject(e);
                }
            });
        }));
    }
}

type FirstPhaseResponse = 'VOTE_COMMIT' | 'VOTE_ABORT';
type FirstPhaseSuggestion = FirstPhaseResponse | 'VOTE_RANDOM';
type CommitVerdict = 'GLOBAL_COMMIT' | 'GLOBAL_ABORT';

export class SocketReplicationService implements ReplicaService {
    private readonly VOTE_REQUEST = 'VOTE_REQUEST';

    constructor(private readonly _servers: ReplicaServer[],
                private readonly _suggestion: FirstPhaseSuggestion) {
    }

    async replicateObjects(objects: string): Promise<ReplicationResult> {
        // 1st phase: Send VOTE_REQUEST
        const voteResult = await this._initVoteCycle(this._suggestion);
        const commitVerdict: CommitVerdict = voteResult === 'VOTE_COMMIT' ? 'GLOBAL_COMMIT' : 'GLOBAL_ABORT';
        // 2nd phase: broadcast our verdict
        const partialResults = await this._broadcastCommitResult(commitVerdict, commitVerdict === 'GLOBAL_COMMIT' ? objects : undefined);
        return partialResults.reduce((previousValue, currentValue) => {
            const errorsAcc = previousValue.error;
            const newError = currentValue.error;
            return {
                error: `${errorsAcc}
${newError}`
            };
        });
    }

    private async _initVoteCycle(suggestion: FirstPhaseSuggestion): Promise<FirstPhaseResponse> {
        const voteResults = await Promise.all(this._servers.map((server: ReplicaServer) => {
            return new Promise<FirstPhaseResponse>((resolve) => {
                const socket: Socket = io(server);
                socket.on('connect', () => {
                    const {host, port} = server;
                    console.log(`Connected to Replica server host=${host} port=${port} to init voting process (SUGGESTION=${suggestion}`);
                    socket.emit(this.VOTE_REQUEST, suggestion, resolve);
                });
            });
        }));
        return voteResults.some(result => result === 'VOTE_ABORT') ? 'VOTE_ABORT' : 'VOTE_COMMIT';
    }

    private _broadcastCommitResult(result: CommitVerdict, content?: string): Promise<ReplicationResult[]> {
        return Promise.all(this._servers.map((server: ReplicaServer) => {
            return new Promise<ReplicationResult>(resolve => {
                const socket: Socket = io(server);
                socket.on('connect', () => {
                    const {host, port} = server;
                    console.log(`Connected to Replica server host=${host} port=${port} to broadcast result=${result}`);
                    socket.emit(result, content || undefined, resolve);
                });
            });
        }));
    }

}