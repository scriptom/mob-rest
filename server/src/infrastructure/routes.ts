import express, {Response, Router} from "express";
import XmlMobObjectRepository from "./repository/xml-mob-object-repository";
import {MobObjectCreateRequest} from "./webservice/requests";
import {constants as HttpStatus} from "http2";
import {MobObjectListResponseInstance} from "./webservice/response";
import {
    AddMobObject,
    DeleteMobObject,
    GetAllMobObjects,
    GetMobObjectByName,
    GetMobObjectsByAction
} from '../application/crud-use-cases';
import * as settings from './settings.json';
import {Action, MobObject, MobObjectRepository} from "../domain/mob-object";
import {UseCase} from "../application/use-case";
import ReplicationService from "../application/replication-service";
import SocketReplicationService from "./replication/socket-replication-service";
import {ReplicateUseCase, RestoreUseCase} from "../application/replication-use-cases";

function getReplicationService(): ReplicationService {
    return new SocketReplicationService(settings.coordinator);
}

function getReplicationUseCase(action: Action): UseCase<unknown> {
    if (Action.REPLICATE === action) {
        return new ReplicateUseCase(getReplicationService());
    }

    if (Action.RESTORE === action) {
        return new RestoreUseCase(getReplicationService());
    }

    return new class extends UseCase<unknown> {
        get error(): string {
            return "";
        }

        execute(): Promise<unknown> {
            return Promise.resolve();
        }
    }
}

export default function (): Router {
    const router = Router();
    const repository: MobObjectRepository = new XmlMobObjectRepository(settings.repositoryPath);
    const MIME_TYPES = {
        APPLICATION_JSON: 'application/json'
    };

    router.use(express.json());

    type MobObjectGetterUseCaseFunction = (filter: string) => UseCase<MobObject[]>;
    router.route('/objetos')
        .post((req, res, next) => {
            const {body} = req as { body: MobObjectCreateRequest };
            if (body.name === undefined) {
                res.status(HttpStatus.HTTP_STATUS_BAD_REQUEST).send('Missing required parameter `name`');
            } else if (body.action === undefined) {
                res.status(HttpStatus.HTTP_STATUS_BAD_REQUEST).send('Missing required parameter `action`');
            } else {
                next();
            }
        }, async (req, res) => {
            const {body} = req as { body: Required<MobObjectCreateRequest> };
            const {name, action: actionName} = body;
            const action: Action = Action[actionName as keyof typeof Action];
            const useCase = new AddMobObject(repository, name, action);
            const saved = await useCase.execute();
            if (saved) {
                if (action === Action.REPLICATE) {
                    const replicaUseCase: ReplicateUseCase = new ReplicateUseCase(getReplicationService());
                    const result = await replicaUseCase.execute();
                    if (!result) {
                        console.error(`Error during replication:  ${replicaUseCase.error}`);
                    } else {
                        console.log(`Replication complete`);
                    }
                } else if (action === Action.RESTORE) {
                    const restoreUseCase: RestoreUseCase = new RestoreUseCase(getReplicationService());
                    const result = await restoreUseCase.execute();
                    if (!result) {
                        console.error(`Error during restoration: ${restoreUseCase.error}`);
                    } else {
                        // TODO: Restaurar los objetos
                        console.log(`Restoration complete: ${result.length} items restored`);
                    }
                }
                res.status(HttpStatus.HTTP_STATUS_CREATED)
                    .type(MIME_TYPES.APPLICATION_JSON)
                    .header(HttpStatus.HTTP2_HEADER_LOCATION, `/api/mob-objects/${encodeURIComponent(name)}`)
                    .send();
            } else {
                const error = useCase.error;
                res.status(HttpStatus.HTTP_STATUS_INTERNAL_SERVER_ERROR)
                    .send(`Internal Error Occurred during save: ${error}`);
            }
        })
        .get(async (req, res) => {
            const {query} = req;
            const DEFAULT_FILTER = '__all';
            const useCaseFactory: Map<string, MobObjectGetterUseCaseFunction> = new Map<string, MobObjectGetterUseCaseFunction>([
                ['action', (action) => new GetMobObjectsByAction(repository, action)],
                [DEFAULT_FILTER, () => new GetAllMobObjects(repository)],
            ]);
            const knownFilters: string[] = [...useCaseFactory.keys()].slice(0, useCaseFactory.size - 2);
            const filterName: string = knownFilters.find(filter => filter in query) || DEFAULT_FILTER;
            const getterUserCase: UseCase<MobObject[]> = useCaseFactory.get(filterName)!(query[filterName] as string);
            const mobObjects: MobObject[] = await getterUserCase.execute();
            const responseList: MobObjectListResponseInstance[] = mobObjects.map(object => {
                return {
                    ...object,
                    links: [
                        {
                            rel: '_self',
                            uri: `/api/objetos/${encodeURIComponent(object.name)}`
                        }
                    ]
                };
            })
            res.status(HttpStatus.HTTP_STATUS_OK).send(responseList);
        });

    router.route('/objetos/:name')
        .get(async (req, res: Response<MobObjectListResponseInstance | { message: string }>) => {
            const {params: {name}} = req;
            const useCase: UseCase<MobObject | undefined> = new GetMobObjectByName(repository, decodeURIComponent(name));
            const mobObject: MobObject | undefined = await useCase.execute();
            if (mobObject === undefined) {
                res.status(HttpStatus.HTTP_STATUS_NOT_FOUND).send({
                    message: `Resource with name "${name}" not found.`
                });
            } else {
                res.status(HttpStatus.HTTP_STATUS_OK).send({
                    ...mobObject,
                    links: [
                        {
                            rel: '_self',
                            uri: `/api/objetos/${encodeURIComponent(mobObject.name)}`
                        }
                    ]
                });
            }
        })
        .delete(async (req, res) => {
            const {params: {name}} = req;
            const useCase: UseCase<boolean> = new DeleteMobObject(repository, decodeURIComponent(name));
            const wasDeleted = await useCase.execute();
            if (wasDeleted) {
                res.status(HttpStatus.HTTP_STATUS_NO_CONTENT).send();
            } else {
                res.status(HttpStatus.HTTP_STATUS_NOT_FOUND).send();
            }
        });

    return router;
}
