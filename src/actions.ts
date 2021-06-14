import { Request, Response } from 'express'
import { getRepository } from 'typeorm'  // getRepository"  traer una tabla de la base de datos asociada al objeto
import { User } from './entities/User'
import { Product } from './entities/Product'
import { Exception } from './utils'
import jwt from 'jsonwebtoken' //importamos json web token para poder firmar los datos del usuario y generar un token valido
import fetch from 'cross-fetch' //importamos cross-fetch para poder traer desde una api externa los datos
import extend from 'extend' //importamos extend para poder hacer un join de datos en formato json si fuera necesario
import { Cart } from './entities/Cart'
import { UserFavoriteProduct } from './entities/UserFavoriteProduct'
import { send_mail_recovery } from './emailTemplates/passRecovery'
import { totalmem } from 'os'
import { Tasting } from './entities/Tasting'
import { Company } from './entities/Company'
import { Store } from './entities/Store'
import { Event } from './entities/Event'
import { EventUser } from './entities/EventUser'
import { send_mail_activation } from './emailTemplates/userActivation'
const image_finder = require('image-search-engine') //importamos image_finder para poder traer la imagen de los productos desde la api google sin tener una key

export let refreshTokens: any[] = [] //esta variable se utiliza para guardar las sesiones validas del sitio

/*
CreateUser: Metodo que devuelve una promesa, es utilizado para crear el usuario al registrarse en el sitio
Recibe por POST, datos personales y si esos datos son validos, los guarda en la base de datos, con el campo active = false.
Si el usuario fue insertado en la bd satisfactoriamente, se encriptan los datos del usuario con JWT, se devuelven en un token,
junto con un mensaje de exito, y se envia un mail al la casilla del usurio para proceder a su activacion.
*/
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
    if (!validatePassword(password)) throw new Exception("Please provide a valid password")
    // validacion del formato de email
    if (!validateEmail(email)) throw new Exception("Please provide a valid email address")
    // verificamos que no exista otro usuario con el mismo email
    const userRepo = getRepository(User)
    const user = await userRepo.findOne({ where: { email: req.body.email } })
    if (user) throw new Exception("User already exists with this email")
    let oneUser = new User()
    oneUser.first_name = first_name
    oneUser.last_name = last_name
    oneUser.email = email
    oneUser.password = password
    oneUser.hashPassword()
    oneUser.address = address
    oneUser.phone_1 = phone_1
    oneUser.phone_2 = phone_2
    oneUser.date_of_birth = date_of_birth
    const newUser = userRepo.create(oneUser)
    const results = await userRepo.save(newUser)
    const token = jwt.sign({ newUser }, process.env.JWT_KEY as string, { expiresIn: process.env.JWT_TOKEN_EXPIRE_IN })
    refreshTokens.push(token)
    const userName = newUser.first_name + " " + newUser.last_name
    send_mail_activation(userName, newUser.email, token)
    return res.cookie('auth-token', token, { httpOnly: true, path: '/', domain: 'localhost' }).json({ "message": "Please check your mailbox", token })
}

/*
GetUsers: Método que devuelve una promesa, es utilizado para devolver los datos del usuario registrado, 
menos la password para que puedan ser utilizados en el sitio.
*/
export const getUsers = async (req: Request, res: Response): Promise<Response> => {
    const users = await getRepository(User).find({ select: ["id", "first_name", "last_name", "email", "address", "phone_1", "phone_2", "date_of_birth", "active"] })
    return res.json(users)
}

/*
GetProducts: Método que devuelve una promesa, es utilizado para devolver los datos de los productos de la tienda, 
ordenados por el puntaje obtenido a nivel internacional por los catadores de los vinos, de mayor a menor.
*/
export const getProducts = async (req: Request, res: Response): Promise<Response> => {
    const products = await getRepository(Product).find({ order: { points: 'DESC' } })
    return res.json(products)
}

