import { Connection } from "typeorm"
import {
  Course,
  Quiz,
  QuizItem,
  QuizItemTranslation,
  QuizOption,
  QuizOptionTranslation,
  QuizTranslation,
} from "../../models"
import { Quiz as QNQuiz } from "./app-modules/models"

import oldQuizTypes from "./app-modules/constants/quiz-types"
import { getUUIDByString, progressBar, safeGet } from "./util"

export async function migrateQuizzes(courses: {
  [key: string]: Course
}): Promise<{ [quizID: string]: Quiz }> {
  const eaiRegex = /ai_([0-9])_([0-9])/

  console.log("Querying quizzes...")
  const oldQuizzes = await QNQuiz.find({
    type: {
      $in: [
        oldQuizTypes.ESSAY,
        oldQuizTypes.OPEN,
        oldQuizTypes.MULTIPLE_OPEN,
        oldQuizTypes.MULTIPLE_CHOICE,
        oldQuizTypes.RADIO_MATRIX,
      ],
    },
  })
  const bar = progressBar("Migrating quizzes", oldQuizzes.length)
  const newQuizzes: { [quizID: string]: Quiz } = {}
  for (const oldQuiz of oldQuizzes) {
    let part = 0
    let section = 0
    let excludedFromScore = false
    let course: Course
    for (const tag of oldQuiz.tags) {
      if (tag === "ignore") {
        excludedFromScore = true
        continue
      }

      if (tag in courses) {
        course = courses[tag]
        continue
      }

      const match = tag.match(eaiRegex)
      if (match) {
        part = parseInt(match[1], 10)
        section = parseInt(match[2], 10)
      }
    }
    if (!course) {
      bar.tick()
      continue
    }

    try {
      const quiz = await migrateQuiz(
        course,
        oldQuiz,
        part,
        section,
        excludedFromScore,
      )
      newQuizzes[quiz.id] = quiz
      bar.tick()
    } catch (e) {
      console.error(
        "Failed to migrate quiz",
        require("util").inspect(oldQuiz, false, null),
      )
      throw e
    }
  }
  return newQuizzes
}

