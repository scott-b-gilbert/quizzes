import knex from "knex"
import _ from "lodash"
import { Service } from "typedi"
import { Brackets, EntityManager, SelectQueryBuilder } from "typeorm"
import { InjectManager } from "typeorm-typedi-extensions"
import {
  Course,
  PeerReview,
  PeerReviewQuestionAnswer,
  Quiz,
  QuizAnswer,
  QuizItemAnswer,
  SpamFlag,
  UserQuizState,
} from "../models"
import { randomUUID } from "../util"

@Service()
export default class PeerReviewService {
  @InjectManager()
  private entityManager: EntityManager

  public async createPeerReview(
    manager: EntityManager,
    peerReview: PeerReview,
  ) {
    return await manager.save(peerReview)
  }

  public async getPeerReviews(
    manager: EntityManager,
    quizAnswerId: string,
    onlyGrades: boolean = true,
  ) {
    let builtQuery = manager
      .createQueryBuilder(PeerReview, "peer_review")
      .innerJoinAndSelect("peer_review.answers", "peer_review_question_answer")
      .innerJoin(
        "peer_review_question_answer.peerReviewQuestion",
        "peer_review_question",
      )
      .where("peer_review.quiz_answer_id = :quizAnswerId", { quizAnswerId })

    if (onlyGrades) {
      builtQuery = builtQuery.andWhere("peer_review_question.type = :type", {
        type: "grade",
      })
    }

    return await builtQuery.getMany()
  }

  public async getPlainPeerReviewsCSV(quizId: string) {
    const builder = knex({ client: "pg" })
    let query = builder("peer_review")
      .innerJoin("quiz_answer", "quiz_answer.id", "peer_review.quiz_answer_id")
      .where("quiz_answer.quiz_id", quizId)
      .select(
        "peer_review.id",
        "peer_review.quiz_answer_id",
        "peer_review.user_id",
        "peer_review.rejected_quiz_answer_ids",
      )

    query = query.limit(1000)

    const queryRunner = this.entityManager.connection.createQueryRunner()
    queryRunner.connect()

    const data = await queryRunner.stream(query.toString())
    await queryRunner.release()
    return data
  }

  public async getPlainPeerReviewAnswers(quizId: string) {
    const builder = knex({ client: "pg" })
    let query = builder("peer_review")
      .innerJoin("quiz_answer", "quiz_answer.id", "peer_review.quiz_answer_id")
      .where("quiz_answer.quiz_id", quizId)
      .innerJoin(
        "peer_review_question_answer",
        "peer_review_question_answer.peer_review_id",
        "peer_review.id",
      )
      .select(
        { peer_review_id: "peer_review.id" },
        "peer_review_question_answer.peer_review_question_id",
        "peer_review_question_answer.value",
        "peer_review_question_answer.text",
      )

    query = query.limit(1000)
    const queryRunner = this.entityManager.connection.createQueryRunner()
    queryRunner.connect()

    const data = await queryRunner.stream(query.toString())
    await queryRunner.release()
    return data
  }

  public async getCSVData(quizId: string) {
    const builder = knex({ client: "pg" })

    let query = builder("peer_review")
      .innerJoin("quiz_answer", "quiz_answer.id", "peer_review.quiz_answer_id")
      .where("quiz_answer.quiz_id", quizId)
      .select(
        "peer_review.id",
        "peer_review.quiz_answer_id",
        "peer_review.user_id",
        "peer_review.rejected_quiz_answer_ids",
      )
      .innerJoin(
        "peer_review_question_answer",
        "peer_review_question_answer.peer_review_id",
        "peer_review.id",
      )
      .select(
        "peer_review_question_answer.peer_review_question_id",
        "peer_review_question_answer.value",
        "peer_review_question_answer.text",
      )

    query = query.limit(20000)

    const queryRunner = this.entityManager.connection.createQueryRunner()
    queryRunner.connect()

    const data = await queryRunner.stream(query.toString())
    await queryRunner.release()
    return data
  }

  public async getAnswersToReview(
    quizId: string,
    languageId: string,
    reviewerId: number,
  ): Promise<QuizAnswer[]> {
    const givenPeerReviews: PeerReview[] = await this.entityManager
      .createQueryBuilder(PeerReview, "peer_review")
      .innerJoin(
        QuizAnswer,
        "quiz_answer",
        "peer_review.quiz_answer_id = quiz_answer.id",
      )
      .where("peer_review.user_id = :reviewerId", { reviewerId })
      .andWhere("quiz_answer.quiz_id = :quizId", { quizId })
      .getMany()

    const givenSpamFlags: SpamFlag[] = await this.entityManager
      .createQueryBuilder(SpamFlag, "spam_flag")
      .where("spam_flag.user_id = :reviewerId", { reviewerId })
      .getMany()

    const rejected = [].concat(
      ...givenPeerReviews.map(pr => pr.rejectedQuizAnswerIds),
    )
    rejected.concat(givenSpamFlags.map(spamFlag => spamFlag.quizAnswerId))
    // query will fail if this array is empty
    rejected.push(randomUUID())

    const alreadyReviewed = givenPeerReviews.map(pr => pr.quizAnswerId)
    alreadyReviewed.push(randomUUID())

    let candidates: QuizAnswer[] = await this.entityManager
      .createQueryBuilder(QuizAnswer, "quiz_answer")
      .innerJoin(
        UserQuizState,
        "user_quiz_state",
        "quiz_answer.user_id = user_quiz_state.user_id and quiz_answer.quiz_id = user_quiz_state.quiz_id",
      )
      .where("quiz_answer.quiz_id = :quizId", { quizId })
      .andWhere(
        new Brackets(qb => {
          qb.where("quiz_answer.status = 'submitted'")
        }),
      )
      .andWhere("quiz_answer.user_id != :reviewerId", { reviewerId })
      .andWhere("quiz_answer.id not in (:...rejected)", { rejected })
      .andWhere("quiz_answer.id not in (:...alreadyReviewed)", {
        alreadyReviewed,
      })
      .andWhere("quiz_answer.language_id = :languageId", { languageId })
      .orderBy("quiz_answer.status")
      .addOrderBy("user_quiz_state.peer_reviews_given", "DESC")
      .addOrderBy("quiz_answer.created_at")
      .addOrderBy("user_quiz_state.peer_reviews_received")
      .limit(20)
      .getMany()

    candidates = _.shuffle(candidates)
    candidates = candidates.sort(
      (a, b): number => {
        if (a.status < b.status) {
          return 1
        } else if (a.status > b.status) {
          return -1
        } else {
          return 0
        }
      },
    )

    return candidates.slice(0, 2)
  }
}
