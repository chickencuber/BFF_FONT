//this is NOT compatible with old version of the bff format!
//this is just a better version of the old version
/*format
width: u8
height: u8
char: u8 
[
[line [u8(ceil width/8)]](height)
](char amount)
*/

const BFF = (() => {

    Array.prototype.chunk = function (amount) {
        const arr = structuredClone(this);
        const _new = [];
        while (arr.length > 0) {
            _new.push(arr.splice(0, amount));
        }
        return _new;
    };

    String.prototype.chunk = function (amount) {
        return this.split("")
            .chunk(amount)
            .map((v) => v.join(""));
    };
    class Font {
        /**
            * @param {number} [width=8] 
        * @param {number} [height=8] 
        */
        constructor(width = 8, height = 8) {
            this.width = width;
            this.height = height;
            /**
            * @type {Array<Array<boolean>>}
            */
            this.glyphs = {}
        }
        /**
        * @param {string} char 
        * @param {Array<Array<boolean>>} glyph 
        * @returns {this}
        */
        addGlyph(char, glyph) {
            if(char.length !== 1 && char !== ".notdef") throw new Error(char + " not a char");
            this.glyphs[char] = glyph;
            return this;
        }
        /**
        * @returns {Uint8Array}
        */
        compile() {
            if(!this.glyphs[".notdef"]) throw new Error("you need the .notdef char");
            const v = [];
            v.push(this.width);
            v.push(this.height);
            for(const [name, value] of Object.entries(this.glyphs)) {
                v.push(name === ".notdef"? 0: name.charCodeAt(0));
                for(let y = 0; y < this.height; y++) {
                    let str = value[y].map(v => v? "1": "0").join("");
                    if(value[y].length !== this.width) throw new Error("invalid width");
                    if(this.width % 8 !== 0) {
                        for(let i = 0; i < 8-(this.width%8); i++) {
                            str = "0" + str;
                        }
                    }
                    str = str.chunk(8); 
                    for(const val of str) {
                       v.push(parseInt(val, 2));
                    }
                }
            }
            return Uint8Array.from(v);
        }
        /**
        * @param {Uint8Array} data
        * @returns this
        */
        static from(data) {
            const _data = Array.from(data);
            const width = _data.shift();
            const height = _data.shift(); 
            const amount =  Math.ceil(width/8);
            const change = 8*amount-width;
            const font = new this(width, height);
            while(true) {
                if(_data.length === 0) break;
                let char = _data.shift();
                char = char === 0? ".notdef": String.fromCharCode(char);
                const glyph = [];
                for(let y = 0; y < height; y++) {
                    let line = "";
                    for(let x = 0; x < amount; x++) {
                        line += _data.shift().toString(2).padStart(8, "0");
                    } 
                    glyph.push(line.slice(change));
                }
                font.addGlyph(char, this.glyph(...glyph));
            }
            return font;
        }
        /**
            * @param {...string} args 
            * @returns {Array<Array<boolean>>}
            */
        static glyph(...args) {
            const v = [];
            for(const str of args) {
                const row = [];
                for(const char of str.split("")) {
                    row.push(char === "1");
                }
                v.push(row);
            }
            return v;
        }
        /**
        * @returns {Array<Array<boolean>>}
        */
        get emptyGlyph() {
            const v = [];
            for(let y = 0; y < this.height; y++) {
                const row = [];
                for(let x = 0; x < this.width; x++) {
                    row.push(false);
                }
                v.push(row);
            }
            return v;
        }
    }
    return {Font};
})();
