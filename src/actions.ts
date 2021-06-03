import { Request, Response } from 'express'
import { getRepository } from 'typeorm'  // getRepository"  traer una tabla de la base de datos asociada al objeto
import { User } from './entities/User'
import { Product } from './entities/Product'
import { Exception } from './utils'
import jwt from 'jsonwebtoken'
import fetch from 'cross-fetch'
import extend from 'extend'

const image_finder = require('image-search-engine')

export let refreshTokens: any[] = [];
export const createUser = async (req: Request, res: Response): Promise<Response> => {

    const { first_name, last_name, email, password, address, phone_1, phone_2, date_of_birth } = req.body

    // validaciones de campos obligatorios
    if (!first_name) throw new Exception("Please provide a first_name")
    if (!last_name) throw new Exception("Please provide a last_name")
    if (!email) throw new Exception("Please provide an email")
    if (!password) throw new Exception("Please provide a password")
    if (!address) throw new Exception("Please provide a address")
    if (!phone_1) throw new Exception("Please provide a phone_1")
    if (!phone_2) throw new Exception("Please provide a phone_2")
    if (!date_of_birth) throw new Exception("Please provide a date_of_birth")

    // validación del formato de password
    console.log("largo: ", password.length)
    if (!validatePassword(password)) throw new Exception("Please provide a valid password")

    // validacion del formato de email
    if (!validateEmail(email)) throw new Exception("Please provide a valid email address")

    // verificamos que no exista otro usuario con el mismo email
    const userRepo = getRepository(User)
    const user = await userRepo.findOne({ where: { email: req.body.email } })
    if (user) throw new Exception("User already exists with this email")

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
    const newUser = userRepo.create(oneUser);
    const results = await userRepo.save(newUser);
    return res.json(results);
}

export const getUsers = async (req: Request, res: Response): Promise<Response> => {
    const users = await getRepository(User).find({ select: ["id", "first_name", "last_name", "email", "address", "phone_1", "phone_2", "date_of_birth"] });
    return res.json(users);
}

export const getProducts = async (req: Request, res: Response): Promise<Response> => {
    const products = await getRepository(Product).find({ order: { points: 'DESC' } });
    return res.json(products);
}
export const createBaseProducts = async (req: Request, res: Response): Promise<Response> => {
    const baseURL = "https://gist.githubusercontent.com/ajubin/d331f3251db4bd239c7a1efd0af54e38/raw/058e1ad07398fc62ab7f3fcc13ef1007a48d01d7/wine-data-set.json";

    const fetchProductsData = await fetch(baseURL, {
        headers: {
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
                req.body.image = await image_finder.find(item.title, { size: "large" })
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
    const user = await userRepo.findOne({
        where: { email }
    })
    if (!user) throw new Exception("Invalid email", 401)
    if (!user.checkIfUnencryptedPasswordIsValid(password)) throw new Exception("Invalid password", 401)
    const token = jwt.sign({ user }, process.env.JWT_KEY as string, { expiresIn: process.env.JWT_TOKEN_EXPIRE_IN });
    refreshTokens.push(token);
    return res.cookie('auth-token', token, { httpOnly: true, path: '/', domain: 'localhost' }).json({ token });
}

export const buscarImg = async (req: Request, res: Response) => {
    const { query } = req.body;
    res.json(await image_finder.find(query, { size: "large" }));
}
export const logout = async (req: Request, res: Response) => {
    const { token } = req.body;
    refreshTokens = refreshTokens.filter(t => t !== token);
    res.status(202).clearCookie('auth-token').send('Success logged out')
}

// funcion para validar el formato del email
const validateEmail = (email: string) => {
    const res = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return res.test(email)
}

// funcion para validar el formato del password
const validatePassword = (pass: string) => {
    if (pass.length >= 8 && pass.length <= 20) {
        var mayusc = false
        var minusc = false
        var num = false
        for (var i = 0; i < pass.length; i++) {
            if (pass.charCodeAt(i) >= 65 && pass.charCodeAt(i) <= 90)
                mayusc = true
            else if (pass.charCodeAt(i) >= 97 && pass.charCodeAt(i) <= 122)
                minusc = true
            else if (pass.charCodeAt(i) >= 48 && pass.charCodeAt(i) <= 57)
                num = true
        }
        if (mayusc == true && minusc == true && num == true)
            return true
    }
    return false;
}

export const resetPassword = async (req: Request, res: Response): Promise<Response> => {
    const { userid } = req.params;
    const { oldPassword, newPassword } = req.body;
    if (!userid) throw new Exception("Please specify a user id in url", 400)
    if (!oldPassword) throw new Exception("Please specify old password on your request body", 400)
    if (!newPassword) throw new Exception("Please specify new password on your request body", 400)
    if (!validatePassword(newPassword)) throw new Exception("The password you entered doesn't meet password policy requirements", 400)
    const userRepo = getRepository(User)
    const user = await userRepo.findOne({ where: { id: userid } })
    if (!user) throw new Exception("Invalid user id", 401)
    if (!user.checkIfUnencryptedPasswordIsValid(oldPassword)) throw new Exception("Invalid old password", 401)
    const userPassword = new User();
    userPassword.password = newPassword;
    userPassword.hashPassword();    
    const results = await userRepo.update(user, userPassword).then(() => {return res.json("passord updated!")});    
    return res.json(results);
}

export const updateUser = async (req: Request, res: Response): Promise<Response> => {

    const { first_name, last_name, email, address, phone_1, phone_2, date_of_birth } = req.body

    const userRepo = getRepository(User)
    let user = await userRepo.findOne(req.params.id)

    // verificamos que exista el usuario
    if (!user) throw new Exception("There is no user with this id")

    // verificamos la unicidad y el formato del email
    if (email != user.email) {
        const user2 = await userRepo.findOne({ where: { email: email } })
        if (user2) throw new Exception("There is another user with this email")
        if (!validateEmail(email)) throw new Exception("Please provide a valid email address")
    }

    user.first_name = first_name
    user.last_name = last_name
    user.email = email
    user.address = address
    user.phone_1 = phone_1
    user.phone_2 = phone_2
    user.date_of_birth = date_of_birth

    const users = await userRepo.save(user)
    return res.json(users)
}

export const getUserById = async (req: Request, res: Response): Promise<Response> => {
    const user = await getRepository(User).findOne(req.params.id, { select: ["id", "first_name", "last_name", "email", "address", "phone_1", "phone_2", "date_of_birth"] })
    // verificamos que exista el usuario
    if (!user) throw new Exception("There is no user with this id")
    return res.json(user)
}

export const deleteUser = async (req: Request, res: Response): Promise<Response> => {
    const userRepo = getRepository(User)
    let user = await userRepo.findOne(req.params.id)
    // verificamos que exista el usuario
    if (!user) throw new Exception("There is no user with this id")
    await userRepo.delete(user)
    return res.json({ "message": "User successfully removed" })
}