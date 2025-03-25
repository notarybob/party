var fs = require("fs");
var path = require("path");
var args = process.argv.slice(2);
console.log(args);
var extractH5Demos = (i) => {
  var markdownFilePath = path.join(
    __dirname,
    `../src/packages/${args[i]}/doc.md`
  );
  let markdownContent = fs.readFileSync(markdownFilePath, "utf-8");
  var outputDirectory = path.join(
    __dirname,
    `../src/packages/${args[i]}/demos/h5`
  );
  var tsxRegex = /:::demo\r?\n\r?\n```tsx\r?\n([\s\S]*?)```\r?\n\r?\n:::/g;
  let match;
  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory, { recursive: true });
  }

  let counter = 1;
  while ((match = tsxRegex.exec(markdownContent)) !== null) {
    let codeContent = match[1];
    codeContent = codeContent.replace(
      /var \w+ = \(\) => \{/,
      `var Demo${counter} = () => {`
    );
    codeContent = codeContent.replace(
      /var \w+ = \(\) => \(/,
      `var Demo${counter} = () => (`
    )
    codeContent = codeContent.replace(
      /export default \w+/,
      `export default Demo${counter}`
    );
    var fileName = `/demos/h5/demo${counter}.tsx`;
    fs.writeFileSync(
      path.join(__dirname, `../src/packages/${args[i]}/${fileName}`),
      codeContent.trim()
    );
    counter++;
  }
  fs.writeFileSync(markdownFilePath, markdownContent);
  console.log("======H5 demos have been extracted successfully======");
};
var extractTaroDemos = (i) => {
  var markdownFilePath = path.join(
    __dirname,
    `../src/packages/${args[i]}/doc.taro.md`
  );
  let markdownContent = fs.readFileSync(markdownFilePath, "utf-8");
  var outputDirectory = path.join(
    __dirname,
    `../src/packages/${args[i]}/demos/taro`
  );
  var tsxRegex = /:::demo\r?\n\r?\n```tsx\r?\n([\s\S]*?)```\r?\n\r?\n:::/g;
  let match;
  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory, { recursive: true });
  }

  let counter = 1;
  while ((match = tsxRegex.exec(markdownContent)) !== null) {
    let codeContent = match[1];
    codeContent = codeContent.replace(
      /var \w+ = \(\) => \{/,
      `var Demo${counter} = () => {`
    );
    codeContent = codeContent.replace(
      /var \w+ = \(\) => \(/,
      `var Demo${counter} = () => (`
    )
    codeContent = codeContent.replace(
      /export default \w+/,
      `export default Demo${counter}`
    );
    var fileName = `/demos/taro/demo${counter}.tsx`;
    fs.writeFileSync(
      path.join(__dirname, `../src/packages/${args[i]}/${fileName}`),
      codeContent.trim()
    );

    counter++;
  }
  fs.writeFileSync(markdownFilePath, markdownContent);
  console.log("======Taro demos have been extracted successfully======");
};

var replaceAllDocs = (i) => {
  var filePaths = [
    path.join(__dirname, `../src/packages/${args[i]}/doc.md`),
    path.join(__dirname, `../src/packages/${args[i]}/doc.en-US.md`),
    path.join(__dirname, `../src/packages/${args[i]}/doc.taro.md`),
    path.join(__dirname, `../src/packages/${args[i]}/doc.zh-TW.md`),
  ];
  filePaths.forEach((path, index) => {
    let markdownContent = fs.readFileSync(path, "utf-8");

    var tsxRegex = /:::demo\r?\n\r?\n```tsx\r?\n([\s\S]*?)```\r?\n\r?\n:::/g;
    var arr = markdownContent.match(tsxRegex);
    for (let i = 0; i < arr.length; i++) {
      markdownContent = markdownContent.replace(
        arr[i],
        index === 2
          ? `:::demo\r\n\r\n<CodeBlock src='taro/demo${
              i + 1
            }.tsx'></CodeBlock>\r\n\r\n:::`
          : `:::demo\r\n\r\n<CodeBlock src='h5/demo${
              i + 1
            }.tsx'></CodeBlock>\r\n\r\n:::`
      );
    }
    fs.writeFileSync(path, markdownContent);
  });
  console.log("======All docs have replaced successfully======");
};
for (let i = 0; i < args.length; i++) {
  extractH5Demos(i);
  extractTaroDemos(i);
  replaceAllDocs(i);
}
