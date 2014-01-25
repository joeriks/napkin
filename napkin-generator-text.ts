var traverse: Traverse = require("traverse");
var napkin = require("./napkin");

napkin.addGenerator("text", (obj) => {

    var s = "";

    traverse(obj).forEach(function to_s(node) {

        if (Array.isArray(node)) {
            // this.post(function (child) {
            //    if (!child.isLast) s += ',';
            //});
            //this.after(function () { s += ']' });
        }
        else if (typeof node == 'object') {

            this.before(function () {
                if (node.node) {
                    s += Array(Math.floor(this.level/2)).join("\t") + node.node + "\n";
                }
            });

            //this.pre(function (x, key) {
            //    to_s(key);
            //    s += ':';
            //});

            //this.post(function (child) {
            //    if (!child.isLast) s += ',';
            //});

            //this.after(function () { s += '}' });
        }
        else if (typeof node == 'string') {
            //s += '"' + node.toString().replace(/"/g, '\\"') + '"';
        }
        else {
            s += node.toString();
        }


    });

    return s;

});