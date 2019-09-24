import Knex from "knex"
import { Inject, Service } from "typedi"
import { EntityManager, SelectQueryBuilder } from "typeorm"
import { InjectManager } from "typeorm-typedi-extensions"
import {
  Course,
  Quiz,
  QuizAnswer,
  User,
  UserCoursePartState,
  UserCourseState,
  UserQuizState,
} from "../models"
import { IQuizAnswerQuery, PointsByGroup } from "../types"
import CourseService from "./course.service"
import QuizService from "./quiz.service"
import QuizAnswerService from "./quizanswer.service"
import UserQuizStateService from "./userquizstate.service"

@Service()
export default class UserCoursePartStateService {
  @InjectManager()
  private entityManager: EntityManager

  @Inject(type => QuizService)
  private quizService: QuizService

  @Inject()
  private userQuizStateService: UserQuizStateService

  private knex = Knex({ client: "pg" })

  public async getUserCoursePartState(
    userId: number,
    courseId: string,
    partNumber: number,
  ): Promise<UserCoursePartState> {
    return await this.entityManager
      .createQueryBuilder(UserCoursePartState, "user_course_part_state")
      .where("user_course_part_state.user_id = :userId", { userId })
      .andWhere("user_course_part_state.course_id = :courseId", { courseId })
      .andWhere("user_course_part_state.course_part = :course_part", {
        course_part: partNumber,
      })
      .getOne()
  }

  public async getUserCoursePartStates(
    manager: EntityManager,
    userId: number,
    courseId: string,
  ): Promise<UserCoursePartState[]> {
    const userCoursePartStates: UserCoursePartState[] = await manager
      .createQueryBuilder(UserCoursePartState, "user_course_part_state")
      .where("user_course_part_state.user_id = :userId", { userId })
      .andWhere("user_course_part_state.course_id = :courseId", { courseId })
      .orderBy("course_part")
      .getMany()

    return userCoursePartStates
  }

  public async updateUserCoursePartState(
    manager: EntityManager,
    quiz: Quiz,
    userId: number,
  ): Promise<UserCoursePartState> {
    const courseId = quiz.courseId
    const coursePart = quiz.part
    let userCoursePartState = await this.getUserCoursePartState(
      userId,
      courseId,
      coursePart,
    )
    if (!userCoursePartState) {
      const userCoursePartStates = await this.createUserCoursePartStates(
        manager,
        courseId,
        userId,
      )
      return userCoursePartStates.find(ucps => ucps.coursePart === coursePart)
    } else {
      userCoursePartState = await this.calculateProgressData(
        manager,
        userCoursePartState,
      )
      return await manager.save(userCoursePartState)
    }
  }

  public async batchUpdateUserCoursePartStates(
    quiz: Quiz,
    oldQuiz: Quiz,
    manager?: EntityManager,
  ) {
    const entityManager = manager || this.entityManager

    const query = this.knex.raw(
      `
      update user_course_part_state ucps
      set
        progress = data.points / data.max_points,
        score = data.points
      from (
        select
          points.course_id,
          points.user_id,
          points.part,
          points.points,
          max.max_points
        from (
          select
            q.course_id,
            uqs.user_id,
            q.part,
            sum(uqs.points_awarded) points
          from user_quiz_state uqs
          join quiz q on uqs.quiz_id = q.id
          where q.course_id = :courseId
          and q.excluded_from_score = false
          and (q.part = :oldPart or q.part = :newPart)
          group by q.course_id, uqs.user_id, q.part
        ) points
        join (
          select
            q.part,
            sum(q.points) max_points
          from quiz q
          where q.course_id = :courseId
          and (q.part = :oldPart or q.part = :newPart)
          and q.excluded_from_score = false
          group by q.part
        ) max on points.part = max.part
      ) data
      where ucps.course_id = data.course_id
      and ucps.user_id = data.user_id
      and ucps.course_part = data.part
      `,
      {
        courseId: quiz.courseId,
        oldPart: oldQuiz.part,
        newPart: quiz.part,
      },
    )

    await entityManager.query(query.toString())
  }

