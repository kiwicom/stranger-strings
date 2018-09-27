const saveJSON = (data, filename) => {
  if (!data) {
    console.error("no data")
    return
  }
  if (typeof data === "object") {
    data = JSON.stringify(data, undefined, 4) // eslint-disable-line no-param-reassign
  }

  const blob = new Blob([data], { type: "text/json" })
  const e = document.createEvent("MouseEvents")
  const a = document.createElement("a")

  a.download = filename
  a.href = window.URL.createObjectURL(blob)
  a.dataset.downloadurl = ["text/json", a.download, a.href].join(":")
  e.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
  a.dispatchEvent(e)
}

export default saveJSON
