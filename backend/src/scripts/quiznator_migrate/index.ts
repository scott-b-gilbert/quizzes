import database from "../../database"
import { Organization } from "../../models"

import mongoUtils from "./mongo_utils"

import { migrateCourses } from "./course"
import { createLanguages } from "./language"
import { migratePeerReviewQuestions } from "./peer_review"
import { migrateQuizzes } from "./quiz"
import { migrateQuizAnswers } from "./quiz_answer"
import { migrateUsers } from "./user"

async function main() {
  await database.promise

  await mongoUtils.connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/quiznator",
  )

  const org = await Organization.merge(Organization.create({ id: 0 })).save()

  const languages = await createLanguages()
  const courses = await migrateCourses(org, languages)
  const quizzes = await migrateQuizzes(courses)
  await migratePeerReviewQuestions(quizzes)
  const users = await migrateUsers()
  await migrateQuizAnswers(quizzes, users)
}

main().catch(console.error)
