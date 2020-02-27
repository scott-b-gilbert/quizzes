import * as React from "react"
import Quiz from "../../src"
import {
  FormControlLabel,
  Checkbox,
  Paper,
  TextField,
  Typography,
} from "@material-ui/core"
import { StylesProvider } from "@material-ui/styles"
import styled from "styled-components"
import SimpleErrorBoundary from "./SimpleErrorBoundary"
import { useInput, useLocalStorage } from "./customHooks"
import {
  CourseProgressProvider,
  injectCourseProgress,
} from "../../src/CourseProgressProvider"

const TallContainer = styled.div`
  padding-bottom: 1000px;
`

const FlexContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
`

const StyledQuizContainer = styled(props => <Paper {...props} />)`
  overflow: hidden;
  margin: 2rem 0;
  box-shadow: rgba(0, 0, 0, 0.3) 0px 8px 40px -12px;
  border-radius: 1rem;
  flex-basis: 800px;
`

const StyledTextField = styled(props => (
  <TextField variant="outlined" fullWidth {...props} />
))`
  margin: 1rem;
`

const StyledFormControlLabel = styled(FormControlLabel)`
  margin: 0.5rem 1rem;
  width: 100%;
`

const App = () => {
  const id = useInput("id", "")
  const languageId = useInput("languageId", "")
  const accessToken = useInput("savedAccessToken", "")
  const baseUrl = useInput("savedBaseUrl", "https://quizzes.mooc.fi")

  const [containerUsed, setContainerUsed] = useLocalStorage(
    "containerUsed",
    "true",
  )

  const [showAlwaysPoints, setShowAlwaysPoints] = useLocalStorage(
    "showAlwaysPoints",
    "true",
  )

  const [
    showFullInfoWhenLoggedOut,
    setShowFullInfoWhenLoggedOut,
  ] = useLocalStorage("showFullInfoWhenLoggedOut", "true")

  const toggleContainerUse = () =>
    setContainerUsed(containerUsed === "true" ? "false" : "true")

  const toggleShowFullInfo = () => {
    setShowFullInfoWhenLoggedOut(
      showFullInfoWhenLoggedOut === "true" ? "false" : "true",
    )
  }

  const toggleShowAlwaysPoints = () => {
    setShowAlwaysPoints(showAlwaysPoints === "true" ? "false" : "true")
  }

  const quizPortion = (
    <Quiz
      id={id.value}
      languageId={languageId.value}
      accessToken={accessToken.value}
      backendAddress={baseUrl.value}
      fullInfoWithoutLogin={showFullInfoWhenLoggedOut === "true"}
      showZeroPointsInfo={showAlwaysPoints === "true"}
    />
  )

  const Div = styled.div`
    display: block;
    flex-wrap: wrap;
    width: 100%;
    padding: 2rem;
    p {
      margin: auto;
      text-align: left;
      font-size: 1.5rem;
    }
  `

  const DataTest = (props: any) => {
    if (props.error) {
      return (
        <Div>
          <p>Error</p>
        </Div>
      )
    }
    if (props.loading) {
      return (
        <Div>
          <p>Loading</p>
        </Div>
      )
    }
    return (
      <Div>
        {props.userCourseProgress.data.currentUser.user_course_progresses[0].progress.map(
          p => {
            return <p>{JSON.stringify(p)}</p>
          },
        )}
        {props.userCourseProgress.data.currentUser.user_course_progresses[0].course.exercises.map(
          e => {
            const ex = { ...e }
            delete ex.ExerciseCompletions
            return (
              <div>
                #########################
                <p>{JSON.stringify(ex)}</p>
                {e.ExerciseCompletions.map(a => {
                  return <p>{JSON.stringify(a)}</p>
                })}
              </div>
            )
          },
        )}
      </Div>
    )
  }
  const Progress = injectCourseProgress(DataTest)

  return (
    <CourseProgressProvider
      courseId="b5746948-5141-4d45-aceb-79adb037c29b"
      accessToken={accessToken.value}
    >
      <Typography variant="h4" component="h1">
        Quizzes testing
      </Typography>
      <Progress />
      <StyledTextField {...id} label="Quiz id" />
      <StyledTextField {...languageId} label="Language id" />
      <StyledTextField {...accessToken} label="Access token" />
      <StyledTextField {...baseUrl} label="Base url" />

      <StyledFormControlLabel
        label="Use a paper container"
        control={
          <Checkbox
            checked={containerUsed === "true"}
            onChange={toggleContainerUse}
            value={containerUsed.value}
            color="primary"
          />
        }
      />

      <StyledFormControlLabel
        label="Show full quiz info when logged out"
        control={
          <Checkbox
            checked={showFullInfoWhenLoggedOut === "true"}
            onChange={toggleShowFullInfo}
            value={showFullInfoWhenLoggedOut.value}
            color="primary"
          />
        }
      />

      <StyledFormControlLabel
        label="Show points info even if quiz points == 1"
        control={
          <Checkbox
            checked={showAlwaysPoints === "true"}
            onChange={toggleShowAlwaysPoints}
            value={showAlwaysPoints.value}
            color="primary"
          />
        }
      />

      <TallContainer>
        <Typography variant="h5" component="h1">
          Quiz
        </Typography>
        <SimpleErrorBoundary>
          {containerUsed === "true" ? (
            <FlexContainer>
              <StyledQuizContainer>{quizPortion}</StyledQuizContainer>
            </FlexContainer>
          ) : (
            quizPortion
          )}
        </SimpleErrorBoundary>
      </TallContainer>
    </CourseProgressProvider>
  )
}

const StyledApp = () => (
  <StylesProvider injectFirst>
    <App />
  </StylesProvider>
)

export default StyledApp