/*
CreateProducts: Método que devuelve una promesa, es utilizado para dar de alta productos en la tienda
Recibe una url de donde sacar los productos, y una companyid para anexarle esos productos a la compañia
Adicionalmente la estructura de datos recibidos tienen que tener la siguiente información:
    points:                number;
    title:                 string;
    description:           string;
    taster_name:           TasterName | null;
    taster_twitter_handle: TasterTwitterHandle | null;
    price:                 number | null;
    designation:           null | string;
    variety:               string;
    region_1:              null | string;
    region_2:              null | string;
    province:              string;
    country:               Country;
    winery:                string;
Se añaden a esto los campos company e image, este ultimo se trae utilizando el servicio de google images para
obtener la misma en base al titulo del producto.
Devuelve un mensaje de exito si los productos fueron insertados correctamente.
*/
export const createBaseProducts = async (req: Request, res: Response): Promise<Response> => {
    const baseURL = "https://raw.githubusercontent.com/acampopiano/wine-data-set/master/wine-data-set-test.json"
    const { companyid } = req.params
    const companyRepo = getRepository(Company)
    const company = await companyRepo.findOne({ where: { id: companyid } })
    if (!companyid) throw new Exception("Please specify a company id in url", 400)
    if (!company) throw new Exception("Company id not exist!", 400)
    const fetchProductsData = await fetch(baseURL, {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    }).then(async res => {
        if (res.status >= 400) {
            throw new Error("Bad response from server")
        }
        const responseJson = await res.json()
        return responseJson.results
    }).then(async product => {
        product.map(async (item: any, index: any) => {
            req.body.image = await image_finder.find(item.title, { size: "large" })
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
            const newProduct = getRepository(Product).create(req.body)  //Creo por cada iteración el producto
            const results = await getRepository(Product).save(newProduct) //Grabo el nuevo personaje              
        })
    }).catch(err => {
        console.error(err)
    })
    return res.json({ "message": "Products created succefully" })
}

/*
Login: Método que devuelve una promesa, es utilizado para loguear en el sitio a un usuario registrado
Recibe un usuario(email) y password, valida ambas entradas y devuelve un mensaje en caso de error, si
se obtuvo exito en la validación, verifica que el usuario exista y que la password sea la de usuario,
esta se guarda en la base de datos encriptada, por lo que se encripta la password ingresada por el usuario
y se compara con el hash de password que hay guardado en la base de datos.
Si todo ok, y si el usuario está activo, se encriptan los datos del usuario con JWT y se devuelven en un 
token, ademas de guardar una cookie de sesión.
En caso de que el usuario este inactivo, se envía un mail de activacion a su casilla.
*/
export const login = async (req: Request, res: Response): Promise<Response> => {
    let { email, password } = req.body
    if (!email) throw new Exception("Please specify an email", 400)
    if (!password) throw new Exception("Please specify a password", 400)
    if (!validateEmail(email)) throw new Exception("Please provide a valid email address", 400)
    const userRepo = getRepository(User)
    const user = await userRepo.findOne({
        where: { email }
    })
    if (!user) throw new Exception("Invalid email", 401)
    if (!user.checkIfUnencryptedPasswordIsValid(password)) throw new Exception("Invalid password", 401)
    // if (user.active == false) throw new Exception("Inactive user, please check your mailbox", 401) {
    if (user.active == false) {
        const token = jwt.sign({ user }, process.env.JWT_KEY as string, { expiresIn: process.env.JWT_TOKEN_EXPIRE_IN })
        refreshTokens.push(token)
        const userName = user.first_name + " " + user.last_name
        send_mail_activation(userName, user.email, token)
        return res.cookie('auth-token', token, { httpOnly: true, path: '/', domain: 'localhost' }).json({ "message": "Your user is not active, please check your mailbox", token })
    } else {
        const token = jwt.sign({ user }, process.env.JWT_KEY as string, { expiresIn: process.env.JWT_TOKEN_EXPIRE_IN })
        refreshTokens.push(token)
        return res.cookie('auth-token', token, { httpOnly: true, path: '/', domain: 'localhost' }).json({ token })
    }
}

