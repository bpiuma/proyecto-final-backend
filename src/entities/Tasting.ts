import {
    Entity, Column, PrimaryGeneratedColumn, BaseEntity, ManyToOne,
} from 'typeorm';
import { User } from './User';
import { Product } from './Product';

@Entity()
export class Tasting extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    price: number;

    @Column({type: 'timestamptz', nullable: false})
    start_date: Date;

    @Column({type: 'timestamptz', nullable: false})
    end_date: Date;

    @Column()
    state: boolean;

    @ManyToOne(() => User, user => user.tastings)
    user: User;

    @ManyToOne(() => Product, product => product.tastings)
    product: Product;

}