import {
  BaseEntity,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"
import { PeerReviewQuestionAnswer } from "./peer_review_question_answer"
import { PeerReviewQuestionCollection } from "./peer_review_question_collection"
import { QuizAnswer } from "./quiz_answer"
import { User } from "./user"

@Entity()
export class PeerReview extends BaseEntity {
  @PrimaryGeneratedColumn("uuid") public id: string

  @ManyToOne(type => QuizAnswer, qa => qa.id)
  public quizAnswer: Promise<QuizAnswer>

  @ManyToOne(type => User, user => user.id)
  public user: Promise<User>

  @ManyToOne(type => PeerReviewQuestionCollection, prqc => prqc.id, {
    nullable: true,
  })
  public peerReviewQuestionCollection?: Promise<PeerReviewQuestionCollection>

  @ManyToMany(type => QuizAnswer, qa => qa.id)
  @JoinTable({ name: "peer_review_rejected_quiz_answers" })
  public rejectedQuizAnswers: Promise<QuizAnswer[]>

  @OneToMany(type => PeerReviewQuestionAnswer, prqa => prqa.peerReview)
  public answers: Promise<PeerReviewQuestionAnswer[]>

  @CreateDateColumn({ type: "timestamp" })
  public createdAt: Date
  @UpdateDateColumn({ type: "timestamp" })
  public updatedAt: Date
}
