import {Server} from "socket.io";
import * as settings from "./infrastructure/settings.json";
import {ReplicateUseCase, RestoreUseCase} from "./application/use-case";
import {SocketReplicationService, SocketRestoreService} from "./infrastructure/socket-services";
import {Action, KnownServices, Vote} from "./types";

const io = new Server(settings.port);

const replicationServers = settings.replicationServers || [];
io.on('connection', (socket) => {
    socket.on(KnownServices.RESTORE, async (callback) => {
        console.log(`Received call from ${socket.conn.remoteAddress} to service ${KnownServices.RESTORE}`);
        const restoreUseCase = new RestoreUseCase(new SocketRestoreService(replicationServers), settings.repositoryPath);
        const result = await restoreUseCase.execute();
        console.log(`Restoration done. Result=${JSON.stringify(result)}`);
        callback(result);
    });

    socket.on(KnownServices.REPLICATE, async (suggestion: Action, callback) => {
        console.log(`Received call from ${socket.conn.remoteAddress} to service ${KnownServices.REPLICATE}`);
        const replicateUseCase = new ReplicateUseCase(new SocketReplicationService(replicationServers, suggestion), settings.repositoryPath)
        const result = await replicateUseCase.execute();
        console.log(`Replication done. Result=${JSON.stringify(result)}`);
        callback(result);
    });
    
    console.log(`Accepted connection ${socket.conn.remoteAddress}`);
});

console.log(`App listening on port ${settings.port}`);
