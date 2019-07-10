import finnishLabels from "./finnish_options"
import englishLabels from "./english_options"

export type GeneralLabels = {
  submitButtonLabel: string
  loginPromptLabel: string
  errorLabel: string
  loadingLabel: string
  answerCorrectLabel: string
  kOutOfNCorrect: (k: number, n: number) => string
  answerIncorrectLabel: string
  alreadyAnsweredLabel: string
  answerMissingBecauseQuizModifiedLabel: string
  pointsAvailableLabel: string
  pointsReceivedLabel: string
  incorrectSubmitWhileTriesLeftLabel: string
}

export type StageLabels = {
  answerStageLabel: string
  givingPeerReviewsStageLabel: string
  receivingPeerReviewsStageLabel: string
  evaluationStageLabel: string
}

export type MultipleChoiceLabels = {
  chooseAllSuitableOptionsLabel: string
}

export type EssayLabels = {
  exampleAnswerLabel: string
  userAnswerLabel: string
  minimumWords: string
  currentNumberOfWordsLabel: string
  textFieldLabel: string
}

export type PeerReviewLabels = {
  noPeerAnswersAvailableLabel: string
  chooseButtonLabel: string
  chooseEssayInstruction: string
  displayPeerReview: string
  extraPeerReviewsEncouragementLabel: string
  givenPeerReviewsLabel: string
  peerReviewsCompletedInfo: string
  reportAsInappropriateLabel: string
  submitPeerReviewLabel: string
  hidePeerReviewLabel: string
  loadingLabel: string
  quizInvolvesNoPeerReviewsInstruction: string
}

export type UnsupportedLabels = {
  notSupportedInsert: (itemType: string) => string
}

export type OpenLabels = {
  placeholder: string
  userAnswerLabel: string
}

export type SingleLanguageLabels = {
  essay: EssayLabels
  open: OpenLabels
  peerReviews: PeerReviewLabels
  unsupported: UnsupportedLabels
  multipleChoice: MultipleChoiceLabels
  stage: StageLabels
  general: GeneralLabels
}

export type LanguageLabels = {
  [langugeId: string]: SingleLanguageLabels
}

export const languageOptions: LanguageLabels = {
  fi_FI: finnishLabels,
  en_US: englishLabels,
}