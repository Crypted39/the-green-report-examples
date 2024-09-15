const { imgDiff } = require("img-diff-js");

imgDiff({
  actualFilename: "/path/to/actual/image",
  expectedFilename: "/path/to/expected/image",
  diffFilename: "/path/to/differences/image",
}).then((result) => {
  if (result.imagesAreSame) {
    console.log("Image verification passed");
  } else {
    throw new Error("Image verification failed");
  }
});
