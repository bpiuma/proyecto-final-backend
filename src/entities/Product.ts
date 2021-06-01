import {
    Entity, Column, PrimaryGeneratedColumn, BaseEntity, ManyToOne, OneToMany,
} from 'typeorm';
import { Company } from './Company';
import { UserFavoriteProduct } from './UserFavoriteProduct';
import { Tasting } from './Tasting';
import { Cart } from './Cart';
import { EventUserProduct } from './EventUserProduct';

@Entity()
export class Product extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    points: number;

    @Column({ unique: true })
    title: string;

    @Column()
    description: string;

    @Column()
    taster_name: string;

    @Column()
    taster_twitter_handle: string;

    @Column()
    price: number;

    @Column()
    designation: string;

    @Column()
    variety: string;

    @Column()
    region_1: string;

    @Column()
    region_2: string;

    @Column()
    province: string;

    @Column()
    country: string;

    @Column()
    winery: string;

    @Column()
    image: string;

    @ManyToOne(() => Company, company => company.products)
    company: Company;

    @OneToMany(() => UserFavoriteProduct, userFavoriteProduct => userFavoriteProduct.product)
    users: UserFavoriteProduct[];

    @OneToMany(() => Tasting, tasting => tasting.product)
    tastings: Tasting[];

    @OneToMany(() => Cart, cart => cart.product)
    carts: Cart[];

    @OneToMany(() => EventUserProduct, eventUserProduct => eventUserProduct.product)
    eventUser: EventUserProduct[];

}