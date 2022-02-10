import ReplicationService, {ReplicationResult, RestoreResult} from "../../application/replication-service";
import {io, Socket} from "socket.io-client";
import {Action} from "../../domain/mob-object";

export interface SocketConnInfo {
    host: string;
    port: number;
}

type SocketEvent = 'ReplicarObjetos' | 'RestaurarObjetos';
export default class SocketReplicationService implements ReplicationService {
    constructor(private readonly coordinator: SocketConnInfo) {
    }

    restoreReplicas(): Promise<RestoreResult> {
        return this._emitToSocket('RestaurarObjetos');
    }

    requestReplication(action: Action): Promise<ReplicationResult> {
        return this._emitToSocket('ReplicarObjetos', action);
    }

    private _emitToSocket<Response>(socketEvent: SocketEvent, ...args: string[]): Promise<Response> {
        return new Promise<Response>((resolve, reject) => {
            try {
                const {host, port} = this.coordinator;
                const socket: Socket = io(`ws://${host}:${port}`);
                socket.on('connect', () => {
                    console.log(`Server App Connected for ${socketEvent} to coordinator ${host}:${port}`);
                    socket.emit(socketEvent, ...args, resolve);
                });
                socket.on('connect_error', (err => {
                    reject(err.message);
                }))
            } catch (err) {
                reject(err instanceof Error ? err.message : err as string);
            }
        });
    }
}