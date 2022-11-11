import express from 'express';

//FAKER
import { faker } from '@faker-js/faker';

const { Router } = express;

function productosFaker() {
    const cantidad = 5;
    const arr = [];

    for (let i = 1; i <= cantidad; i++) {
        arr.push({
            id: i,
            nombre: faker.commerce.product(),
            precio: faker.commerce.price(),
            foto: faker.image.imageUrl(),
        })
    }

    return arr;
}

export const router  = Router();

router.get('/productos-test', async (req, res) => {
    res.render('main', { layout: 'productosPrueba', listaProductosPrueba: productosFaker() });
});