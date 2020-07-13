import { createAction } from "typesafe-actions"
import { Entities } from "../../types/NormalizedQuiz"
import { EditableQuiz } from "../../types/EditQuiz"
import { v4 } from "uuid"

export const initializedEditor = createAction(
  "INITIALIZED_EDITOR",
  (normalizedQuiz: Entities, nestedQuiz: EditableQuiz) => ({
    normalizedQuiz: normalizedQuiz,
    nestedQuiz: nestedQuiz,
  }),
)<{ normalizedQuiz: Entities; nestedQuiz: EditableQuiz }>()

export const createdNewItem = createAction(
  "CREATED_NEW_ITEM",
  (quizId: string, type: string) => ({
    quizId: quizId,
    type: type,
    itemId: v4(),
  }),
)<{ quizId: string; type: string; itemId: string }>()

export const deletedItem = createAction("DELETED_ITEM", (itemId: string) => ({
  itemId: itemId,
}))<{ itemId: string }>()

export const createdNewOption = createAction(
  "CREATED_NEW_OPTION",
  (itemId: string) => ({
    itemId: itemId,
    optionId: v4(),
  }),
)<{ itemId: string; optionId: string }>()

export const deletedOption = createAction(
  "DELETED_OPTION",
  (optionId: string, itemId: string) => ({
    optionId: optionId,
    itemId: itemId,
  }),
)<{ optionId: string; itemId: string }>()