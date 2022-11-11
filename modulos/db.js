import { ProductoDaoMongo } from '../dao/productos/ProductoDaoMongo.js';
import { MensajeDaoMongo } from '../dao/mensajes/MensajesDaoMongo.js';
import { UsuarioDaoMongo } from '../dao/usuarios/UsuarioDaoMongo.js';

async function inicio_mensajes() {
    const ar = new MensajeDaoMongo;
    ar.abrir();

    return ar;
}

async function inicio_productos() {
    const ar = new ProductoDaoMongo;
    ar.abrir();

    return ar;
}

async function inicio_usuarios() {
    const ar = new UsuarioDaoMongo;
    ar.abrir();

    return ar;
}

export const mensajesDB = await inicio_mensajes();
export const productosDB = await inicio_productos();
export const usuariosDB = await inicio_usuarios();