import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
  RelationId,
  UpdateDateColumn,
} from "typeorm"
import { Course } from "./course"
import { User } from "./user"

@Entity()
export class UserCourseState extends BaseEntity {
  @ManyToOne(type => User, user => user.id, { primary: true })
  public user: Promise<User>
  @PrimaryColumn("int") public userId: number

  @ManyToOne(type => Course, course => course.id, { primary: true })
  public course: Promise<Course>
  @PrimaryColumn() public courseId: string

  @Column("float") public progress: number
  @Column("float") public score: number
  @Column() public completed: boolean
  @Column({ type: "timestamp", nullable: true })
  public completionDate: Date

  @CreateDateColumn({ type: "timestamp" })
  public createdAt: Date
  @UpdateDateColumn({ type: "timestamp" })
  public updatedAt: Date
}
