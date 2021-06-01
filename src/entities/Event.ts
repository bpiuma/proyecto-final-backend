import {
    Entity, Column, PrimaryGeneratedColumn, BaseEntity, OneToMany,
} from 'typeorm';
import { EventUserProduct } from './EventUserProduct';

@Entity()
export class Event extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    description: string;

    @Column({type: 'timestamptz', nullable: false})
    start_date: Date;

    @Column({type: 'timestamptz', nullable: false})
    end_date: Date;

    @Column()
    link_zoom: string;

    @OneToMany(() => EventUserProduct, eventUserProduct => eventUserProduct.event)
    userProduct: EventUserProduct[];

}