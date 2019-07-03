import * as React from "react"
import { useDispatch } from "react-redux"
import styled from "styled-components"
import { Checkbox, Grid, Typography } from "@material-ui/core"
import { useTypedSelector } from "../state/store"
import * as quizAnswerActions from "../state/quizAnswer/actions"
import { QuizItem } from "../modelTypes"

export type CheckboxOptionProps = {
  item: QuizItem
}

const VertCenteredGrid = styled(Grid)`
  align-self: center;
`

const CheckboxOption: React.FunctionComponent<CheckboxOptionProps> = ({
  item,
}) => {
  const quizAnswer = useTypedSelector(state => state.quizAnswer)

  const dispatch = useDispatch()
  const option = item.options[0]
  const { body, title } = option.texts[0]

  const toggle = () =>
    dispatch(quizAnswerActions.changeCheckboxData(item.id, option.id))

  const answered = quizAnswer.id ? true : false

  const optionAnswer = quizAnswer.itemAnswers.find(
    ia => ia.quizItemId === item.id,
  ).optionAnswers[0]

  const checkboxOptions = {
    disabled: answered,
    checked: optionAnswer !== undefined,
  }

  return (
    <Grid container style={{ marginBottom: 10 }}>
      <Grid item xs={1}>
        <Checkbox
          value={optionAnswer ? optionAnswer.quizOptionId : ""}
          color="primary"
          onChange={toggle}
          {...checkboxOptions}
        />
      </Grid>
      <VertCenteredGrid item xs>
        {title && <Typography variant="subtitle1">{title}</Typography>}
        {body && body !== title && (
          <Typography variant="body1">{body}</Typography>
        )}
      </VertCenteredGrid>
    </Grid>
  )
}

export default CheckboxOption
