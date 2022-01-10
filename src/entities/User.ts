import { Entity, Property, PrimaryKey } from "@mikro-orm/core";
import { Field, Int, ObjectType } from "type-graphql";

@ObjectType()
@Entity()
export class User {
    @Field(() => Int)
    @PrimaryKey()
    id!: number;

    @Field(() => String)
    @Property({ type: "date" })
    createdAt: Date = new Date();

    @Field(() => String)
    @Property({ type: "date", onUpdate: () => new Date() })
    updatedAt: Date = new Date();

    @Field()
    @Property({ type: "text", unique: true })
    username!: string;

    // @Field() - removing field property prevents frontend exposure
    @Property({ type: "text" })
    password!: string;
}
