import {
    Entity, Column, PrimaryGeneratedColumn, BaseEntity, OneToMany, OneToOne, JoinColumn,
} from 'typeorm';
import { EventUser } from './EventUser';
import { Product } from './Product';

@Entity()
export class Event extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique:true})
    title: string;

    @Column()
    description: string;

    @Column({type: 'timestamptz', nullable: false})
    start_date: Date;

    @Column({type: 'timestamptz', nullable: false})
    end_date: Date;

    @Column()
    link_zoom: string;

    @OneToMany(() => EventUser, eventUser => eventUser.event)
    users: EventUser[];

    @OneToOne(() => Product)
    @JoinColumn()
    product: Product;

}