  public async createUserCoursePartState(
    manager: EntityManager,
    courseId: string,
    userId: number,
    coursePart: number,
  ): Promise<UserCoursePartState> {
    let userCoursePartState: UserCoursePartState = new UserCoursePartState()

    userCoursePartState.userId = userId
    userCoursePartState.courseId = courseId
    userCoursePartState.coursePart = coursePart

    userCoursePartState = await this.calculateProgressData(
      manager,
      userCoursePartState,
    )
    return await manager.save(userCoursePartState)
  }

  public async createUserCoursePartStates(
    manager: EntityManager,
    courseId: string,
    userId: number,
  ): Promise<UserCoursePartState[]> {
    const quizzes: Quiz[] = await this.quizService.getQuizzes({
      courseId,
      exclude: true,
    })
    const parts = new Set()

    quizzes.map(quiz => parts.add(quiz.part))

    const userCoursePartStates: UserCoursePartState[] = []

    await Promise.all(
      Array.from(parts).map(async (part: number) => {
        const userCoursePartState = await this.createUserCoursePartState(
          manager,
          courseId,
          userId,
          part,
        )
        userCoursePartStates.push(userCoursePartState)
      }),
    )

    return userCoursePartStates
  }

  public async getProgress(
    manager: EntityManager,
    userId: number,
    courseId: string,
  ): Promise<PointsByGroup[]> {
    let userCoursePartStates: UserCoursePartState[] = await this.getUserCoursePartStates(
      manager,
      userId,
      courseId,
    )

    if (userCoursePartStates.length === 0) {
      const user = new User()
      user.id = userId
      await user.save()

      userCoursePartStates = await this.createUserCoursePartStates(
        manager,
        courseId,
        userId,
      )
    }

    const quizzes: Quiz[] = await this.quizService.getQuizzes({ courseId })

    const progress: PointsByGroup[] = userCoursePartStates
      .filter(ucps => ucps.coursePart !== 0)
      .map(ucps => {
        const maxPoints = quizzes
          .filter(
            quiz => quiz.part === ucps.coursePart && !quiz.excludedFromScore,
          )
          .map(quiz => quiz.points)
          .reduce((acc, curr) => acc + curr)

        const coursePartString: string = ucps.coursePart.toString()

        return {
          group: `${
            coursePartString.length > 1 ? "osa" : "osa0"
          }${coursePartString}`,
          progress: Math.floor(ucps.progress * 100) / 100,
          n_points: Number(ucps.score.toFixed(2)),
          max_points: maxPoints,
        }
      })

    return progress.sort()
  }

  private async calculateProgressData(
    manager: EntityManager,
    userCoursePartState: UserCoursePartState,
  ): Promise<UserCoursePartState> {
    const quizzesInPart = await this.quizService.getQuizzes(
      {
        courseId: userCoursePartState.courseId,
        coursePart: userCoursePartState.coursePart,
        exclude: true,
      },
      manager,
    )

    let pointsTotal: number = 0
    const quizIds: string[] = quizzesInPart.map(quiz => {
      pointsTotal += quiz.points
      return quiz.id
    })

    const userQuizStates: UserQuizState[] = await this.userQuizStateService.getQuizStatesForUserCourse(
      manager,
      userCoursePartState.userId,
      quizIds,
    )

    let pointsAwarded: number = 0

    userQuizStates.forEach(uqs => {
      pointsAwarded += uqs.pointsAwarded
    })

    userCoursePartState.score = pointsAwarded
    userCoursePartState.progress = pointsAwarded / pointsTotal

    if (userCoursePartState.score > 99.99) {
      userCoursePartState.completed = true
    }

    return userCoursePartState
  }
}
