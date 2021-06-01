import {
    Entity, Column, PrimaryGeneratedColumn, BaseEntity, PrimaryColumn, ManyToOne,
} from 'typeorm';
import { Product } from './Product';
import { User } from './User';
import { Event } from './Event';

@Entity()
export class EventUserProduct extends BaseEntity {

    @ManyToOne(() => User, user => user.eventProduct, {primary: true})
    user: User;

    @ManyToOne(() => Product, product => product.eventUser, {primary: true})
    product: Product;

    @ManyToOne(() => Event, event => event.userProduct, {primary: true})
    event: Event;

}