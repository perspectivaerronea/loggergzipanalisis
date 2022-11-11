import express from 'express';
import passport from './passportConfig.js';

const { Router } = express;

export const router  = Router();

router.get('/', async (req, res) => {
    res.render('main', { layout: 'register' });
})

router.post('/', passport.authenticate('registro', {
    successRedirect: '/api',
    failureRedirect: '/failure',
    passReqToCallback: true
}));