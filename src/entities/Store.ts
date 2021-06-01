import {
    Entity, Column, PrimaryGeneratedColumn, BaseEntity, OneToMany,
} from 'typeorm';
import { Company } from './Company';

@Entity()
export class Store extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    address: string;

    @OneToMany(() => Company, company => company.store)
    companies: Company[];

}