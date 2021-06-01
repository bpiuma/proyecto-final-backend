import {
    Entity, Column, PrimaryGeneratedColumn, BaseEntity, ManyToOne,
} from 'typeorm';
import { User } from './User';
import { Product } from './Product';

@Entity()
export class Cart extends BaseEntity {

    @Column()
    cant: number;

    @Column()
    amount: number;

    @ManyToOne(() => User, user => user.carts, {primary: true})
    user: User;

    @ManyToOne(() => Product, product => product.carts, {primary: true})
    product: Product;

}