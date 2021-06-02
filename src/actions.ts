import { Request, Response } from 'express'
import { getRepository } from 'typeorm'  // getRepository"  traer una tabla de la base de datos asociada al objeto
import { User } from './entities/User'
import { Product } from './entities/Product'
import { Exception } from './utils'
import jwt from 'jsonwebtoken'
import fetch from 'cross-fetch'
import extend from 'extend'


export const createUser = async (req: Request, res: Response): Promise<Response> => {
    const { first_name, last_name, email, password, address, phone_1, phone_2, date_of_birth } = req.body;
    // important validations to avoid ambiguos errors, the client needs to understand what went wrong
    if (!first_name) throw new Exception("Please provide a first_name")
    if (!last_name) throw new Exception("Please provide a last_name")
    if (!email) throw new Exception("Please provide an email")
    if (!validateEmail(email)) throw new Exception("Please provide a valid email address")
    if (!password) throw new Exception("Please provide a password")
    if (!address) throw new Exception("Please provide an address")
    if (!phone_1) throw new Exception("Please provide a phone_1")
    if (!phone_2) throw new Exception("Please provide a phone_2")
    if (!date_of_birth) throw new Exception("Please provide a date of birth")

    const userRepo = getRepository(User)
    // fetch for any user with this email
    const user = await userRepo.findOne({ where: { email: email } })
    if (user) throw new Exception("Users already exists with this email")
    
    let oneUser = new User();

    oneUser.first_name = first_name;
    oneUser.last_name = last_name;
    oneUser.email = email;
    oneUser.password = password;
    oneUser.hashPassword();
    oneUser.address = address;
    oneUser.phone_1 = phone_1;
    oneUser.phone_2 = phone_2;
    oneUser.date_of_birth = date_of_birth;

    const newUser = getRepository(User).create(oneUser);  //Creo un usuario
    const results = await getRepository(User).save(newUser); //Grabo el nuevo usuario 
    return res.json(results);
}

export const getUsers = async (req: Request, res: Response): Promise<Response> =>{
		const users = await getRepository(User).find();
		return res.json(users);
}

export const getProducts = async (req: Request, res: Response): Promise<Response> =>{
		const products = await getRepository(Product).find({order: {id:'ASC'}});
		return res.json(products);
}
export const createBaseProducts = async (req: Request, res: Response): Promise<Response> => {
    const baseURL = "https://gist.githubusercontent.com/ajubin/d331f3251db4bd239c7a1efd0af54e38/raw/058e1ad07398fc62ab7f3fcc13ef1007a48d01d7/wine-data-set.json";
    
    const fetchProductsData = await fetch(baseURL,{
          headers : { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
           }
         })
        .then(async res => {
            if (res.status >= 400) {
                throw new Error("Bad response from server");
            }
            const responseJson = await res.json();            
            return responseJson;
        })
        .then(async product => {
            product.map(async (item: any, index: any) => {
                req.body.points = item.points 
                req.body.title = item.title
                req.body.description = item.description
                req.body.taster_name = item.taster_name
                req.body.taster_twitter_handle = item.taster_twitter_handle
                req.body.price = item.price
                req.body.designation = item.designation
                req.body.variety = item.variety
                req.body.region_1 = item.region_1
                req.body.region_2 = item.region_2
                req.body.province = item.province
                req.body.country = item.country
                req.body.image = ""                
                req.body.winery = item.winery
                const newProduct = getRepository(Product).create(req.body);  //Creo por cada iteración el producto
                const results = await getRepository(Product).save(newProduct); //Grabo el nuevo personaje
            });

        })
        .catch(err => {
            console.error(err);
        });

    const r = {
        message: "All Products are created",
        state: true
    }
    return res.json(r);
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