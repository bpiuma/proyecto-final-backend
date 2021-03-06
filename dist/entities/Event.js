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
exports.Event = void 0;
var typeorm_1 = require("typeorm");
var EventUser_1 = require("./EventUser");
var Product_1 = require("./Product");
var Event = /** @class */ (function (_super) {
    __extends(Event, _super);
    function Event() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    __decorate([
        typeorm_1.PrimaryGeneratedColumn(),
        __metadata("design:type", Number)
    ], Event.prototype, "id");
    __decorate([
        typeorm_1.Column({ unique: true }),
        __metadata("design:type", String)
    ], Event.prototype, "title");
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", String)
    ], Event.prototype, "description");
    __decorate([
        typeorm_1.Column({ type: 'timestamptz', nullable: false }),
        __metadata("design:type", Date)
    ], Event.prototype, "start_date");
    __decorate([
        typeorm_1.Column({ type: 'timestamptz', nullable: false }),
        __metadata("design:type", Date)
    ], Event.prototype, "end_date");
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", String)
    ], Event.prototype, "link_zoom");
    __decorate([
        typeorm_1.OneToMany(function () { return EventUser_1.EventUser; }, function (eventUser) { return eventUser.event; }),
        __metadata("design:type", Array)
    ], Event.prototype, "users");
    __decorate([
        typeorm_1.OneToOne(function () { return Product_1.Product; }),
        typeorm_1.JoinColumn(),
        __metadata("design:type", Product_1.Product)
    ], Event.prototype, "product");
    Event = __decorate([
        typeorm_1.Entity()
    ], Event);
    return Event;
}(typeorm_1.BaseEntity));
exports.Event = Event;
