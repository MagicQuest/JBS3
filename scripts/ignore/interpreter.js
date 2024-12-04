//lowkey had a thought the other day about how you would make eval if eval didn't exist yet and then i thought about interpreting other languages and now im here

class Operator {
    constructor() {

    }

    exec(code) {
        const [_, op1, op2] = code.match(RegExp(`/(\\w+) *${this.operator} *(\\w+)/`));
        let operand1;
        let operand2;

        if()

        return [operand1, operand2];
    }
}

class Interpreter { //"abstract" https://stackoverflow.com/questions/597769/how-do-i-create-an-abstract-base-class-in-javascript
    keywords = {};
    //variables = {};
    operators = {};
    localvariables = {};

    constructor() {
        
    }

    eval(code) {
        const lines = code.split("\n");
        for(const line of lines) {
            //throw new Error("Method 'eval()' must be implemented.")
            const commands = line.split(";");
            for(const command of commands) {
                const [_, first] = command.match(/(\w+)/);
                if(Object.keys(this.keywords).includes(first)) {
                    const keyword = this.keywords[first];
                    if(keyword.function) {
                        
                    }else if(keyword.curly) {

                    }else if(keyword.exec) {
                        keyword.exec.call(this, command.substring(first.length));
                        //keyword.exec.call(this, command.substring(first.length));
                    }else {
                        this.eval(command.substring(first.length));
                    }
                }else if(Object.keys(globalThis).includes(first) || Object.keys(this.localvariables).includes(first)) {
                    //could be a variable
                }else {
                    //I wonder what's for dinner.
                    for(const op in operators) {
                        if(command.includes(op)) {
                            op.exec();
                            break;
                        }
                    }
                    //if(command.includes("=")) {
                    //    //assignment
                    //    
                    //}
                }
            }
        }
    }
}

class LuaInterpreter extends Interpreter {
    constructor() {
        super();

        this.keywords["local"] = {function: false, curly: false}; /*exec: function(line) {
            const [_, varname] = code.match(/(\w[A-z_0-9]+)/);
            this.variables[varname] = ; //nah fuck that globalThis
        }};*/
    }

    eval(code) {
        super.eval(code);
    }
}

const lua = new LuaInterpreter();

lua.eval("local mangos = 5;");