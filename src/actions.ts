import { Request, Response } from 'express'
import { getRepository } from 'typeorm'  // getRepository"  traer una tabla de la base de datos asociada al objeto
import { User } from './entities/User'
import { Exception } from './utils'
import jwt from 'jsonwebtoken'
import fetch from 'cross-fetch'
import extend from 'extend'

export const createUser = async (req: Request, res:Response): Promise<Response> =>{

	// important validations to avoid ambiguos errors, the client needs to understand what went wrong
	if(!req.body.first_name) throw new Exception("Please provide a first_name")
	if(!req.body.last_name) throw new Exception("Please provide a last_name")
	if(!req.body.email) throw new Exception("Please provide an email")
	if(!req.body.password) throw new Exception("Please provide a password")

	const userRepo = getRepository(User)
	// fetch for any user with this email
	const user = await userRepo.findOne({ where: {email: req.body.email }})
	if(user) throw new Exception("Users already exists with this email")

	const newUser = getRepository(User).create(req.body);  //Creo un usuario
	const results = await getRepository(User).save(newUser); //Grabo el nuevo usuario 
	return res.json(results);
}

export const getUsers = async (req: Request, res: Response): Promise<Response> =>{
		const users = await getRepository(User).find();
		return res.json(users);
}

export const login = async (req: Request, res: Response): Promise<Response> => {
    let { email, password } = req.body;
    if (!email) throw new Exception("Please specify an email on your request body", 400)
    if (!password) throw new Exception("Please specify a password on your request body", 400)
    if (!validateEmail(email)) throw new Exception("Please provide a valid email address", 400)
    
    const userRepo = getRepository(User)
    const user = await userRepo.findOne({ where: { email } })
    if (!user) throw new Exception("Invalid email", 401)
    if (!user.checkIfUnencryptedPasswordIsValid(password)) throw new Exception("Invalid password", 401)
    const token = jwt.sign({ user }, process.env.JWT_KEY as string, { expiresIn: process.env.JWT_TOKEN_EXPIRE_IN});
    res.cookie('currentUser', email);        
    return res.cookie('auth-token', token, {httpOnly: true, path:'/', domain: 'localhost'}).json({ user, token });
}


export const logout = async (req: Request, res: Response) => {
   // req.session.destroy();
    res.status(202).clearCookie('currentUser')
    res.status(202).clearCookie('auth-token').send('Success logged out')
    
}

const validateEmail = (email: string) => {
    const res = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return res.test(email);
}