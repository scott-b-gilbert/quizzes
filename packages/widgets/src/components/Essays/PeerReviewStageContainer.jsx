import React from "react"
import { Typography, Paper } from "@material-ui/core"
import PeerReviews from "./PeerReviews"

const paper = {
  padding: 10,
  margin: 10,
}

const PeerReviewStageContainer = ({
  languageInfo,
  textData,
  submitMessage,
  answered,
  quizAnswer,
  quiz,
  ...other
}) => {
  const ownAnswers = quizAnswer.itemAnswers.map(ia => {
    const quizItem = quiz.items.find(qi => qi.id === ia.quizItemId)

    return (
      <React.Fragment key={ia.id}>
        <Typography variant="subtitle1">
          {quizItem.texts[0] && quizItem.texts[0].title + ": "}
          {languageInfo.userAnswerLabel}
        </Typography>
        <Paper style={paper}>
          <Typography variant="body1">{ia.textData}</Typography>
        </Paper>
      </React.Fragment>
    )
  })

  return (
    <div>
      {ownAnswers}
      {submitMessage ? (
        <div>
          <Typography variant="subtitle1">
            {languageInfo.exampleAnswerLabel}
          </Typography>
          <Paper style={paper}>
            <Typography
              variant="body1"
              dangerouslySetInnerHTML={{ __html: submitMessage }}
            />
          </Paper>
        </div>
      ) : (
        ""
      )}
      <PeerReviews {...other} answered={answered} languageInfo={languageInfo} />
    </div>
  )
}

export default PeerReviewStageContainer
