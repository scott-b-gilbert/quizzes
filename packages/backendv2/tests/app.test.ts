import request from "supertest"
import nock from "nock"
import app from "../app"
import knex from "../database/knex"
import { UserInfo } from "../src/types"
import data from "./data"

const knexCleaner = require("knex-cleaner")

beforeEach(async () => {
  await knex.seed.run()
})

afterEach(async () => {
  await knexCleaner.clean(knex)
})

afterAll(async () => {
  await knex.destroy()
})

describe("dashboard: get courses", () => {
  beforeEach(async () => {
    nock("https://tmc.mooc.fi")
      .get("/api/v8/users/current?show_user_fields=true")
      .reply(function() {
        const auth = this.req.headers.authorization
        if (auth === "Bearer admin_token") {
          return [
            200,
            {
              administrator: true,
            } as UserInfo,
          ]
        }
      })
  })

  test("respond with 401 if invalid credentials", async done => {
    request(app.callback())
      .get("/api/v2/dashboard/courses")
      .set("Authorization", `bearer BAD_TOKEN`)
      .expect(401, done)
  })

  test("reply with courses on valid request", async done => {
    request(app.callback())
      .get("/api/v2/dashboard/courses")
      .set("Authorization", `bearer ADMIN_TOKEN`)
      .expect(200)
      .expect(response => {
        const returned = response.body
        expect(returned).toHaveLength(2)
        expect(
          returned.sort((o1: any, o2: any) => o1.id.localeCompare(o2.id)),
        ).toStrictEqual([data.courseValidator1, data.courseValidator2])
      })
      .end(done)
  })
})

describe("dashboard: get quizzes by course id", () => {
  beforeEach(async () => {
    nock("https://tmc.mooc.fi")
      .get("/api/v8/users/current?show_user_fields=true")
      .reply(function() {
        const auth = this.req.headers.authorization
        if (auth === "Bearer admin_token") {
          return [
            200,
            {
              administrator: true,
            } as UserInfo,
          ]
        }
      })
  })

  test("respond with 401 if invalid credentials", async done => {
    request(app.callback())
      .get(
        "/api/v2/dashboard/courses/46d7ceca-e1ed-508b-91b5-3cc8385fa44b/quizzes",
      )
      .set("Authorization", `bearer BAD_TOKEN`)
      .expect(401, done)
  })

  test("reply with course quizzes on valid request", async done => {
    request(app.callback())
      .get(
        "/api/v2/dashboard/courses/46d7ceca-e1ed-508b-91b5-3cc8385fa44b/quizzes",
      )
      .set("Authorization", `bearer ADMIN_TOKEN`)
      .expect(200)
      .expect(response => {
        const returned = response.body
        expect(returned).toHaveLength(2)
        expect(
          returned.sort((o1: any, o2: any) => -o1.id.localeCompare(o2.id)),
        ).toStrictEqual([data.quizValidator1, data.quizValidator2])
      })
      .end(done)
  })
})

describe("dashboard: get quiz by id", () => {
  beforeEach(async () => {
    nock("https://tmc.mooc.fi")
      .get("/api/v8/users/current?show_user_fields=true")
      .reply(function() {
        const auth = this.req.headers.authorization
        if (auth === "Bearer admin_token") {
          return [
            200,
            {
              administrator: true,
            } as UserInfo,
          ]
        }
      })
  })

  test("respond with 401 if invalid credentials", async done => {
    request(app.callback())
      .get("/api/v2/dashboard/quizzes/4bf4cf2f-3058-4311-8d16-26d781261af7")
      .set("Authorization", `bearer BAD_TOKEN`)
      .expect(401, done)
  })

  test("respond with 404 if invalid quiz id", async done => {
    request(app.callback())
      .get("/api/v2/dashboard/quizzes/4bf4cf2f-3058-4311-8d16-26d781261af8")
      .set("Authorization", `bearer ADMIN_TOKEN`)
      .expect(404, done)
  })

  test("reply with quiz on valid request", async done => {
    request(app.callback())
      .get("/api/v2/dashboard/quizzes/4bf4cf2f-3058-4311-8d16-26d781261af7")
      .set("Authorization", `bearer ADMIN_TOKEN`)
      .expect(200)
      .expect(response => {
        const returned = response.body
        expect(returned).toStrictEqual(data.quizValidator1)
      })
      .end(done)
  })
})

describe("dashboard: save quiz", () => {
  beforeEach(async () => {
    nock("https://tmc.mooc.fi")
      .get("/api/v8/users/current?show_user_fields=true")
      .reply(function() {
        const auth = this.req.headers.authorization
        if (auth === "Bearer admin_token") {
          return [
            200,
            {
              administrator: true,
            } as UserInfo,
          ]
        }
      })
  })

  test("respond with error if required field missing", async done => {
    request(app.callback())
      .post("/api/v2/dashboard/quizzes")
      .set("Authorization", `bearer ADMIN_TOKEN`)
      .set("Accept", "application/json")
      .send({ ...data.newQuiz, part: null })
      .expect(500, done)
  })

  test("respond with 401 if invalid credentials", async done => {
    request(app.callback())
      .post("/api/v2/dashboard/quizzes")
      .set("Authorization", `bearer BAD_TOKEN`)
      .set("Accept", "application/json")
      .send(data.newQuiz)
      .expect(401, done)
  })

  test("save valid quiz", async done => {
    request(app.callback())
      .post("/api/v2/dashboard/quizzes")
      .set("Authorization", `bearer ADMIN_TOKEN`)
      .set("Accept", "application/json")
      .send(data.newQuiz)
      .expect(200)
      .expect(response => {
        const returned = response.body
        expect(returned).toStrictEqual(data.newQuizValidator)
      })
      .end(done)
  })

  test("update existing quiz", async done => {
    request(app.callback())
      .post("/api/v2/dashboard/quizzes")
      .set("Authorization", `bearer ADMIN_TOKEN`)
      .set("Accept", "application/json")
      .send(data.quizUpdate)
      .expect(200)
      .expect(response => {
        const returned = response.body
        expect(returned).toStrictEqual(data.quizUpdateValidator)
      })
      .end(done)
  })
})
