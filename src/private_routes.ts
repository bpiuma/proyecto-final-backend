/**
 * Pivate Routes are those API urls that require the user to be
 * logged in before they can be called from the front end.
 * 
 * Basically all HTTP requests to these endpoints must have an
 * Authorization header with the value "Bearer <token>"
 * being "<token>" a JWT token generated for the user using 
 * the POST /token endpoint
 * 
 * Please include in this file all your private URL endpoints.
 * 
 */

import { Router, Request, NextFunction, Response } from 'express';
import { safe } from './utils';
import * as actions from './actions';
import { verify } from 'crypto';
import jwt from 'jsonwebtoken';
import { getRepository } from 'typeorm';

const verifyToken = (req: Request, res: Response, next:NextFunction) =>
{     
    const token = req.header('Authorization');
    if(!token) return res.status(400).json('ACCESS DENIED');
    if (!actions.refreshTokens.includes(token)) return res.status(403).json("INVALID TOKEN");    
    const decoded = jwt.verify(token as string, process.env.JWT_KEY as string)
    req.user = decoded;
    console.log(decoded);
    next()
}

// declare a new router to include all the endpoints
const router = Router();

router.get('/user', verifyToken, safe(actions.getUsers));
router.post('/createBaseProducts', verifyToken, safe(actions.createBaseProducts));
router.delete('/logout',verifyToken, safe(actions.logout));
router.put('/user/:userid/resetPassword', verifyToken, safe(actions.resetPassword));
router.put('/user/:id', verifyToken, safe(actions.updateUser));
router.get('/user/:id', verifyToken, safe(actions.getUserById));
router.delete('/user/:id', verifyToken, safe(actions.deleteUser));
router.post('/cart/add/user/:userid/product/:productid',verifyToken,safe(actions.addProductToCart));
router.post('/cart/substract/user/:userid/product/:productid',verifyToken,safe(actions.subProductToCart));
router.delete('/cart/delete/user/:userid/product/:productid',verifyToken,safe(actions.delProductToCart));
router.get('/cart/user/:userid',verifyToken,safe(actions.getCart));
router.post('/favorite/add/user/:userid/product/:productid',verifyToken,safe(actions.addProductToFavorite));
router.get('/favorite/user/:userid',verifyToken,safe(actions.getFavorites));
router.delete('/favorite/delete/user/:userid/product/:productid',verifyToken,safe(actions.delProductToFavorite));
export default router;

