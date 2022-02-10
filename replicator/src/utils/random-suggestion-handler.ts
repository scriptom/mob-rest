import {Action, Vote} from "../types";

export default (): Vote => {
    const rand = Math.floor(Math.random() * 100);
    const map: Map<Action, Vote> = new Map([
        ['ABORT', 'VOTE_ABORT'],
        ['COMMIT', 'VOTE_COMMIT'],
    ]);

    const action = <Action>['ABORT', 'COMMIT'][rand % 2];
    return map.get(action) || 'VOTE_COMMIT';
}