export async function migrateQuiz(
  course: Course,
  oldQuiz: { [key: string]: any },
  part: number,
  section: number = null,
  excludedFromScore: boolean = false,
): Promise<Quiz> {
  const language = course.languages[0]
  const quiz = Quiz.create({
    id: getUUIDByString(oldQuiz._id),
    course,
    part,
    section,
    excludedFromScore,
    createdAt: oldQuiz.createdAt,
    updatedAt: oldQuiz.updatedAt,
  })
  await quiz.save()
  quiz.texts = [
    QuizTranslation.create({
      quiz: quiz.id,
      language,
      title: oldQuiz.title || "",
      body: oldQuiz.body || "",
      submitMessage: safeGet(() => oldQuiz.data.meta.submitMessage),
      createdAt: oldQuiz.createdAt,
      updatedAt: oldQuiz.updatedAt,
    }),
  ]
  await quiz.texts[0].save()

  let item: QuizItem
  let order: number
  let choiceOrder: number
  const meta = safeGet(() => oldQuiz.data.meta, {})
  const rightAnswer = safeGet(() => meta.rightAnswer)
  const successes = safeGet(() => meta.successes)
  const errors = safeGet(() => meta.errors)
  const items = safeGet(() => oldQuiz.data.items, [])
  const choices = safeGet(() => oldQuiz.data.choices, [])
  switch (oldQuiz.type) {
    case oldQuizTypes.ESSAY:
    case oldQuizTypes.OPEN:
      item = QuizItem.create({
        id: getUUIDByString(oldQuiz._id),
        quiz,
        type: oldQuiz.type === oldQuizTypes.ESSAY ? "essay" : "open",
        validityRegex: rightAnswer,
        order: 0,
        createdAt: oldQuiz.createdAt,
        updatedAt: oldQuiz.updatedAt,
      })
      await item.save()
      item.texts = [
        QuizItemTranslation.create({
          quizItem: item.id,
          language,
          successMessage: meta.success || "",
          failureMessage: meta.error || "",
          title: "",
          body: "",
        }),
      ]
      await item.texts[0].save()
      break

    case oldQuizTypes.MULTIPLE_OPEN:
      order = 0
      for (const oldItem of items) {
        item = QuizItem.create({
          id: getUUIDByString(oldQuiz.id + oldItem.id),
          quiz,
          type: "open",
          validityRegex: rightAnswer[oldItem.id],
          order: order++,
          createdAt: oldQuiz.createdAt,
          updatedAt: oldQuiz.updatedAt,
        })
        await item.save()
        item.texts = [
          QuizItemTranslation.create({
            quizItem: item.id,
            language,
            successMessage: meta.success || "",
            failureMessage: meta.error || "",
            title: oldItem.title || "",
            body: oldItem.body || "",
          }),
        ]
        await item.texts[0].save()
      }
      break

    case oldQuizTypes.MULTIPLE_CHOICE:
      item = QuizItem.create({
        id: getUUIDByString(oldQuiz._id),
        quiz,
        type: "multiple-choice",
        order: 0,
        createdAt: oldQuiz.createdAt,
        updatedAt: oldQuiz.updatedAt,
      })
      await item.save()
      item.texts = [
        QuizItemTranslation.create({
          quizItem: item.id,
          language,
          title: "",
          body: "",
          successMessage: meta.success || "",
          failureMessage: meta.error || "",
        }),
      ]
      await item.texts[0].save()
      choiceOrder = 0
      for (const oldChoice of items) {
        const option = QuizOption.create({
          id: getUUIDByString(oldQuiz.id + oldChoice.id),
          quizItem: item,
          order: choiceOrder++,
          correct:
            rightAnswer === oldChoice.id || rightAnswer.includes(oldChoice.id),
          createdAt: oldQuiz.createdAt,
          updatedAt: oldQuiz.updatedAt,
        })
        await option.save()
        option.texts = [
          QuizOptionTranslation.create({
            quizOption: option.id,
            language,
            successMessage: meta.success || "",
            failureMessage: meta.error || "",
            title: oldChoice.title || "",
            body: oldChoice.body || "",
          }),
        ]
        await option.texts[0].save()
      }
      break

    case oldQuizTypes.RADIO_MATRIX:
      order = 0

      for (const oldItem of items) {
        item = QuizItem.create({
          id: getUUIDByString(oldQuiz.id + oldItem.id),
          quiz,
          type: "multiple-choice",
          order: order++,
          createdAt: oldQuiz.createdAt,
          updatedAt: oldQuiz.updatedAt,
        })
        await item.save()
        item.texts = [
          QuizItemTranslation.create({
            quizItem: item.id,
            language,
            successMessage: successes[oldItem.id] || "",
            failureMessage: errors[oldItem.id] || "",
            title: oldItem.title || "",
            body: oldItem.body || "",
          }),
        ]
        await item.texts[0].save()

        choiceOrder = 0
        for (const oldChoice of choices) {
          const option = QuizOption.create({
            id: getUUIDByString(oldQuiz.id + oldItem.id + oldChoice.id),
            quizItem: item,
            order: choiceOrder++,
            correct:
              rightAnswer[oldItem.id] === oldChoice.id ||
              rightAnswer[oldItem.id].includes(oldChoice.id),
            createdAt: oldQuiz.createdAt,
            updatedAt: oldQuiz.updatedAt,
          })
          await option.save()
          option.texts = [
            QuizOptionTranslation.create({
              quizOption: option.id,
              language,
              successMessage: "",
              failureMessage: "",
              title: oldChoice.title || "",
              body: oldChoice.body || "",
            }),
          ]
          await option.texts[0].save()
        }
      }
      break

    default:
      console.warn("Unhandled quiz:", oldQuiz)
  }
  return quiz
}