export const buscarImg = async (req: Request, res: Response) => {
    const { query } = req.body
    res.json(await image_finder.find(query, { size: "large" }))
}

/*
Logout: Método que devuelve una promesa, es utilizado para desloguear un usuario del sistema, 
recibe un token, lo filtra de los tokens dados en cada login y lo elimina del sistema, devolviendo un
mensaje acorde. Tambien limpia la cookie del mismo.
*/
export const logout = async (req: Request, res: Response) => {
    const { token } = req.body
    refreshTokens = refreshTokens.filter(t => t !== token)
    res.status(202).clearCookie('auth-token').send('Success logged out')
}

// funcion para validar el formato del email
const validateEmail = (email: string) => {
    const res = /^(([^<>()[\]\\.,:\s@\"]+(\.[^<>()[\]\\.,:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
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
    return false
}

/*
ResetPassword: Método que devuelve una promesa, es utilizado para resetear la password de un usuario,
recibe el id del usuario, la password antigua y la nueva password, valida que todo este correcto y que
coincidan las password y devuelve un mensaje de password actualizada, de lo contrario tira error según corresponda
*/
export const resetPassword = async (req: Request, res: Response): Promise<Response> => {
    const { userid } = req.params
    const { oldPassword, newPassword } = req.body
    if (!userid) throw new Exception("Please specify a user id in url", 400)
    if (!oldPassword) throw new Exception("Please specify old password on your request body", 400)
    if (!newPassword) throw new Exception("Please specify new password on your request body", 400)
    if (!validatePassword(newPassword)) throw new Exception("The password you entered doesn't meet password policy requirements", 400)
    const userRepo = getRepository(User)
    const user = await userRepo.findOne({ where: { id: userid } })
    if (!user) throw new Exception("Invalid user id", 401)
    if (oldPassword.length > 20) {
        if (!user.checkIfEncryptedPasswordIsValid(oldPassword)) throw new Exception("Invalid password", 401)
    } else {
        if (!user.checkIfUnencryptedPasswordIsValid(oldPassword)) throw new Exception("Invalid password", 401)
    }
    const userPassword = new User()
    userPassword.password = newPassword
    userPassword.hashPassword()
    const results = await userRepo.update(user, userPassword).then(() => { return res.json({ "message": "Password Updated!" }) })
    return res.json(results)
}

/*
ResetPassword: Método que devuelve una promesa, es utilizado para activar un usuario,
recibe el id del usuario, valida que todo este correcto devuelve un mensaje de usuario activado, 
de lo contrario tira error según corresponda.
*/
export const activateUser = async (req: Request, res: Response): Promise<Response> => {
    const { userid } = req.params
    if (!userid) throw new Exception("Please specify a user id in url", 400)
    const userRepo = getRepository(User)
    const user = await userRepo.findOne({ where: { id: userid } })
    if (!user) throw new Exception("Invalid user id", 401)
    user.active = true
    const users = await userRepo.save(user)
    return res.json({ "message": "User activated successfully" })
}

/*
UpdateUser: Método que devuelve una promesa, es utilizado para actualizar la información del usuario
Recibe los datos básicos a actualizar del usuario, el identificador del usuario, y si lo encuentra
actualiza la base de datos, de lo contrario si hay algun dato del usuario, como por ejemplo del email que
se repitan en el sistema, le envia un mensaje de error.
*/
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
    return res.json({ "message": "User updated successfully" })
}

/*
GetUserById: Método que devuelve una promesa, es utilizado para devolver un usuario, recibe un userid y 
devuelve todos los datos del usuario menos la password.
*/
export const getUserById = async (req: Request, res: Response): Promise<Response> => {
    const user = await getRepository(User).findOne(req.params.id, { select: ["id", "first_name", "last_name", "email", "address", "phone_1", "phone_2", "date_of_birth", "active"] })
    // verificamos que exista el usuario
    if (!user) throw new Exception("There is no user with this id")
    return res.json(user)
}

/*
DeleteUser: Método que devuelve una promesa, es utilizado para borrar un usuario, recibe un user id y 
devuelve un mensaje acorde a la acción si se pudo eliminar el usuario.
*/
export const deleteUser = async (req: Request, res: Response): Promise<Response> => {
    const userRepo = getRepository(User)
    let user = await userRepo.findOne(req.params.id)
    // verificamos que exista el usuario
    if (!user) throw new Exception("There is no user with this id")
    await userRepo.delete(user)
    return res.json({ "message": "User successfully removed" })
}

/*
AddProductToCart: Método que devuelve una promesa, es utilizado para agregar un producto al carrito de 
compras, recibe el id del usuario, un producto id y una cantidad a agregar, valida que todos los datos
sean correctos incrementa la cantidad de ese producto en el carrito, y el importe del mismo, se realizan
dos acciones al recibir los datos, si el producto no existe en el carrito lo agrega y si existe lo actualiza
y devuelve un mensaje acorde a la acción solicitada.-
*/
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

/*
SubProductToCart: Método que devuelve una promesa, es utilizado para restar una cantidad de un producto
del carrito de un usuario, recibe un usuario id, un producto id y una cantidad, valida todos estos datos y resta esa cantidad de producto
en el carrito actualizando tambien el importe del mismo. Si el producto llega a cero, elimina el producto del 
carrito, y devuelve un mensaje acorde a la acción solicitada.
*/
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

/**
 * DelProductToCart: Método que devuelve una promesa, es utilizado para borrar un producto
 * del carrito de compras, recibe un id de usuario y un id de producto, valida los datos 
 * recibidos, y borra el producto del carrito del usuario, y devuelve un mensaje acorde 
 * a la acción solicitada.
 */
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

/*
GetCart: Método que devuelve una promesa, es utilizado para devolver el carrito de compras
de un usuario, recibe el usuario id, valida todos los datos y devuelve el carrito de compra
*/
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
        let total: number = 0
        const totalAmount = userCartProduct.map((item, i) => {
            return total += item.amount
        })
        return res.json({ userCartProduct, "totalCart": total })
    } else throw new Exception("The user has no products in cart", 400)
    return res.json({ "message": "Nothing to do" })
}

