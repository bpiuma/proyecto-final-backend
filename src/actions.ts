import { Request, Response } from 'express'
import { getRepository } from 'typeorm'  // getRepository"  traer una tabla de la base de datos asociada al objeto
import { User } from './entities/User'
import { Product } from './entities/Product'
import { Exception } from './utils'
import jwt from 'jsonwebtoken'
import fetch from 'cross-fetch'
import extend from 'extend'
import { Cart } from './entities/Cart'
import { UserFavoriteProduct } from './entities/UserFavoriteProduct'
import { send_mail } from './emailTemplates/passRecovery'
import { totalmem } from 'os'
import { Tasting } from './entities/Tasting'
import { Company } from './entities/Company'
import { Store } from './entities/Store'
import { Event } from './entities/Event'
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
    const baseURL = "https://raw.githubusercontent.com/acampopiano/wine-data-set/master/wine-data-set-test.json";
    const {companyid} = req.params

    const companyRepo = getRepository(Company)
    const company = await companyRepo.findOne({where:{id:companyid}})
    

    if(!companyid) throw new Exception("Please specify a company id in url", 400)

    if(!company) throw new Exception("Company id not exist!", 400)

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
            return responseJson.results;
        })
        .then(async product => {
            product.map(async (item: any, index: any) => {
                req.body.image = await image_finder.find(item.title, {size: "large"})
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
                req.body.winery = item.winery
                req.body.company = company
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
    const results = await userRepo.update(user, userPassword).then(() => { return res.json("passord updated!") });
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

export const addProductToCart = async (req: Request, res: Response): Promise<Response> => {
    const { userid, productid } = req.params
    const { cant } = req.body
    const userRepo = getRepository(User)
    const productRepo = getRepository(Product)
    const cartRepo = getRepository(Cart)
    const product = await productRepo.findOne({ where: { id: productid } })
    const user = await userRepo.findOne({ where: { id: userid } })

    if (!userid) throw new Exception("Please specify a user id in url", 400)
    if (!productid) throw new Exception("Please specify a product id in url", 400)
    if (!cant) throw new Exception("Please specify a cantity for product in body", 400)

    if (!product) throw new Exception("Product not exist!")
    if (!user) throw new Exception("User not found")

    const userCartProduct = await cartRepo.findOne({
        relations: ['user', 'product'],
        where: {
            product: product,
            user: user
        }
    })
    if (userCartProduct) {
        userCartProduct.amount = (product.price * cant) + userCartProduct.amount
        userCartProduct.cant = (userCartProduct.cant + cant)
        await cartRepo.save(userCartProduct).then(() => {
            return res.json({ "message": "Product Cantity/Amount successfully updated!" })
        })
    } else {

        const oneProductToCart = new Cart()
        oneProductToCart.user = user
        oneProductToCart.product = product
        oneProductToCart.cant = cant
        oneProductToCart.amount = (product.price * cant)
        const newProductToCart = getRepository(Cart).create(oneProductToCart)
        const results = await getRepository(Cart).save(newProductToCart).then(() => {
            return res.json({ "message": "Product added successfully to cart" })
        })
    }
    return res.json({ "message": "Cart not updated" })
}

export const subProductToCart = async (req: Request, res: Response): Promise<Response> => {
    const { userid, productid } = req.params
    const { cant } = req.body
    const userRepo = getRepository(User)
    const productRepo = getRepository(Product)
    const cartRepo = getRepository(Cart)
    const product = await productRepo.findOne({ where: { id: productid } })
    const user = await userRepo.findOne({ where: { id: userid } })

    if (!userid) throw new Exception("Please specify a user id in url", 400)
    if (!productid) throw new Exception("Please specify a product id in url", 400)
    if (!cant) throw new Exception("Please specify a cantity for product in body", 400)

    if (!product) throw new Exception("Product not exist!")
    if (!user) throw new Exception("User not found")

    const userCartProduct = await cartRepo.findOne({
        relations: ['user', 'product'],
        where: {
            product: product,
            user: user
        }
    })
    if (userCartProduct) {
        userCartProduct.amount = (product.price * cant) - userCartProduct.amount
        userCartProduct.cant = (userCartProduct.cant - cant)
        if (userCartProduct.cant > 0) {
            await cartRepo.save(userCartProduct).then(() => {
                return res.json({ "message": "Product Cantity/Amount successfully updated!" })
            })
        } else {
            await cartRepo.remove(userCartProduct).then(() => {
                return res.json({ "message": "Product successfully delete from cart!" })
            })
        }
    } else return res.json({ "message": "User/Product not exist in cart!" })

    return res.json({ "message": "Cart not updated" })
}

export const delProductToCart = async (req: Request, res: Response): Promise<Response> => {
    const { userid, productid } = req.params

    const userRepo = getRepository(User)
    const productRepo = getRepository(Product)
    const cartRepo = getRepository(Cart)
    const product = await productRepo.findOne({ where: { id: productid } })
    const user = await userRepo.findOne({ where: { id: userid } })

    if (!userid) throw new Exception("Please specify a user id in url", 400)
    if (!productid) throw new Exception("Please specify a product id in url", 400)


    if (!product) throw new Exception("Product not exist!")
    if (!user) throw new Exception("User not found")

    const userCartProduct = await cartRepo.findOne({
        relations: ['user', 'product'],
        where: {
            product: product,
            user: user
        }
    })

    if (userCartProduct) {
        await cartRepo.delete(userCartProduct).then(() => {
            return res.json({ "message": "Product successfully delete from cart!" })
        })
    } else return res.json({ "message": "User/Product not exist in cart!" })

    return res.json({ "message": "Cart not updated" })
}

export const getCart = async (req: Request, res: Response): Promise<Response> => {
    const { userid } = req.params
    const userRepo = getRepository(User)
    const cartRepo = getRepository(Cart)
    const user = await userRepo.findOne({ where: { id: userid } })
    if (!userid) throw new Exception("Please specify a user id in url", 400)
    if (!user) throw new Exception("User not found")
    const userCartProduct = await cartRepo.find({
        relations: ['product'],
        where: {
            user: user
        }
    })
    if (userCartProduct.length) {
        let total: number = 0;
        const totalAmount = userCartProduct.map((item, i) => {
            return total += item.amount
        })
        return res.json({ userCartProduct, "totalCart": total })
    }else throw new Exception("The user has no products in cart",400)
    return res.json({ "message": "Nothing to do" })
}

export const passwordRecovery = async (req: Request, res: Response): Promise<Response> => {

    const userRepo = getRepository(User)
    const user = await userRepo.findOne({ where: { email: req.body.email } })
    if (!user) throw new Exception("Invalid email", 401)

    const token = jwt.sign({ user }, process.env.JWT_KEY as string, { expiresIn: process.env.JWT_TOKEN_EXPIRE_IN });
    refreshTokens.push(token);
    const userName = user.first_name + " " + user.last_name
    send_mail(userName, user.email, token)
    return res.json({ "message": "Email successfully sent" })
}

export const addProductToFavorite = async (req: Request, res: Response): Promise<Response> => {
    const { userid, productid } = req.params
    const userRepo = getRepository(User)
    const productRepo = getRepository(Product)
    const favoriteRepo = getRepository(UserFavoriteProduct)
    const product = await productRepo.findOne({ where: { id: productid } })
    const user = await userRepo.findOne({ where: { id: userid } })

    if (!userid) throw new Exception("Please specify a user id in url", 400)
    if (!productid) throw new Exception("Please specify a product id in url", 400)

    if (!product) throw new Exception("Product not exist!")
    if (!user) throw new Exception("User not found")

    const userFavoriteProduct = await favoriteRepo.findOne({
        relations: ['user', 'product'],
        where: {
            product: product,
            user: user
        }
    })

    if(userFavoriteProduct) throw new Exception("Product already in user favorites!", 400)
    const oneProductToFavorite = new UserFavoriteProduct()
    oneProductToFavorite.user = user
    oneProductToFavorite.product = product
    const newProductToFavorite = getRepository(UserFavoriteProduct).create(oneProductToFavorite)
    const results = await getRepository(UserFavoriteProduct).save(newProductToFavorite).then(() => {
        return res.json({ "message": "Product added successfully to favorites" })
    })

    return res.json({ "message": "Favorite not updated" })
}

export const getFavorites = async (req: Request, res: Response): Promise<Response> => {
    const { userid } = req.params
    const userRepo = getRepository(User)
    const favoriteRepo = getRepository(UserFavoriteProduct)
    const user = await userRepo.findOne({ where: { id: userid } })
    if (!userid) throw new Exception("Please specify a user id in url", 400)
    if (!user) throw new Exception("User not found")
    const userFavoriteProduct = await favoriteRepo.find({
        relations: ['product'],
        where: {
            user: user
        }
    })
    if (userFavoriteProduct.length) {                
        return res.json( userFavoriteProduct)
    }else throw new Exception("User does not have favorite products")
    return res.json({ "message": "Nothing to do" })
}

export const delProductToFavorite = async (req: Request, res: Response): Promise<Response> => {
    const { userid, productid } = req.params
    const userRepo = getRepository(User)
    const productRepo = getRepository(Product)
    const favoriteRepo = getRepository(UserFavoriteProduct)
    const product = await productRepo.findOne({ where: { id: productid } })
    const user = await userRepo.findOne({ where: { id: userid } })

    if (!userid) throw new Exception("Please specify a user id in url", 400)
    if (!productid) throw new Exception("Please specify a product id in url", 400)

    if (!product) throw new Exception("Product not exist!")
    if (!user) throw new Exception("User not found")

    const userFavoriteProduct = await favoriteRepo.findOne({
        relations: ['user', 'product'],
        where: {
            product: product,
            user: user
        }
    })

    if(!userFavoriteProduct) throw new Exception("Product not exists in your favorites!", 400)
    
    await favoriteRepo.remove(userFavoriteProduct).then(() => {
        return res.json({ "message": "Product remove successfully to favorites" })
    })

    return res.json({ "message": "Favorite not updated" })
}

export const addProductToTasting = async (req: Request, res: Response): Promise<Response> => {
    const { userid, productid } = req.params
    const userRepo = getRepository(User)
    const productRepo = getRepository(Product)
    const tastingRepo = getRepository(Tasting)
    const product = await productRepo.findOne({ where: { id: productid } })
    const user = await userRepo.findOne({ where: { id: userid } })
    const productToTasting:number = 3;
    if (!userid) throw new Exception("Please specify a user id in url", 400)
    if (!productid) throw new Exception("Please specify a product id in url", 400)

    if (!product) throw new Exception("Product not exist!",400)
    if (!user) throw new Exception("User not found",400)
    const productCount = await tastingRepo.count({ where: {user,state:true}});
    if(productCount<productToTasting){
        const userTastingProduct = await tastingRepo.findOne({
            relations: ['user', 'product'],
            where: {
                product: product,
                user: user,
                state: true
            }
        })
    
        if(userTastingProduct) throw new Exception("Product already in user tasting!", 400)

        let startdate = new Date()
        let enddate = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000));
        
        const oneProductToTasting = new Tasting()
        oneProductToTasting.user = user
        oneProductToTasting.product = product
        oneProductToTasting.start_date = startdate
        oneProductToTasting.end_date = enddate
        oneProductToTasting.price = Math.floor((product.price * product.discountTasting)/100)
        oneProductToTasting.state = true
        const newProductToTasting = getRepository(Tasting).create(oneProductToTasting)
        const results = await getRepository(Tasting).save(newProductToTasting).then(() => {
            return res.json({ "message": "Product added successfully to Tasting!"})
        })
    }else throw new Exception("You cannot taste any more wines at the moment",400)

    return res.json({ "message": "Tasting not updated" })
}

export const getTasting = async (req: Request, res: Response): Promise<Response> => {
    const { userid } = req.params
    const userRepo = getRepository(User)
    const productRepo = getRepository(Product)
    const tastingRepo = getRepository(Tasting)    
    const user = await userRepo.findOne({ where: { id: userid } })
   
    if (!userid) throw new Exception("Please specify a user id in url", 400)    
    
    if (!user) throw new Exception("User not found",400)

    const userTastingProduct = await tastingRepo.find({
        relations: ['product'],
        where: {            
            user: user,
            state: true
        }
    })
    
    if(userTastingProduct.length) {
        return res.json(userTastingProduct)
    }
    else throw new Exception("The user is not tasting products",400)

    return res.json({ "message": "Nothing to do" })
}

export const createCompany = async (req: Request, res: Response): Promise<Response> => {
    const { name, address, phone_1, phone_2, site_url } = req.body    
    const {storeid} = req.params
    if (!name) throw new Exception("Please provide a company name")
    if (!address) throw new Exception("Please provide a address")
    if (!phone_1) throw new Exception("Please provide a phone_1")
    if (!phone_2) throw new Exception("Please provide a phone_2")
    if (!site_url) throw new Exception("Please provide a site url")
    const storeRepo = getRepository(Store)
    const companyRepo = getRepository(Company)
    const store = await storeRepo.findOne({where:{id:storeid}})
    const company = await companyRepo.findOne({ where: { name: req.body.name, site_url:req.body.site_url } })
    if (!storeid) throw new Exception("Please specify a company id in url", 400)    
    if (company) throw new Exception("Company name already exists",400)
    if (!store) throw new Exception("Store not exists!",400)
    let oneCompany = new Company()
    oneCompany.name = name
    oneCompany.address = address
    oneCompany.phone_1 = phone_1
    oneCompany.phone_2 = phone_2
    oneCompany.site_url = site_url
    oneCompany.store = store
    const newCompany = companyRepo.create(oneCompany)
    const results = await companyRepo.save(newCompany)
    return res.json(results)
}

export const createStore = async (req: Request, res: Response): Promise<Response> => {
    const { name, address, phone_1, phone_2 } = req.body    
    if (!name) throw new Exception("Please provide a company name")
    if (!address) throw new Exception("Please provide a address")
    if (!phone_1) throw new Exception("Please provide a phone_1")
    if (!phone_2) throw new Exception("Please provide a phone_2")
    
    const storeRepo = getRepository(Store)
    const store = await storeRepo.findOne({ where: { name: req.body.name } })
    if (store) throw new Exception("Store name already exists")
    let oneStore = new Store();
    oneStore.name = name;    
    oneStore.address = address;
    oneStore.phone_1 = phone_1;
    oneStore.phone_2 = phone_2;
    
    const newStore = storeRepo.create(oneStore);
    const results = await storeRepo.save(newStore);
    return res.json(results);
}

export const delProductToTasting = async (req: Request, res: Response): Promise<Response> => {
    const { userid, productid } = req.params
    const userRepo = getRepository(User)
    const productRepo = getRepository(Product)
    const tastingRepo = getRepository(Tasting)
    const product = await productRepo.findOne({ where: { id: productid } })
    const user = await userRepo.findOne({ where: { id: userid } })

    if (!userid) throw new Exception("Please specify a user id in url", 400)
    if (!productid) throw new Exception("Please specify a product id in url", 400)

    if (!product) throw new Exception("Product not exist!")
    if (!user) throw new Exception("User not found")

    const userFavoriteProduct = await tastingRepo.findOne({
        relations: ['user', 'product'],
        where: {
            product: product,
            user: user
        }
    })

    if(!userFavoriteProduct) throw new Exception("Product not exists in your Tasting!", 400)
    
    await tastingRepo.remove(userFavoriteProduct).then(() => {
        return res.json({ "message": "Product remove successfully to tasting" })
    })

    return res.json({ "message": "Tasting not updated" })
}

export const createEvent = async (req: Request, res: Response): Promise<Response> => {
    const { title, description, start_date, end_date, link_zoom } = req.body    
    if (!title) throw new Exception("Please provide a name for the event")
    if (!description) throw new Exception("Please provide a description")
    if (!start_date) throw new Exception("Please provide a start date for the event")
    if (!end_date) throw new Exception("Please provide a end date for the event")
    if (!link_zoom) throw new Exception("Please provide a link of zoom meeting")
    
    const eventRepo = getRepository(Event)
    const event = await eventRepo.findOne({ where: { title: title } })
    if (event) throw new Exception("Event title already exists")
    
    let oneEvent = new Event();
    oneEvent.title = title;    
    oneEvent.description = description;
    oneEvent.start_date = start_date;
    oneEvent.end_date = end_date;
    oneEvent.link_zoom = link_zoom
    
    const newEvent = eventRepo.create(oneEvent);
    const results = await eventRepo.save(newEvent);
    return res.json(results);
}

export const getEvents = async (req: Request, res: Response): Promise<Response> => {               
     const events = await getRepository(Event).find({ select: ["id", "title", "description", "start_date", "end_date", "link_zoom"] });
    return res.json(events);
}