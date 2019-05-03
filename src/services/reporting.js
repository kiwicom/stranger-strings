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
export function reportOnSlack(hookURL, reportForm, callback) {
  fetch(hookURL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({
      text: "test", // TODO
    }),
  }).then(() => {
    callback("Reported", "Report sent to Slack.", "success")
  }).catch((err) => {
    callback("Report failed", "Error when posting to Slack.", "danger")
    console.error(err)
  })
}
