import {
    Entity, Column, PrimaryGeneratedColumn, BaseEntity, PrimaryColumn, ManyToOne,
} from 'typeorm';
import { Product } from './Product';
import { User } from './User';

@Entity()
export class UserFavoriteProduct extends BaseEntity {

    @ManyToOne(() => User, user => user.favorites, {primary: true})
    user: User;

    @ManyToOne(() => Product, product => product.users, {primary: true})
    product: Product;

}