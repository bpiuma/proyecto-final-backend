"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var express_1 = require("express");
var utils_1 = require("./utils");
var actions = __importStar(require("./actions"));
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var verifyToken = function (req, res, next) {
    var token = req.header('Authorization');
    if (!token)
        return res.status(400).json('ACCESS DENIED');
    if (!actions.refreshTokens.includes(token))
        return res.status(403).json("INVALID TOKEN");
    var decoded = jsonwebtoken_1["default"].verify(token, process.env.JWT_KEY);
    req.user = decoded;
    console.log(decoded);
    next();
};
// declare a new router to include all the endpoints
var router = express_1.Router();
router.get('/user', verifyToken, utils_1.safe(actions.getUsers));
router.post('/product/add/company/:companyid', verifyToken, utils_1.safe(actions.createBaseProducts));
router.post('/store', verifyToken, utils_1.safe(actions.createStore));
router.post('/company/add/store/:storeid', verifyToken, utils_1.safe(actions.createCompany));
router["delete"]('/logout', verifyToken, utils_1.safe(actions.logout));
router.put('/user/:userid/resetPassword', verifyToken, utils_1.safe(actions.resetPassword));
router.put('/user/:userid/activateUser', verifyToken, utils_1.safe(actions.activateUser));
router.put('/user/:id', verifyToken, utils_1.safe(actions.updateUser));
router.get('/user/:id', verifyToken, utils_1.safe(actions.getUserById));
router["delete"]('/user/:id', verifyToken, utils_1.safe(actions.deleteUser));
router.post('/cart/add/user/:userid/product/:productid', verifyToken, utils_1.safe(actions.addProductToCart));
router.post('/cart/substract/user/:userid/product/:productid', verifyToken, utils_1.safe(actions.subProductToCart));
router["delete"]('/cart/delete/user/:userid/product/:productid', verifyToken, utils_1.safe(actions.delProductToCart));
router.get('/cart/user/:userid', verifyToken, utils_1.safe(actions.getCart));
router["delete"]('/cart/user/:userid', verifyToken, utils_1.safe(actions.emptyCart));
router.post('/favorite/add/user/:userid/product/:productid', verifyToken, utils_1.safe(actions.addProductToFavorite));
router.get('/favorite/user/:userid', verifyToken, utils_1.safe(actions.getFavorites));
router["delete"]('/favorite/delete/user/:userid/product/:productid', verifyToken, utils_1.safe(actions.delProductToFavorite));
router.post('/tasting/add/user/:userid/product/:productid', verifyToken, utils_1.safe(actions.addProductToTasting));
router.get('/tasting/user/:userid', verifyToken, utils_1.safe(actions.getTasting));
router["delete"]('/tasting/delete/user/:userid/product/:productid', verifyToken, utils_1.safe(actions.delProductToTasting));
router.post('/event/product/:productid', verifyToken, utils_1.safe(actions.createEvent));
router.post('/event/add/:eventid/user/:userid', verifyToken, utils_1.safe(actions.addUserToEvent));
router.get('/event/user/:userid', verifyToken, utils_1.safe(actions.getEventUser));
exports["default"] = router;