/*
PasswordRecovery: Método que devuelve una promesa, es utilizado para recuperar la password
de un usuario, se recibe un email, valida que exista el correo, y envia un email al usuario
con un link y token valido para que pueda resetear su contraseña. Devuelve un mensaje acorde a
la acción solicitada.
*/
export const passwordRecovery = async (req: Request, res: Response): Promise<Response> => {
    const userRepo = getRepository(User)
    const user = await userRepo.findOne({ where: { email: req.body.email } })
    if (!user) throw new Exception("Invalid email", 401)
    const token = jwt.sign({ user }, process.env.JWT_KEY as string, { expiresIn: process.env.JWT_TOKEN_EXPIRE_IN })
    refreshTokens.push(token)
    const userName = user.first_name + " " + user.last_name
    send_mail_recovery(userName, user.email, token)
    return res.json({ "message": "Please check your mailbox" })
}

/*
AddProductToFavorite: Método que devuelve una promesa, es utilizado para agregar un producto a la lista de 
favoritos del usuario, recibe un usuario id y un producto id, valida todos los datos y si el producto esta
en la lista de favoritos, no lo agrega y le avisa al usuario, sino lo agrega y avisa al usuario con un mensaje
acorde a la acción solicitada.
*/
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
    if (userFavoriteProduct) throw new Exception("Product already in user favorites!", 400)
    const oneProductToFavorite = new UserFavoriteProduct()
    oneProductToFavorite.user = user
    oneProductToFavorite.product = product
    const newProductToFavorite = getRepository(UserFavoriteProduct).create(oneProductToFavorite)
    const results = await getRepository(UserFavoriteProduct).save(newProductToFavorite).then(() => {
        return res.json({ "message": "Product added successfully to favorites" })
    })
    return res.json({ "message": "Favorite not updated" })
}

