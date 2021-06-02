"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.logout = exports.login = exports.createBaseProducts = exports.getProducts = exports.getUsers = exports.createUser = void 0;
var typeorm_1 = require("typeorm"); // getRepository"  traer una tabla de la base de datos asociada al objeto
var User_1 = require("./entities/User");
var Product_1 = require("./entities/Product");
var utils_1 = require("./utils");
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var cross_fetch_1 = __importDefault(require("cross-fetch"));
var createUser = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, first_name, last_name, email, password, address, phone_1, phone_2, date_of_birth, userRepo, user, oneUser, newUser, results;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, first_name = _a.first_name, last_name = _a.last_name, email = _a.email, password = _a.password, address = _a.address, phone_1 = _a.phone_1, phone_2 = _a.phone_2, date_of_birth = _a.date_of_birth;
                // important validations to avoid ambiguos errors, the client needs to understand what went wrong
                if (!first_name)
                    throw new utils_1.Exception("Please provide a first_name");
                if (!last_name)
                    throw new utils_1.Exception("Please provide a last_name");
                if (!email)
                    throw new utils_1.Exception("Please provide an email");
                if (!validateEmail(email))
                    throw new utils_1.Exception("Please provide a valid email address");
                if (!password)
                    throw new utils_1.Exception("Please provide a password");
                if (!address)
                    throw new utils_1.Exception("Please provide an address");
                if (!phone_1)
                    throw new utils_1.Exception("Please provide a phone_1");
                if (!phone_2)
                    throw new utils_1.Exception("Please provide a phone_2");
                if (!date_of_birth)
                    throw new utils_1.Exception("Please provide a date of birth");
                userRepo = typeorm_1.getRepository(User_1.User);
                return [4 /*yield*/, userRepo.findOne({ where: { email: email } })];
            case 1:
                user = _b.sent();
                if (user)
                    throw new utils_1.Exception("Users already exists with this email");
                oneUser = new User_1.User();
                oneUser.first_name = first_name;
                oneUser.last_name = last_name;
                oneUser.email = email;
                oneUser.password = password;
                oneUser.hashPassword();
                oneUser.address = address;
                oneUser.phone_1 = phone_1;
                oneUser.phone_2 = phone_2;
                oneUser.date_of_birth = date_of_birth;
                newUser = typeorm_1.getRepository(User_1.User).create(oneUser);
                return [4 /*yield*/, typeorm_1.getRepository(User_1.User).save(newUser)];
            case 2:
                results = _b.sent();
                return [2 /*return*/, res.json(results)];
        }
    });
}); };
exports.createUser = createUser;
var getUsers = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var users;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, typeorm_1.getRepository(User_1.User).find()];
            case 1:
                users = _a.sent();
                return [2 /*return*/, res.json(users)];
        }
    });
}); };
exports.getUsers = getUsers;
var getProducts = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var products;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, typeorm_1.getRepository(Product_1.Product).find({ order: { id: 'ASC' } })];
            case 1:
                products = _a.sent();
                return [2 /*return*/, res.json(products)];
        }
    });
}); };
exports.getProducts = getProducts;
var createBaseProducts = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var baseURL, fetchProductsData, r;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                baseURL = "https://gist.githubusercontent.com/ajubin/d331f3251db4bd239c7a1efd0af54e38/raw/058e1ad07398fc62ab7f3fcc13ef1007a48d01d7/wine-data-set.json";
                return [4 /*yield*/, cross_fetch_1["default"](baseURL, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    })
                        .then(function (res) { return __awaiter(void 0, void 0, void 0, function () {
                        var responseJson;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (res.status >= 400) {
                                        throw new Error("Bad response from server");
                                    }
                                    return [4 /*yield*/, res.json()];
                                case 1:
                                    responseJson = _a.sent();
                                    return [2 /*return*/, responseJson];
                            }
                        });
                    }); })
                        .then(function (product) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            product.map(function (item, index) { return __awaiter(void 0, void 0, void 0, function () {
                                var newProduct, results;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            req.body.points = item.points;
                                            req.body.title = item.title;
                                            req.body.description = item.description;
                                            req.body.taster_name = item.taster_name;
                                            req.body.taster_twitter_handle = item.taster_twitter_handle;
                                            req.body.price = item.price;
                                            req.body.designation = item.designation;
                                            req.body.variety = item.variety;
                                            req.body.region_1 = item.region_1;
                                            req.body.region_2 = item.region_2;
                                            req.body.province = item.province;
                                            req.body.country = item.country;
                                            req.body.image = "";
                                            req.body.winery = item.winery;
                                            newProduct = typeorm_1.getRepository(Product_1.Product).create(req.body);
                                            return [4 /*yield*/, typeorm_1.getRepository(Product_1.Product).save(newProduct)];
                                        case 1:
                                            results = _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); });
                            return [2 /*return*/];
                        });
                    }); })["catch"](function (err) {
                        console.error(err);
                    })];
            case 1:
                fetchProductsData = _a.sent();
                r = {
                    message: "All Products are created",
                    state: true
                };
                return [2 /*return*/, res.json(r)];
        }
    });
}); };
exports.createBaseProducts = createBaseProducts;
var login = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, password, userRepo, user, token;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, email = _a.email, password = _a.password;
                if (!email)
                    throw new utils_1.Exception("Please specify an email on your request body", 400);
                if (!password)
                    throw new utils_1.Exception("Please specify a password on your request body", 400);
                if (!validateEmail(email))
                    throw new utils_1.Exception("Please provide a valid email address", 400);
                userRepo = typeorm_1.getRepository(User_1.User);
                return [4 /*yield*/, userRepo.findOne({ where: { email: email } })];
            case 1:
                user = _b.sent();
                if (!user)
                    throw new utils_1.Exception("Invalid email", 401);
                if (!user.checkIfUnencryptedPasswordIsValid(password))
                    throw new utils_1.Exception("Invalid password", 401);
                token = jsonwebtoken_1["default"].sign({ user: user }, process.env.JWT_KEY, { expiresIn: process.env.JWT_TOKEN_EXPIRE_IN });
                res.cookie('currentUser', email);
                return [2 /*return*/, res.cookie('auth-token', token, { httpOnly: true, path: '/', domain: 'localhost' }).json({ user: user, token: token })];
        }
    });
}); };
exports.login = login;
var logout = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        // req.session.destroy();
        res.status(202).clearCookie('currentUser');
        res.status(202).clearCookie('auth-token').send('Success logged out');
        return [2 /*return*/];
    });
}); };
exports.logout = logout;
var validateEmail = function (email) {
    var res = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return res.test(email);
};
