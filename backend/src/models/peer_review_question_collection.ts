import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"
import { Language } from "./language"
import { PeerReviewQuestion } from "./peer_review_question"
import { Quiz } from "./quiz"

@Entity()
export class PeerReviewQuestionCollection extends BaseEntity {
  @PrimaryGeneratedColumn("uuid") public id: string

  @ManyToOne(type => Quiz, quiz => quiz.id)
  public quiz: Promise<Quiz>

  @OneToMany(
    type => PeerReviewQuestionCollectionTranslation,
    prqct => prqct.peerReviewQuestionCollection,
  )
  public texts: Promise<PeerReviewQuestionCollectionTranslation[]>

  @OneToMany(type => PeerReviewQuestion, prq => prq.collection)
  public questions: Promise<PeerReviewQuestion[]>

  @CreateDateColumn({ type: "timestamp" })
  public createdAt: Date
  @UpdateDateColumn({ type: "timestamp" })
  public updatedAt: Date
}

@Entity()
export class PeerReviewQuestionCollectionTranslation extends BaseEntity {
  @ManyToOne(type => PeerReviewQuestionCollection, prqc => prqc.id, {
    primary: true,
  })
  public peerReviewQuestionCollection: string
  @ManyToOne(type => Language, lang => lang.id, { primary: true })
  public language: Promise<Language>

  @Column("text") public title: string
  @Column("text") public body: string

  @CreateDateColumn({ type: "timestamp" })
  public createdAt: Date
  @UpdateDateColumn({ type: "timestamp" })
  public updatedAt: Date
}
