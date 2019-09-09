export const options = ["Slack"]


// reportForm: {
//   key: "common.content.some-key",
//   locales: ["en-GB"],
//   errorType: "Grammar",
//   additionalInfo: "Should be they're not their.",
//   author: "name@gmail.com",
//   slackName: "name.surname",
//   image: "https://user-images.githubusercontent.com/26377907/55490923-de565a00-5634-11e9-9349-0f5f0dc90336.png"
//   url: "https://stranger-strings.firebaseapp.com/common_content_some-key",
// },
export function reportOnSlack(hookURL, channelName, reportForm, callback) {
  const key = `*Key:* \`${reportForm.key}\`\n`
  const locale = `*Locale${reportForm.locales.length > 1 ? "s" : ""}:* _${reportForm.locales.join(", ")}_\n`
  const type = `*Type of error:* _${reportForm.errorType}_\n`
  const description = `*Description:*\n>${reportForm.additionalInfo}\n`
  const author = reportForm.slackName ? `<@${reportForm.slackName}> (${reportForm.author})` : reportForm.author
  const image = reportForm.image ? {
    type: "image",
    title: {
      type: "plain_text",
      text: "attachment",
      emoji: true,
    },
    image_url: reportForm.image,
    alt_text: "attachment",
  } : null
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
        image,
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
              text: `_Report submitted by ${author} via *Stranger Strings*_`,
            },
          ],
        },
      ].filter(block => block !== null),
    }),
  }).then(() => {
    callback("Reported", "Report sent to Slack.", "success")
  }).catch((err) => {
    callback("Report failed", "Error when posting to Slack.", "danger")
    console.error(err)
  })
}
