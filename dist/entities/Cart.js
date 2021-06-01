"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
exports.__esModule = true;
exports.Cart = void 0;
var typeorm_1 = require("typeorm");
var User_1 = require("./User");
var Product_1 = require("./Product");
var Cart = /** @class */ (function (_super) {
    __extends(Cart, _super);
    function Cart() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", Number)
    ], Cart.prototype, "cant");
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", Number)
    ], Cart.prototype, "amount");
    __decorate([
        typeorm_1.ManyToOne(function () { return User_1.User; }, function (user) { return user.carts; }, { primary: true }),
        __metadata("design:type", User_1.User)
    ], Cart.prototype, "user");
    __decorate([
        typeorm_1.ManyToOne(function () { return Product_1.Product; }, function (product) { return product.carts; }, { primary: true }),
        __metadata("design:type", Product_1.Product)
    ], Cart.prototype, "product");
    Cart = __decorate([
        typeorm_1.Entity()
    ], Cart);
    return Cart;
}(typeorm_1.BaseEntity));
exports.Cart = Cart;
