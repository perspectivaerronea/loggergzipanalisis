import winston from "winston";

function prodLogger(){
    const prodLogger = winston.createLogger({
        transports:[
            new winston.transports.File({filename: 'debug.log', level: 'debug'}),
            new winston.transports.File({filename: 'error.log', level: 'error'}),
            new winston.transports.Console({level: 'info'}),  
        ]
    })
    return prodLogger;
}

function defaultLogger(){
    const defaultLogger = winston.createLogger({
        transports:[
            new winston.transports.Console({level: 'info'}),            
        ]
    })
    return defaultLogger;
}

let logger = null;

export const buildlogger = (entorno) => {

    if( entorno == 'prod'){
        logger = prodLogger();
    } else{
        logger = defaultLogger();
    }

    return logger;

}