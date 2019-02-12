import {
  Course,
  PeerReview,
  PeerReviewQuestionAnswer,
  Quiz,
  QuizAnswer,
  QuizItem,
  QuizItemAnswer,
  UserQuizState,
} from "@quizzes/common/models"
import { IQuizAnswerQuery } from "@quizzes/common/types"
import { Inject, Service } from "typedi"
import { EntityManager, SelectQueryBuilder } from "typeorm"
import { InjectManager } from "typeorm-typedi-extensions"
import PeerReviewService from "./peerreview.service"

@Service()
export default class ValidationService {
  @Inject()
  private peerReviewService: PeerReviewService

  public validateQuizAnswer(
    quizAnswer: QuizAnswer,
    quiz: Quiz,
    userState: UserQuizState,
  ) {
    const userQuizState = userState || new UserQuizState()
    const items: QuizItem[] = quiz.items
    let points: number | null = null
    let normalizedPoints
    const itemAnswerStatus = items.map(item => {
      const itemAnswer = quizAnswer.itemAnswers.find(
        (ia: QuizItemAnswer) => ia.quizItemId === item.id,
      )
      const itemTranslation = item.texts.find(
        text => text.languageId === quizAnswer.languageId,
      )
      let itemStatusObject: any
      let optionAnswerStatus
      let correct = false

      switch (item.type) {
        case "essay":
          console.log("essay")
          quizAnswer.status = "submitted"
          userQuizState.peerReviewsReceived = 0
          userQuizState.peerReviewsGiven = userQuizState.peerReviewsGiven || 0
          userQuizState.spamFlags = 0
          itemStatusObject = {}
          break
        case "open":
          console.log("open")
          const validator = new RegExp(item.validityRegex)
          if (validator.test(itemAnswer.textData)) {
            points += 1
            correct = true
          }
          itemStatusObject = {
            correct,
            submittedAnswer: itemAnswer.textData,
            message: correct
              ? itemTranslation.successMessage
              : itemTranslation.failureMessage,
          }
          break
        case "radio":
          console.log("radio")
          optionAnswerStatus = item.options.map(option => {
            const optionAnswer = itemAnswer.optionAnswers.find(
              (oa: any) => oa.quizOptionId === option.id,
            )
            const optionTranslation = option.texts.find(
              text => text.languageId === quizAnswer.languageId,
            )
            return {
              optionId: option.id,
              selected: optionAnswer ? true : false,
              correctAnswer: option.correct,
              message:
                optionAnswer && option.correct
                  ? optionTranslation.successMessage
                  : optionTranslation.failureMessage,
            }
          })
          if (
            item.multi &&
            optionAnswerStatus.filter(oas => oas.selected !== oas.correctAnswer)
              .length === 0
          ) {
            correct = true
            points += 1
          } else if (
            !item.multi &&
            optionAnswerStatus.some(oas => oas.selected && oas.correctAnswer)
          ) {
            correct = true
            points += 1
          }
          itemStatusObject = {
            correct,
            message: correct
              ? itemTranslation.successMessage
              : itemTranslation.failureMessage,
            options: optionAnswerStatus,
          }
          break
        case "scale":
          console.log("scale")
          itemStatusObject = {
            value: itemAnswer.intData,
          }
          break
        case "checkbox":
        case "research-agreement":
          console.log("other")
          optionAnswerStatus = item.options.map(option => {
            const optionAnswer = itemAnswer.optionAnswers.find(
              (oa: any) => oa.quizOptionId === option.id,
            )
            return {
              optionId: option.id,
              selected: optionAnswer ? true : false,
            }
          })
          itemStatusObject = {
            options: optionAnswerStatus,
          }
          break
      }

      itemStatusObject.itemId = item.id
      itemAnswer.correct = correct

      return itemStatusObject
    })

    normalizedPoints = points != null ? points / items.length : null
    quizAnswer.status = quizAnswer.status || "confirmed"

    userQuizState.userId = quizAnswer.userId
    userQuizState.quizId = quizAnswer.quizId
    userQuizState.points =
      userQuizState.points > points ? userQuizState.points : points
    userQuizState.normalizedPoints =
      userQuizState.normalizedPoints > normalizedPoints
        ? userQuizState.normalizedPoints
        : normalizedPoints
    userQuizState.tries = userQuizState.tries ? userQuizState.tries + 1 : 1
    userQuizState.status = "locked"

    const response = {
      itemAnswerStatus,
    }

    return { response, quizAnswer, userQuizState }
  }

  public async validateEssayAnswer(
    manager: EntityManager,
    quiz: Quiz,
    quizAnswer: QuizAnswer,
    userQuizState: UserQuizState,
  ) {
    const course: Course = quiz.course
    const given: number = userQuizState.peerReviewsGiven
    const received: number = userQuizState.peerReviewsReceived
    if (
      quizAnswer.status === "submitted" &&
      userQuizState.spamFlags > course.maxSpamFlags
    ) {
      quizAnswer.status = "spam"
      userQuizState.spamFlags = null
      userQuizState.status = "open"
    } else if (
      quizAnswer &&
      given >= course.minPeerReviewsGiven &&
      received >= course.minPeerReviewsReceived
    ) {
      const peerReviews = await this.peerReviewService.getPeerReviews(
        manager,
        quizAnswer.id,
      )
      let sadFaces: number = 0
      let total: number = 0
      peerReviews.map(pr => {
        pr.answers.map(answer => {
          if (answer.value === 1) {
            sadFaces += 1
          }
          total += 1
        })
      })
      if (sadFaces / total <= course.maxNegativeReviewPercentage) {
        quizAnswer.status = "confirmed"
        userQuizState.points = 1
        userQuizState.normalizedPoints = 1
      } else {
        quizAnswer.status = "rejected"
        userQuizState.points = 0
        userQuizState.normalizedPoints = 0
        userQuizState.status = "open"
      }
    }
    return { quizAnswer, userQuizState }
  }

  public async checkForDeprecated(
    manager: EntityManager,
    quizAnswer: QuizAnswer,
  ) {
    const answers: QuizAnswer[] = await manager
      .createQueryBuilder(QuizAnswer, "quizAnswer")
      .where("user_id = :userId and quiz_id = :quizId", {
        userId: quizAnswer.userId,
        quizId: quizAnswer.quizId,
      })
      .getMany()
    await Promise.all(
      answers.map(async (answer: QuizAnswer) => {
        if (answer.status !== "deprecated") {
          answer.status = "deprecated"
          manager.save(answer)
        }
      }),
    )
  }
}