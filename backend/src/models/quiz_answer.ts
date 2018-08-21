import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from "typeorm"
import { Language } from "./language"
import { PeerReview } from "./peer_review"
import { Quiz } from "./quiz"
import { User } from "./user"

@Entity()
export class QuizAnswer extends BaseEntity {
  @PrimaryGeneratedColumn("uuid") public id: string

  @ManyToOne(type => Quiz, quiz => quiz.id)
  public quiz: Quiz
  @Column() public quizId: string

  @ManyToOne(type => User, user => user.id)
  public user: User
  @Column("int") public userId: number

  @ManyToOne(type => Language, lang => lang.id)
  public language: Language
  @Column() public languageId: string

  @Column({
    type: "enum",
    enum: ["draft", "submitted", "spam", "confirmed", "rejected", "deprecated"],
  })
  public status: string

  @OneToMany(type => PeerReview, pr => pr.quizAnswer, { lazy: true })
  public peerReviews: Promise<PeerReview[]>

  @CreateDateColumn({ type: "timestamp" })
  public createdAt: Date
  @UpdateDateColumn({ type: "timestamp" })
  public updatedAt: Date
}