/*
GetFavorites: Método que devuelve una promesa, es utilizado para obtener la lista de favoritos del 
usuario, recibe un usuario id, valida todos los datos y devuelve la lista de productos.
*/
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
        return res.json(userFavoriteProduct)
    } else throw new Exception("User does not have favorite products")
    return res.json({ "message": "Nothing to do" })
}

/*
DelProductToFavorite: Método que devuelve una promesa, es utilizado para borrar un producto
de la lista de favoritos del usuario, recibe un usuario id y un producto id, valida los datos
recibidos, y si todo ok, borra el producto de la lista de favoritos y devuelve mensaje acorde
a la solicitud recibida.
*/
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
    if (!userFavoriteProduct) throw new Exception("Product not exists in your favorites!", 400)
    await favoriteRepo.remove(userFavoriteProduct).then(() => {
        return res.json({ "message": "Product remove successfully to favorites" })
    })
    return res.json({ "message": "Favorite not updated" })
}

/*
AddProductToTasting: Método que devuelve una promesa, es utilizado para agregar un producto a la 
lista de degustación del usuario, recibe un usuario id y un producto id, valida los datos recibidos,
de los datos obtenidos en base a los datos ingresados, se establece una fecha de comienzo y un fecha de 
fin de la degustación, la cual el usuario puede degustar hasta 3 vinos simultaneamente, a un precio 
de cada producto en base a un descuento establecido por la empresa dueña de los productos, la degustación
esta pensada para que un usuario reciba los vinos a degustar en botellas mas pequeñas y pueda decidir
si comprar el producto en su envase normal.
*/
export const addProductToTasting = async (req: Request, res: Response): Promise<Response> => {
    const { userid, productid } = req.params
    const userRepo = getRepository(User)
    const productRepo = getRepository(Product)
    const tastingRepo = getRepository(Tasting)
    const product = await productRepo.findOne({ where: { id: productid } })
    const user = await userRepo.findOne({ where: { id: userid } })
    const productToTasting: number = 3
    if (!userid) throw new Exception("Please specify a user id in url", 400)
    if (!productid) throw new Exception("Please specify a product id in url", 400)
    if (!product) throw new Exception("Product not exist!", 400)
    if (!user) throw new Exception("User not found", 400)
    const productCount = await tastingRepo.count({ where: { user, state: true } })
    if (productCount < productToTasting) {
        const userTastingProduct = await tastingRepo.findOne({
            relations: ['user', 'product'],
            where: {
                product: product,
                user: user,
                state: true
            }
        })
        if (userTastingProduct) throw new Exception("Product already in user tasting!", 400)
        let startdate = new Date()
        let enddate = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000))
        const oneProductToTasting = new Tasting()
        oneProductToTasting.user = user
        oneProductToTasting.product = product
        oneProductToTasting.start_date = startdate
        oneProductToTasting.end_date = enddate
        oneProductToTasting.price = Math.floor((product.price * product.discountTasting) / 100)
        oneProductToTasting.state = true
        const newProductToTasting = getRepository(Tasting).create(oneProductToTasting)
        const results = await getRepository(Tasting).save(newProductToTasting).then(() => {
            return res.json({ "message": "Product added successfully to Tasting!" })
        })
    } else throw new Exception("You cannot taste any more wines at the moment", 400)
    return res.json({ "message": "Tasting not updated" })
}

