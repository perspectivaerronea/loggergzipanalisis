
import express from 'express';
import path from 'path';
import {fork } from 'child_process';

const { Router } = express;

export const router  = Router();

router.get('/randoms' ,async (req, res) =>{
    const randomNumber = req.query.cant || 100000000;

    const computo = fork(path.resolve('./modulos/numerosRandom.js'))

    computo.send(randomNumber);
    computo.on('message', listado => {
        res.send(listado);
    })
});


