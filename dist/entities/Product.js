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
exports.Product = void 0;
var typeorm_1 = require("typeorm");
var Company_1 = require("./Company");
var UserFavoriteProduct_1 = require("./UserFavoriteProduct");
var Tasting_1 = require("./Tasting");
var Cart_1 = require("./Cart");
var EventUserProduct_1 = require("./EventUserProduct");
var Product = /** @class */ (function (_super) {
    __extends(Product, _super);
    function Product() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    __decorate([
        typeorm_1.PrimaryGeneratedColumn(),
        __metadata("design:type", Number)
    ], Product.prototype, "id");
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", Number)
    ], Product.prototype, "points");
    __decorate([
        typeorm_1.Column({ unique: true }),
        __metadata("design:type", String)
    ], Product.prototype, "title");
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", String)
    ], Product.prototype, "description");
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", String)
    ], Product.prototype, "taster_name");
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", String)
    ], Product.prototype, "taster_twitter_handle");
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", Number)
    ], Product.prototype, "price");
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", String)
    ], Product.prototype, "designation");
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", String)
    ], Product.prototype, "variety");
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", String)
    ], Product.prototype, "region_1");
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", String)
    ], Product.prototype, "region_2");
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", String)
    ], Product.prototype, "province");
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", String)
    ], Product.prototype, "country");
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", String)
    ], Product.prototype, "winery");
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", String)
    ], Product.prototype, "image");
    __decorate([
        typeorm_1.ManyToOne(function () { return Company_1.Company; }, function (company) { return company.products; }),
        __metadata("design:type", Company_1.Company)
    ], Product.prototype, "company");
    __decorate([
        typeorm_1.OneToMany(function () { return UserFavoriteProduct_1.UserFavoriteProduct; }, function (userFavoriteProduct) { return userFavoriteProduct.product; }),
        __metadata("design:type", Array)
    ], Product.prototype, "users");
    __decorate([
        typeorm_1.OneToMany(function () { return Tasting_1.Tasting; }, function (tasting) { return tasting.product; }),
        __metadata("design:type", Array)
    ], Product.prototype, "tastings");
    __decorate([
        typeorm_1.OneToMany(function () { return Cart_1.Cart; }, function (cart) { return cart.product; }),
        __metadata("design:type", Array)
    ], Product.prototype, "carts");
    __decorate([
        typeorm_1.OneToMany(function () { return EventUserProduct_1.EventUserProduct; }, function (eventUserProduct) { return eventUserProduct.product; }),
        __metadata("design:type", Array)
    ], Product.prototype, "eventUser");
    Product = __decorate([
        typeorm_1.Entity()
    ], Product);
    return Product;
}(typeorm_1.BaseEntity));
exports.Product = Product;
