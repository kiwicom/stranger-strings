export const options = ["Slack"]


// reportForm: {
//   key: "common.content.some-key",
//   locale: "en-GB",
//   errorType: "Grammar",
//   additionalInfo: "Should be they're not their.",
//   author: "name@gmail.com",
//   slackName: "name.surname",
//   url: "https://stranger-strings.firebaseapp.com/common_content_some-key",
// },
export function reportOnSlack(hookURL, channelName, reportForm, callback) {
  const key = `*Key:* \`${reportForm.key}\`\n`
  const locale = `*Locale:* _${reportForm.locale}_\n`
  const type = `*Type of error:* _${reportForm.errorType}_\n`
  const description = `*Description:*\n>${reportForm.additionalInfo}\n`
  const author = reportForm.slackName ? `${reportForm.slackName} (${reportForm.author})` : reportForm.author
  fetch(hookURL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({
      channel: channelName || undefined,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: key + locale + type + description,
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Show in Stranger Strings",
              },
              url: reportForm.url,
            },
          ],
        },
        {
          type: "divider",
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `_Report submitted by @${author} via *Stranger Strings*_`,
            },
          ],
        },
      ],
    }),
  }).then(() => {
    callback("Reported", "Report sent to Slack.", "success")
  }).catch((err) => {
    callback("Report failed", "Error when posting to Slack.", "danger")
    console.error(err)
  })
}
