import seedrandom from 'seedrandom';
import { ExperimentCondition } from './models/ExperimentCondition';

export function withInSUbjectType(experiment, userID: string, monitoredDecisionPointLogsLength: number){
    if (experiment.algorithm === 'random'){
        return randomCondition(experiment,userID,monitoredDecisionPointLogsLength);
    }else if ( experiment.algorithm === 'roundRobinRandom') {
        return randomRoundRobinCondition(experiment,userID,monitoredDecisionPointLogsLength);
    }else if ( experiment.algorithm === 'roundRobinOrdered') {
        return orderedRoundRobinCondition(experiment,userID,monitoredDecisionPointLogsLength);           
    }else {
        return null;
    }
}

export function randomCondition( experiment, userID: string, monitoredDecisionPointLogsLength: number ){
    let randomConditionArray: ExperimentCondition[] = [];
    for( let i = 0; i < 100; i++ ){
        const uniqueIdentifier: string = experiment.id + userID + i;
        const randomCondition = experiment.conditions[ Math.floor(seedrandom(uniqueIdentifier)() * experiment.conditions.length) ];
        randomConditionArray.push(randomCondition);
    }

    rotateElements(randomConditionArray, monitoredDecisionPointLogsLength);
    return randomConditionArray;
}

export function randomRoundRobinCondition( experiment, userID: string, monitoredDecisionPointLogsLength: number ){
    let randomRoundRobinConditionArray: ExperimentCondition[] = [];
    let totalLoopsInQueue = Math.ceil( 100 / experiment.conditions.length );

    for( let i = 0; i < totalLoopsInQueue; i++ ){
        let tempConditionArray : ExperimentCondition[] = experiment.conditions;
        for( let j = 0; j < experiment.conditions.length; j++ ){
            const uniqueIdentifier: string = experiment.id + userID + i + j;
            const randomConditionIndex = Math.floor(seedrandom(uniqueIdentifier)() * tempConditionArray.length);
            const randomCondition = tempConditionArray[ randomConditionIndex ];
            randomRoundRobinConditionArray.push(randomCondition);
            tempConditionArray.splice(randomConditionIndex,1);
        }
    }

    rotateElements(randomRoundRobinConditionArray, monitoredDecisionPointLogsLength);
    return randomRoundRobinConditionArray;
}

export function orderedRoundRobinCondition( experiment, userID: string, monitoredDecisionPointLogsLength: number ){
    let orderedRoundRobinConditionArray: ExperimentCondition[] = [];
    let tempConditionArray : ExperimentCondition[] = experiment.conditions;
    for( let i = 0; i < experiment.conditions.length; i++ ){
        const uniqueIdentifier: string = experiment.id + userID + i;
        const randomConditionIndex = Math.floor(seedrandom(uniqueIdentifier)() * tempConditionArray.length);
        const randomCondition = tempConditionArray[ randomConditionIndex ];
        orderedRoundRobinConditionArray.push(randomCondition);
        tempConditionArray.splice(randomConditionIndex,1);
    }

    rotateElements(orderedRoundRobinConditionArray, monitoredDecisionPointLogsLength);
    return orderedRoundRobinConditionArray;
}

export function rotateElements( conditionArray: ExperimentCondition[], monitoredDecisionPointLogsLength: number ) : ExperimentCondition[] {
    if ( monitoredDecisionPointLogsLength > 0 && conditionArray.length >= 2 ) {
        const totalloopIteration = monitoredDecisionPointLogsLength % conditionArray.length ;
        for ( let i = 0; i <  totalloopIteration; i++ ) {
            const element = conditionArray.shift();
            conditionArray.push(element);
        }
    }
    return conditionArray;
}
  