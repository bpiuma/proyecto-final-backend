import {
    Entity, Column, PrimaryGeneratedColumn, BaseEntity, OneToMany,
} from 'typeorm';
import { UserFavoriteProduct } from './UserFavoriteProduct';
import { Tasting } from './Tasting';
import { Cart } from './Cart';
import { EventUserProduct } from './EventUserProduct';
import * as bcrypt from 'bcryptjs';
import { Length, IsNotEmpty } from "class-validator";

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    first_name: string;

    @Column()
    last_name: string;

    @Column({ unique: true })
    email: string;

    @Column()
    @Length(4, 100)
    password: string;
    hashPassword() {
        this.password = bcrypt.hashSync(this.password, 8);
    }

    checkIfUnencryptedPasswordIsValid(unencryptedPassword: string) {
        return bcrypt.compareSync(unencryptedPassword, this.password);
    }
    @Column()
    address: string;

    @Column()
    phone_1: number;

    @Column()
    phone_2: number;

    @Column({ type: 'timestamptz', nullable: false })
    date_of_birth: Date;

    @OneToMany(() => UserFavoriteProduct, userFavoriteProduct => userFavoriteProduct.user)
    favorites: UserFavoriteProduct[];

    @OneToMany(() => Tasting, tasting => tasting.product)
    tastings: Tasting[];

    @OneToMany(() => Cart, cart => cart.user)
    carts: Cart[];

    @OneToMany(() => EventUserProduct, eventUserProduct => eventUserProduct.user)
    eventProduct: EventUserProduct[];    
}