import { NormalizedQuiz, action, Entities } from "../../../types/NormalizedQuiz"
import { createReducer } from "typesafe-actions"
import {
  editedQuizTitle,
  editedQuizzesNumberOfTries,
  editedQuizzesPointsToGain,
  editedQuizzesPointsGrantingPolicy,
  editedQuizzesDeadline,
  editedQuizzesBody,
  editedQuizzesSubmitmessage,
} from "./quizActions"
import {
  initializedEditor,
  createdNewItem,
  deletedItem,
  createdNewQuiz,
} from "../editorActions"
import produce from "immer"
import { Quiz } from "../../../types/Quiz"
import { normalize } from "normalizr"
import { normalizedQuiz } from "../../../schemas"
export const quizReducer = createReducer<
  { [quizId: string]: NormalizedQuiz },
  action
>({})
  .handleAction(
    initializedEditor,
    (_state, action) => action.payload.normalizedQuiz.quizzes,
  )

  .handleAction(editedQuizTitle, (state, action) => {
    return produce(state, draftState => {
      draftState[action.payload.id].title = action.payload.title
    })
  })

  .handleAction(editedQuizzesNumberOfTries, (state, action) => {
    return produce(state, draftState => {
      draftState[action.payload.id].tries = action.payload.numberOfTries
    })
  })

  .handleAction(editedQuizzesPointsToGain, (state, action) => {
    return produce(state, draftState => {
      draftState[action.payload.id].points = action.payload.pointsToGain
    })
  })

  .handleAction(editedQuizzesPointsGrantingPolicy, (state, action) => {
    return produce(state, draftState => {
      draftState[action.payload.id].grantPointsPolicy = action.payload.policy
    })
  })

  .handleAction(editedQuizzesDeadline, (state, action) => {
    return produce(state, draftState => {
      draftState[action.payload.id].deadline = action.payload.deadline
    })
  })

  .handleAction(editedQuizzesBody, (state, action) => {
    return produce(state, draftState => {
      draftState[action.payload.quizId].body = action.payload.newBody
    })
  })

  .handleAction(editedQuizzesSubmitmessage, (state, action) => {
    return produce(state, draftState => {
      console.log(draftState[action.payload.quizId])
      draftState[action.payload.quizId].submitMessage =
        action.payload.newMessage
    })
  })

  .handleAction(createdNewItem, (state, action) => {
    return produce(state, draftState => {
      draftState[action.payload.quizId].items.push(action.payload.itemId)
    })
  })

  .handleAction(deletedItem, (state, action) => {
    return produce(state, draftState => {
      draftState[action.payload.quizId].items = draftState[
        action.payload.quizId
      ].items.filter(id => id !== action.payload.itemId)
    })
  })

  .handleAction(createdNewQuiz, (state, action) => {
    const init: Quiz = {
      id: action.payload.quizId,
      autoConfirm: false,
      autoReject: false,
      awardPointsEvenIfWrong: false,
      body: "",
      courseId: action.payload.courseId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deadline: null,
      excludedFromScore: true,
      grantPointsPolicy: "grant_whenever_possible",
      items: [],
      open: null,
      part: 0,
      peerReviews: [],
      points: 0,
      section: 0,
      submitMessage: null,
      title: "",
      tries: 1,
      triesLimited: true,
    }

    const normalized = normalize(init, normalizedQuiz)

    return normalized.entities.quizzes ?? {}
  })

export default quizReducer