/*
GetTasting: Método que devuelve una promesa, es utilizada para obtener la lista de degustación
del usuario, devolviendo la lista de productos.
*/
export const getTasting = async (req: Request, res: Response): Promise<Response> => {
    const { userid } = req.params
    const userRepo = getRepository(User)
    const productRepo = getRepository(Product)
    const tastingRepo = getRepository(Tasting)
    const user = await userRepo.findOne({ where: { id: userid } })
    if (!userid) throw new Exception("Please specify a user id in url", 400)
    if (!user) throw new Exception("User not found", 400)
    const userTastingProduct = await tastingRepo.find({
        relations: ['product'],
        where: {
            user: user,
            state: true
        }
    })
    if (userTastingProduct.length) {
        return res.json(userTastingProduct)
    }
    else throw new Exception("The user is not tasting products", 400)
    return res.json({ "message": "Nothing to do" })
}

/*
CreateCompany: Método que devuelve una promesa, es utilizado para crear una compañia y 
anexarla a la tienda, recibe datos de la empresa, los valida y devuelve mensaje acorde a
la solicitud recibida.
*/
export const createCompany = async (req: Request, res: Response): Promise<Response> => {
    const { name, address, phone_1, phone_2, site_url } = req.body
    const { storeid } = req.params
    if (!name) throw new Exception("Please provide a company name")
    if (!address) throw new Exception("Please provide a address")
    if (!phone_1) throw new Exception("Please provide a phone_1")
    if (!phone_2) throw new Exception("Please provide a phone_2")
    if (!site_url) throw new Exception("Please provide a site url")
    const storeRepo = getRepository(Store)
    const companyRepo = getRepository(Company)
    const store = await storeRepo.findOne({ where: { id: storeid } })
    const company = await companyRepo.findOne({ where: { name: req.body.name, site_url: req.body.site_url } })
    if (!storeid) throw new Exception("Please specify a company id in url", 400)
    if (company) throw new Exception("Company name already exists", 400)
    if (!store) throw new Exception("Store not exists!", 400)
    let oneCompany = new Company()
    oneCompany.name = name
    oneCompany.address = address
    oneCompany.phone_1 = phone_1
    oneCompany.phone_2 = phone_2
    oneCompany.site_url = site_url
    oneCompany.store = store
    const newCompany = companyRepo.create(oneCompany)
    const results = await companyRepo.save(newCompany)
    return res.json({ "message": "Company created successfully" })
}

/*
CreateStore: Método que devuelve una promesa, es utilizado para crear una tienda, recibe
los datos básicos de la tienda, los valida y devuelve mensaje acorde a la solicitud
recibida.
*/
export const createStore = async (req: Request, res: Response): Promise<Response> => {
    const { name, address, phone_1, phone_2 } = req.body
    if (!name) throw new Exception("Please provide a company name")
    if (!address) throw new Exception("Please provide a address")
    if (!phone_1) throw new Exception("Please provide a phone_1")
    if (!phone_2) throw new Exception("Please provide a phone_2")
    const storeRepo = getRepository(Store)
    const store = await storeRepo.findOne({ where: { name: req.body.name } })
    if (store) throw new Exception("Store name already exists")
    let oneStore = new Store()
    oneStore.name = name
    oneStore.address = address
    oneStore.phone_1 = phone_1
    oneStore.phone_2 = phone_2
    const newStore = storeRepo.create(oneStore)
    const results = await storeRepo.save(newStore)
    return res.json({ "message": "Store created successfully" })
}

/*
DelProductToTasting: Método que devuelve una promesa, es utilizado para borrar un producto
de la lista de degustación del usuario, recibe un usuario id y producto id, los valida y 
borra el producto de la lista de degustación, devuelve un mensaje acorde a la solicitud
recibida.
*/
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
    if (!userFavoriteProduct) throw new Exception("Product not exists in your Tasting!", 400)
    await tastingRepo.remove(userFavoriteProduct).then(() => {
        return res.json({ "message": "Product remove successfully to tasting" })
    })
    return res.json({ "message": "Tasting not updated" })
}

