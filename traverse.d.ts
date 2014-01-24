interface iwalk {
    (root: any, fn:Function, immutable: boolean):void;
}

interface TraverseContext {

    node: any;
    path: string[];
    parent?: TraverseContext;
    key?: string;
    isRoot: boolean;
    isLast: boolean;
    notRoot: boolean;
    level: number;
    circular: any;
    update: (value: any, stopHere: boolean) => void;
    remove: (stopHere: boolean) => void;
    before: () => void;
    after: () => void;
    pre: () => void;
    post: () => void;

}

interface TraverseStatic {

    /**
        Get the element at the array path.
    */
    get: (path: any) => any;

    /*
        Return whether the element at the array path exists.
    */
    has: (path: any) => boolean;

    /**
        Set the element at the array path to value.
    */
    set: (path: any, value: any) => any;

    /**
        Execute fn for each node in the object and return a new object with the results of the walk. To update nodes in the result use this.update(value).
    */
    map: (fn: iwalk) => void;

    /** 
        Execute fn for each node in the object but unlike .map(), when this.update() is called it updates the object in-place.
    */
    forEach: (fn: Function) => void;

    /**
        For each node in the object, perform a left-fold) with the return value of fn(acc, node).
        If acc isn't specified, acc is set to the root object for the first step and the root element is skipped.
    */
    reduce: (fn: Function, acc: any) => any[];

    /** 
        Return an Array of every possible non-cyclic path in the object. Paths are Arrays of string keys.
    */
    paths: () => any[];

    /** 
        Return an Array of every node in the object.
    */
    nodes: () => any[];

    /**
        Create a deep clone of the object.
    */
    clone: () => any;

    walk: iwalk;


    copy: (src: any) => any;

//declare var objectKeys: (obj: any) => any[];

    toS: (obj: any) => any;

    isDate: (obj: any)=> boolean;
    isRegExp: (obj: any) => boolean;
    isError: (obj: any) => boolean;
    isBoolean: (obj: any) => boolean;
    isNumber: (obj: any)=> boolean;
    isString: (obj: any) => boolean;

//declare var hasOwnProperty: (obj: string, key: any) => boolean;

}


interface Traverse {
    (obj: any): TraverseStatic;
}