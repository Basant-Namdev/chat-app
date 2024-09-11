const path = require('path');
const ejs = require('ejs');


exports.renderView = (res, viewPath, locals) => {
    const filePath = path.resolve(__dirname, `./views/${viewPath}.ejs`);
    ejs.renderFile(filePath, locals, function (err, str) {
      if (!err) {
        res.send(str);
      } else {
        console.log(err);
      }
    });
  }