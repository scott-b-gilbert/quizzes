import db, { Database } from "@quizzes/common/config/database"
import {
  Course,
  PeerReviewQuestion,
  PeerReviewQuestionTranslation,
  Quiz,
  QuizItem,
  QuizItemTranslation,
  QuizOption,
  QuizOptionTranslation,
  QuizTranslation,
} from "@quizzes/common/models"
import {
  INewPeerReviewQuestion,
  INewQuizItem,
  INewQuizItemTranslation,
  INewQuizOption,
  INewQuizOptionTranslation,
  INewQuizQuery,
  INewQuizTranslation,
  IQuizQuery,
} from "@quizzes/common/types"
import { getUUIDByString, insert, randomUUID } from "@quizzes/common/util"
import _ from "lodash"
import { Service, Container } from "typedi"
import { InjectManager } from "typeorm-typedi-extensions"
import {
  BaseEntity,
  Brackets,
  EntityManager,
  getManager,
  InsertResult,
  PromiseUtils,
  SelectQueryBuilder,
  TransactionManager,
  AdvancedConsoleLogger,
  QueryBuilder,
} from "typeorm"
import { QueryPartialEntity } from "typeorm/query-builder/QueryPartialEntity"
import quizanswerService from "./quizanswer.service"

@Service()
export class QuizService {
  @InjectManager()
  private entityManager: EntityManager

  public async getQuizzes(query: IQuizQuery): Promise<Quiz[]> {
    const { id, language } = query

    const queryBuilder: SelectQueryBuilder<
      Quiz
    > = this.entityManager.createQueryBuilder(Quiz, "quiz")

    queryBuilder.leftJoinAndSelect(
      "quiz.texts",
      "quiz_translation",
      language ? "quiz_translation.language_id = :language" : "",
      { language },
    )

    this.queryCourse(queryBuilder, query)
    this.queryItems(queryBuilder, query)
    this.queryPeerReviews(queryBuilder, query)

    if (id) {
      queryBuilder.where("quiz.id = :id", { id })
    }

    return await queryBuilder.getMany()
    /*       .then(
        async (quizzes: Quiz[]) =>
          await Promise.all(
            quizzes.map(async (q: Quiz) => this.stripQuiz(q, query)),
          ),
      ) */
  }

  public async createQuiz(quiz: Quiz): Promise<Quiz> {
    const newQuiz: Quiz = await this.entityManager.save(quiz)

    if (newQuiz) {
      // test: ^ does not always return all?
      const updatedQuiz: Quiz[] = await Quiz.find({ id: newQuiz.id })

      return updatedQuiz[0]
    }

    return newQuiz
  }

  public async updateQuiz(quiz: Quiz): Promise<Quiz> {
    return await this.entityManager.save(quiz)
  }

  public async deleteQuiz(id: string): Promise<boolean> {
    try {
      await this.entityManager.delete(Quiz, { id })

      return true
    } catch {
      return false
    }
  }

  private queryPeerReviews(
    queryBuilder: SelectQueryBuilder<Quiz>,
    query: IQuizQuery,
  ) {
    const { peerreviews, language } = query

    if (!peerreviews) {
      return
    }
    queryBuilder
      .leftJoinAndSelect("quiz.peerReviewQuestions", "peer_review_question")
      .leftJoinAndSelect(
        "peer_review_question.texts",
        "peer_review_question_translation",
      )

    if (language) {
      queryBuilder.andWhere(
        new Brackets(qb => {
          qb.where("peer_review_question_translation.language_id = :language", {
            language,
          }).orWhere("peer_review_question_translation is null")
        }),
      )
    }
  }

  private queryOptions(
    queryBuilder: SelectQueryBuilder<Quiz>,
    query: IQuizQuery,
  ) {
    const { options, language } = query

    if (!options) {
      return
    }

    queryBuilder
      .leftJoinAndSelect("quiz_item.options", "quiz_option")
      .leftJoinAndSelect("quiz_option.texts", "quiz_option_translation")
      .andWhere(
        language
          ? new Brackets(qb => {
              qb.where("quiz_option_translation.language_id = :language", {
                language,
              }).orWhere("quiz_option_translation.language_id is null")
            })
          : "",
      )
  }

  private queryItems(
    queryBuilder: SelectQueryBuilder<Quiz>,
    query: IQuizQuery,
  ) {
    const { items, options, language } = query

    if (!items || !language) {
      return
    }

    queryBuilder
      .leftJoinAndSelect("quiz.items", "quiz_item")
      .leftJoinAndSelect("quiz_item.texts", "quiz_item_translation")
      .andWhere(
        language
          ? new Brackets(qb => {
              qb.where("quiz_item_translation.language_id = :language", {
                language,
              }).orWhere("quiz_item_translation.language_id is null")
            })
          : "",
      )

    if (options) {
      this.queryOptions(queryBuilder, query)
    }
  }

  private queryCourse(
    queryBuilder: SelectQueryBuilder<Quiz>,
    query: IQuizQuery,
  ) {
    const { course, courseId, courseAbbreviation, language } = query

    if (!course) {
      return
    }

    queryBuilder
      .innerJoinAndSelect(
        "quiz.course",
        "course",
        courseId ? "course.id = :courseId" : "",
        { courseId },
      )
      .innerJoinAndSelect(
        "course.texts",
        "course_translation",
        courseAbbreviation
          ? "course_translation.abbreviation = :courseAbbreviation"
          : "",
        { courseAbbreviation },
      )
      .innerJoinAndSelect(
        "course.languages",
        "language",
        language ? "language.id = :language" : "",
        { language },
      )
      .andWhere(
        language
          ? new Brackets(qb => {
              qb.where("course_translation.language_id = :language", {
                language,
              }).orWhere("course_translation.language_id is null")
            })
          : "",
      )
  }

  private async stripQuiz(quiz: Quiz, options: IQuizQuery): Promise<Quiz> {
    await quiz.course

    if (options.language) {
      quiz.texts = quiz.texts.filter(t => t.languageId === options.language)
    }

    if (options.items) {
      if (!options.options) {
        ;(quiz.items || []).forEach(item => {
          item.options = []
        })
      }

      if (options.language) {
        ;(quiz.items || []).forEach(item => {
          item.texts = item.texts.filter(t => t.languageId === options.language)
          item.options.forEach(
            option =>
              (option.texts = option.texts.filter(
                t => t.languageId === options.language,
              )),
          )
        })
      }
    } else {
      quiz.items = []
    }

    return await quiz
  }
}

export default QuizService
