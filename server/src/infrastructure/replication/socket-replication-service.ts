import ReplicationService, {ReplicationResult, RestoreResult} from "../../application/replication-service";
import {io, Socket} from "socket.io-client";

const EMPTY_RESTORE_RESULT: RestoreResult = {
    count: -1,
    data: [],
    error: {}
};
const EMPTY_REPLICATION_RESULT: ReplicationResult = {
    message: '',
    success: false
};

export interface SocketConnInfo {
    host: string;
    port: number;
}

enum SocketEvent {
    REPLICATE = 'ReplicarObjeto',
    RESTORE = 'RestaurarObjeto'
}

export default class SocketReplicationService implements ReplicationService {
    constructor(private readonly coordinator: SocketConnInfo) {
    }

    restoreReplicas(): Promise<RestoreResult> {
        return this._emitToSocket(SocketEvent.RESTORE);
    }

    requestReplication(): Promise<ReplicationResult> {
        return this._emitToSocket(SocketEvent.REPLICATE);
    }

    private _emitToSocket<Response>(socketEvent: SocketEvent): Promise<Response> {
        return new Promise<Response>((resolve, reject) => {
            try {
                const socket: Socket = io(this.coordinator);
                socket.on('connect', () => {
                    const {host, port} = this.coordinator;
                    console.log(`Server App Connected for ${socketEvent} to coordinator ${host}:${port}`);
                    socket.emit(socketEvent, resolve);
                });
            } catch (e) {
                reject(e);
            }
        });
    }
}