require('dotenv').config()

const axios = require('axios')
const bodyParser = require('body-parser')
const express = require('express')
const qs = require('querystring')

const dialogTemplate = require('./dialog')

const app = express()

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send(
    '<h2> The dialog Slash Command app is running</h2> <p> Follow the instructions in the README to configure the Slack App and your enviroment variables.</p>'
  )
})

app.post('/slack/events/commands', (req, res) => {
  const {token, text, trigger_id} = req.body

  if (token === process.env.SLACK_VERIFICATION_TOKEN) {
    res.send('')

    const dialog = dialogTemplate(trigger_id, text)
    axios
      .post('https://slack.com/api/dialog.open', qs.stringify(dialog))
      .then(result => console.log(result))
  } else {
    res.sendStatus.send('Internal Server Error')
  }
})

// endpoint to receive interactive message events from Slack
// checks verification token and then updates priority

app.post('/slack/events/components', (req, res) => {
  const body = JSON.parse(req.body.payload)

  if (body.token === process.env.SLACK_VERIFICATION_TOKEN) {
    switch (body.type) {
      case 'dialog_submission': {
        res.send('')
        axios
          .post(
            'https://slack.com/api/chat.postMesage',
            qs.stringify({
              token: process.env.SLACK_VERIFICATION_TOKEN,
              channel: body.submission.feature,
              text: `New bug report from <@${body.user.id}`,
              attachments: JSON.stringify([
                {
                  title: body.submission.title,
                  text: body.submission.description,
                  fields: [
                    {
                      title: 'Reproduction Steps',
                      value: body.submission.reproduction
                    }
                  ]
                }
              ])
            })
          )
          .then(result => console.log(result))
        break
      }
      default:
        res.sendStatus(500).send('Internal Server Error')
    }
  } else {
    res.sendStatus(500).send('Internal Server Error')
  }
})

app.listen(process.env.PORT, () => {
  console.log(`App listening on port ${process.env.PORT}`)
})
