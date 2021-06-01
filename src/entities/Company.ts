import {
    Entity, Column, PrimaryGeneratedColumn, BaseEntity, OneToMany, ManyToOne,
} from 'typeorm';
import { Product } from './Product';
import { Store } from './Store';

@Entity()
export class Company extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column()
    address: string;

    @Column()
    phone_1: number;

    @Column()
    phone_2: number;

    @Column()
    site_url: string;

    @OneToMany(() => Product, product => product.company)
    products: Product[];

    @ManyToOne(() => Store, store => store.companies)
    store: Store;

}