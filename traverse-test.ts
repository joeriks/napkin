var traverse: Traverse = require("traverse");

console.log("transform negative numbers in -place");

var obj1 = [5, 6, -3, [7, 8, -2, 1], { f: 10, g: -13 }];

traverse(obj1).forEach(function (x) {

    if (x < 0) this.update(x + 128);

});

console.dir(obj1);


console.log("collect leaf nodes");

var obj2 = {
    a: [1, 2, 3],
    b: 4,
    c: [5, 6],
    d: { e: [7, 8], f: 9 },
};

var leaves = traverse(obj2).reduce(function (acc, x) {
    if (this.isLeaf) acc.push(x);
    return acc;
}, []);

console.dir(leaves);


console.log("scrub circular references");


var obj3 = <any>{ a: 1, b: 2, c: [3, 4] };
obj3.c.push(obj3);

var scrubbed = traverse(obj3).map(function (x) {
    if (this.circular) this.remove()
});

console.dir(scrubbed);


console.log("leaves test");
var acc = [];
traverse({
    a: [1, 2, 3],
    b: 4,
    c: [5, 6],
    d: { e: [7, 8], f: 9 }
}).forEach(function (x) {
        if (this.isLeaf) acc.push(x);
    });


console.log(acc.join(" "));


console.log("Stringify");


var objStringify = [5, 6, -3, [7, 8, -2, 1], { f: 10, g: -13 }];

var s = '';
traverse(objStringify).forEach(function (node) {       

    if (Array.isArray(node)) {
        this.before(()=> { s += '[' });
        this.post((child: TraverseContext) => {
            s += "(" + child.key + "," + child.level + ")";
            if (!child.isLast) s += ',';
        });
        this.after(()=> { s += ']' });
    }
    else if (typeof node == 'object') {
        this.before(() =>{ s += '{' });
        this.pre( (x, key)=> {
            s += '"' + key + '"' + ':';
        });
        this.post((child)=> {
            if (!child.isLast) s += ',';
        });
        this.after( ()=> { s += '}' });
    }
    else if (typeof node == 'function') {
        s += 'null';
    }
    else {
        s += node.toString();
    }
});

console.log(s);
