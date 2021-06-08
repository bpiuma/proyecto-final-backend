import {
    Entity, Column, PrimaryGeneratedColumn, BaseEntity, PrimaryColumn, ManyToOne,
} from 'typeorm';
import { Product } from './Product';
import { User } from './User';
import { Event } from './Event';

@Entity()
export class EventUser extends BaseEntity {

    @ManyToOne(() => User, user => user.events, {primary: true})
    user: User;

    @ManyToOne(() => Event, event => event.users, {primary: true})
    event: Event;

}