/*
CreateEvent: Método que devuelve una promesa, es utilizado para crear un evento 
de degustación de un determinado producto al cual un usuario puede agendarse y 
ver la degustación de ese producto en vivo a traves de un link de zoom. Recibe 
los datos del evento, un producto id, los valida crea el evento, y devuelve
un mensaje acorde a la solicitud recibida.
*/
export const createEvent = async (req: Request, res: Response): Promise<Response> => {
    const { title, description, start_date, end_date, link_zoom } = req.body
    const { productid } = req.params
    const productRepo = getRepository(Product)
    const product = await productRepo.findOne({ where: { id: productid } })
    if (!productid) throw new Exception("Please specify a product id in url", 400)
    if (!product) throw new Exception("Product not exist!")
    if (!title) throw new Exception("Please provide a name for the event")
    if (!description) throw new Exception("Please provide a description")
    if (!start_date) throw new Exception("Please provide a start date for the event")
    if (!end_date) throw new Exception("Please provide a end date for the event")
    if (!link_zoom) throw new Exception("Please provide a link of zoom meeting")
    const eventRepo = getRepository(Event)
    const event = await eventRepo.findOne({ where: { title: title } })
    if (event) throw new Exception("Event title already exists")
    let oneEvent = new Event()
    oneEvent.title = title
    oneEvent.description = description
    oneEvent.start_date = start_date
    oneEvent.end_date = end_date
    oneEvent.link_zoom = link_zoom
    oneEvent.product = product
    const newEvent = eventRepo.create(oneEvent)
    const results = await eventRepo.save(newEvent)
    return res.json({ "message": "Event created successfully" })
}

/*
GetEvents: Método que devuelve una promesa, es utilizado para devolver una lista de eventos
y los productos que se presentaran en cada evento.
*/
export const getEvents = async (req: Request, res: Response): Promise<Response> => {
    const events = await getRepository(Event).find({
        relations: ['product']
    })
    return res.json(events)
}

/*
AddUserToEvent: Método que devuelve una promesa, es utilizado para agregar un usuario a un evento
recibe, un usuario id y un evento id, valida los datos recibidos, y añade un usuario a ese evento
devuelve un mensaje acorde a la solicitud recibida.
 */
export const addUserToEvent = async (req: Request, res: Response): Promise<Response> => {
    const { userid, eventid } = req.params
    const userRepo = getRepository(User)
    const eventRepo = getRepository(Event)
    const eventUserRepo = getRepository(EventUser)
    const event = await eventRepo.findOne({ where: { id: eventid } })
    const user = await userRepo.findOne({ where: { id: userid } })
    if (!userid) throw new Exception("Please specify a user id in url", 400)
    if (!eventid) throw new Exception("Please specify an event id in url", 400)
    if (!event) throw new Exception("Product not exist!", 400)
    if (!user) throw new Exception("User not found", 400)
    const eventUser = await eventUserRepo.findOne({
        relations: ['user', 'event'],
        where: {
            event: event,
            user: user
        }
    })
    if (eventUser) throw new Exception("User already in Event", 400)
    const oneEventUser = new EventUser()
    oneEventUser.user = user
    oneEventUser.event = event
    const newEventUser = getRepository(EventUser).create(oneEventUser)
    const results = await getRepository(EventUser).save(newEventUser).then(() => {
        return res.json({ "message": "User added successfully to Event!" })
    })
    return res.json({ "message": "EventUser not updated" })
}

/*
GetEventUser: Método que devuelve una promesa, es utilizado para obtener los eventos a los
que se inscribió un usuario, recibe un usuario id, valida los datos y devuelve una lista
de eventos del usuario.
*/
export const getEventUser = async (req: Request, res: Response): Promise<Response> => {
    const { userid } = req.params
    const userRepo = getRepository(User)
    const user = await userRepo.findOne({ where: { id: userid } })
    if (!userid) throw new Exception("Please specify a user id in url", 400)
    if (!user) throw new Exception("User not found", 400)
    const events = await getRepository(EventUser).find({
        relations: ['event', 'user'],
        where: { user: user }
    })
    return res.json(events)
}