import express, {Router} from "express";
import XmlMobObjectRepository from "./repository/xml-mob-object-repository";
import {MobObjectCreateRequest} from "./webservice/requests";
import {constants as HttpStatus} from "http2";
import {MobObjectListResponseInstance} from "./webservice/response";
import * as settings from './settings.json';
import {Action, MobObject, MobObjectRepository} from "../domain/mob-object";
import {UseCase} from "../application/use-case";
import ReplicationService from "../application/replication-service";
import SocketReplicationService from "./replication/socket-replication-service";
import {AddMobObject, DeleteMobObject, GetAllMobObjects} from '../application/crud-use-cases';
import {ReplicateUseCase, RestoreUseCase} from "../application/replication-use-cases";

function getReplicationService(): ReplicationService {
    return new SocketReplicationService(settings.coordinator);
}

function validateAction(action: string): action is Action {
    return ['COMMIT', 'AZAR', 'ABORT'].includes(action);
}

export default function (): Router {
    const router = Router();
    const repository: MobObjectRepository = new XmlMobObjectRepository(settings.repositoryPath);
    const MIME_TYPES = {
        APPLICATION_JSON: 'application/json'
    };

    router.use(express.json());

    router.route('/objetos')
        .post((req, res, next) => {
            const {body} = req as { body: MobObjectCreateRequest };
            let message = '';
            if (body.name === undefined) {
                message = 'Missing required parameter `name`';
            }

            if (message !== '') {
                res.status(HttpStatus.HTTP_STATUS_BAD_REQUEST).send({message});
            } else {
                next();
            }
        }, async (req, res) => {
            const {body} = req as { body: Required<MobObjectCreateRequest> };
            const {name} = body;
            const useCase = new AddMobObject(repository, name);
            const saved = await useCase.execute();
            if (saved) {
                res.status(HttpStatus.HTTP_STATUS_CREATED)
                    .type(MIME_TYPES.APPLICATION_JSON)
                    .header(HttpStatus.HTTP2_HEADER_LOCATION, `/api/objetos/${encodeURIComponent(name)}`)
                    .send();
            } else {
                const error = useCase.error;
                res.status(HttpStatus.HTTP_STATUS_INTERNAL_SERVER_ERROR)
                    .send({message: `Internal Error Occurred during save: ${error}`});
            }
        })
        .get(async (req, res) => {
            const getterUserCase: UseCase<MobObject[]> = new GetAllMobObjects(repository);
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

    router.delete('/objetos/:name', async (req, res) => {
        const {params: {name}} = req;
        const useCase: UseCase<boolean> = new DeleteMobObject(repository, decodeURIComponent(name));
        const wasDeleted = await useCase.execute();
        if (wasDeleted) {
            res.status(HttpStatus.HTTP_STATUS_NO_CONTENT).send();
        } else {
            res.status(HttpStatus.HTTP_STATUS_NOT_FOUND).send();
        }
    });

    router.post('/objetos/replica',
        (req, res, next) => {
           const {body: {action}} = req;
            if (!action || !validateAction(action)) {
                res.status(HttpStatus.HTTP_STATUS_BAD_REQUEST).send({
                    message: `Unknown action ${action}. action must be one of: "COMMIT", "ABORT", "AZAR"`
                });
            } else {
                next();
            }
        },
        async (req, res) => {
            const {body: {action}} = req as {body: {action: Action}};
            const useCase = new ReplicateUseCase(getReplicationService(), action);
            const result = await useCase.execute();
            let message: string;
            let status: number;
            if (!result) {
                status = HttpStatus.HTTP_STATUS_INTERNAL_SERVER_ERROR;
                console.error(message = `Error during replication:  ${useCase.error}`);
            } else {
                status = HttpStatus.HTTP_STATUS_OK;
                console.log(message = `Replication complete`);
            }
            res.status(status).send({message, result});
        });

    router.get('/objetos/restauracion', async (req, res) => {
        const useCase = new RestoreUseCase(getReplicationService());
        const result = await useCase.execute();
        let message: string;
        let status: number;
        if (result.count === -1) {
            status = HttpStatus.HTTP_STATUS_INTERNAL_SERVER_ERROR
            console.error(message = `Error during restoration: ${useCase.error}`);
        } else {
            // TODO: Restaurar los objetos
            status = HttpStatus.HTTP_STATUS_OK
            console.log(message = `Restoration complete: ${result.count} items restored`);
            res.header(HttpStatus.HTTP2_HEADER_LOCATION, `/api/objetos`)
        }
        res.status(status).send({message, result});
    });

    return router;
}
