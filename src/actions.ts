import { Request, Response } from 'express'
import { getRepository } from 'typeorm'  // getRepository"  traer una tabla de la base de datos asociada al objeto
import { User } from './entities/User'
import { Exception } from './utils'

// funcion para validar el formato del email
const validateEmail = (email: string) => {
    const res = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return res.test(email)
}

// funcion para validar el formato del password
const validatePassword = (pass:string) => {
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

    const newUser = userRepo.create(req.body);
    const results = await userRepo.save(newUser);
    return res.json(results);
}

export const getUsers = async (req: Request, res: Response): Promise<Response> => {
    const users = await getRepository(User).find();
    return res.json(users);
}



