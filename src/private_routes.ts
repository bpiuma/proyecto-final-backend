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
    const decoded = jwt.verify(token as string, process.env.JWT_KEY as string)
    req.user = decoded;
    console.log(decoded);
    next()
}

// declare a new router to include all the endpoints
const router = Router();

router.get('/user', safe(actions.getUsers));
router.get('/createBaseProducts', verifyToken, safe(actions.createBaseProducts));

export default router;
