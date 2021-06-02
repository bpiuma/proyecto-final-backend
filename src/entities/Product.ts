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

    @Column({nullable: true })
    points: number;

    @Column({ unique: false, nullable: true })
    title: string;

    @Column({nullable: true })
    description: string;

    @Column({nullable: true })
    taster_name: string;

    @Column({nullable: true })
    taster_twitter_handle: string;

    @Column({nullable: true })
    price: number;

    @Column({nullable: true })
    designation: string;

    @Column({nullable: true })
    variety: string;

    @Column({nullable: true })
    region_1: string;

    @Column({nullable: true })
    region_2: string;

    @Column({nullable: true })
    province: string;

    @Column({nullable: true })
    country: string;

    @Column({nullable: true })
    winery: string;

    @Column({nullable: true })
    image: string;

    @ManyToOne(() => Company, company => company.products)
    company: Company;

    @OneToMany(() => UserFavoriteProduct, userFavoriteProduct => userFavoriteProduct.product,{cascade: true})
    users: UserFavoriteProduct[];

    @OneToMany(() => Tasting, tasting => tasting.product,{cascade: true})
    tastings: Tasting[];

    @OneToMany(() => Cart, cart => cart.product,{cascade: true})
    carts: Cart[];

    @OneToMany(() => EventUserProduct, eventUserProduct => eventUserProduct.product,{cascade: true})
    eventUser: EventUserProduct[];

}