//ENV
import dotenv from 'dotenv';

//
import cluster from 'cluster';
import os from 'os';

//YARGS
import yargs from 'yargs';

//EXPRESS
import express from 'express';
import { Server as IOServer } from 'socket.io';
import { Server as httpServer } from 'http';
import { engine } from 'express-handlebars'

//PATH
import path from 'path';
import { fileURLToPath } from 'url';

//DB
import { mensajesDB } from './modulos/db.js';
import { productosDB } from './modulos/db.js';

//SESSION
import session from 'express-session';
import MongoStore from 'connect-mongo';

//PASSPORT
import passport from './modulos/passportConfig.js';

//FLASH
import flash from 'connect-flash';

//LOGIN
import { router as login } from './modulos/login.js';

//REGISTRO
import { router as registro } from './modulos/register.js';

//FAKER
import { router as faker } from './modulos/productosPrueba.js'

//NORMALIZR
import normalizarMensajes from './modulos/normDenorm.js'

//MODULOS
import { router as randoms } from "./modulos/randoms.js";

//COMPRESSION
import compression from 'compression';

//LOGGER - WINSTON
import buildlogger from './modulos/winston_config.js';


dotenv.config();

const app = express();
const httpServerV = new httpServer(app);
const io = new IOServer(httpServerV);
const hbs = { engine };

//  const { resolve } = createRequire(import.meta.url)
// const { default: add } = await import(pathToFileURL(resolve('.')).toString())

const __filename = fileURLToPath(import.meta.url);
// const __filename = fileURLToPath(resolve);
const __dirname = path.dirname(__filename);

function autorizacion(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(301).redirect("/");

}

// Sesión
const usuario = [];

//Sesión
const advanceOptions = { useNewUrlParser: true, useUnifiedTopology: true };
const sesionMongo = session({
    store: MongoStore.create({
        mongoUrl: process.env.MONGOATLAS,
        mongoOptions: advanceOptions
    }),
    dbname: process.env.MONTOATLASBASE,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: (1000 * 60 * 10)
    }
});

/**
 *  (1000 * 60 * 10) = 60000 milisegundos = 10 minutos 
 */

//YARGS
const yargsMod = yargs(process.argv.slice(2));
const args = yargsMod
    .alias({
        e: 'NODE_ENV',
        p: 'puerto',
        m: 'modo'
    })
    .argv;

process.env.NODE_ENV = args.NODE_ENV || 'prod';

const PORT = args.puerto || process.env.PORT;

const MODO = args.modo == 'CLUSTER';

const logger = buildlogger(process.env.NODE_ENV);

// Indicamos que queremos cargar los archivos estáticos que se encuentran en dicha carpeta
// Comentado para usar con nginx
app.use('/static', express.static('public'))

//Las siguientes líneas son para que el código reconozca el req.body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sesionMongo);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(compression())


/* MASTER */
if (MODO && cluster.isPrimary) {
    const numCPUs = os.cpus().length
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork()
    }

    cluster.on('exit', worker => {        
        cluster.fork()
    })
}
/* --------------------------------------------------------------------------- */
/* WORKER */
else {

    // LOGIN
    app.use('/', login);
    // REGISTER
    app.use('/register', registro);
    // RANDOM
    app.use('/api', autorizacion, randoms);
    // PRODUCTOS PRUEBA
    app.use('/api', autorizacion, faker);

    //Configuro el Engine para usar HandleBars
    app.engine('hbs', hbs.engine({
        extname: '.hbs',
        defaultLayout: 'index.hbs',
        layoutDir: __dirname + '/views/layouts',
        partialDir: __dirname + '/views/partials'
    }));

    app.set('views', './views');
    app.set('view engine', 'hbs');


    app.get('/failure', (req, res) => {
        res.render('main', { layout: 'failure', message: req.flash('message') });
    })

    // PRINCIPAL

    app.get('/api', autorizacion, async (req, res) => {
        //Creo la cookie con el nombre de usuario    
        usuario.push(req.user.usuario)
        res.status(201).render('./partials/tabla', { usuario: req.user.usuario });
    });

    app.get('/api/info', autorizacion, async (req, res) => {

        const info = {
            argEntrada: process.argv.slice(2),
            pathEjecucion: process.execPath,
            nombrePlataforma: process.platform,
            processID: process.pid,
            versionNodeJS: process.version,
            carpetaProyecto: __dirname,
            memoriaTotalReservada: (process.memoryUsage()).rss,
            numeroProcesadores: os.cpus().length,
        }

        res.render('main', { layout: 'info', data: info });
    });


    // LOGOUT

    app.get('/api/logout', (req, res, next) => {
        req.logout(function (err) {
            if (err) { return next(err); }
            res.render('main', { layout: 'logout', usuario: usuario[usuario.length - 1] });
        });
    });

    // MENSAJES

    io.on('connection', (socket) => {

        socket.on('nuevoUsuario', async () => {

            //Envio Lista de Productos                
            const arr = await productosDB.obtenerRegistros();
            const listaProductos = arr;

            io.sockets.emit('listaProductos', listaProductos);

            //Envio Mensajes en el Chat
            const msg = await mensajesDB.obtenerRegistros();

            //Obtención Mensajes Normalizados
            const arrMsgN = normalizarMensajes({ id: 'mensajes', post: msg });

            io.sockets.emit('mensaje', arrMsgN);

        })

        socket.on('nuevoProducto', async (pr) => {

            await productosDB.guardar(pr)
            const listaProductos = await productosDB.obtenerRegistros();

            io.sockets.emit('listaProductos', listaProductos);
        })

        socket.on('nuevoMensaje', async (data) => {

            await mensajesDB.guardar(data)
            const msg = await mensajesDB.obtenerRegistros();

            const arrMsgN = normalizarMensajes({ id: 'mensajes', post: msg });

            io.sockets.emit('mensaje', arrMsgN);
        });

    })

    // El servidor funcionando en el puerto 3000
    logger.info(process.pid);
    httpServerV.listen(PORT, () => console.log('SERVER ON'));
}