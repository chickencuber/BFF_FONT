//this is NOT compatible with old version of the bff format!
//this is just a better version of the old version
/*format
va: u8
vb: u8
vc: u8
# ^makes up the version number ([a].[b].[c])
width: u8
height: u8
char_amount: u8
[
char: u8 
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
            * @type {Record<string, Glyph>}
            */
            this.glyphs = {}
        }
        /**
        * @param {string} char 
        * @param {Glyph} glyph 
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
            v.push("B".charCodeAt(0), "F".charCodeAt(0), "F".charCodeAt(0));
            v.push(0, 0, 2); // 0.0.2
            v.push(this.width);
            v.push(this.height);
            v.push(Object.keys(this.glyphs).length);
            for(const [name, value] of Object.entries(this.glyphs)) {
                v.push(name === ".notdef"? 0: name.charCodeAt(0));
                v.push(value.width);
                let width = this.width;
                let height = this.height;
                if(value.width !== 0) {
                    v.push(value.height);
                    width = value.width;
                    height = value.height;
                }
                for(let y = 0; y < height; y++) {
                    let str = value.glyph[y].map(v => v? "1": "0").join("");
                    if(value.glyph[y].length !== width) throw new Error("invalid width");
                    if(width % 8 !== 0) {
                        for(let i = 0; i < 8-(width%8); i++) {
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
        static _from_0_0_2(_data) {
            const width = _data.shift();
            const height = _data.shift(); 
            const char_amount = _data.shift();
            const amount =  Math.ceil(width/8);
            const change = 8*amount-width;
            const font = new this(width, height);
            for(let _ = 0; _ < char_amount; _++) {
                if(_data.length === 0) break;
                let char = _data.shift();
                char = char === 0? ".notdef": String.fromCharCode(char);
                const ow = _data.shift();
                let _w = ow;
                let _h = height;
                let _c = change;
                let _a = amount;
                if(_w !== 0) {
                    _h = _data.shift();
                    _a = Math.ceil(_w/8);
                    _c = 8*_a-_w
                } else {
                    _w = width;
                }
                const glyph = [];
                for(let y = 0; y < _h; y++) {
                    let line = "";
                    for(let x = 0; x < _a; x++) {
                        line += _data.shift().toString(2).padStart(8, "0");
                    } 
                    glyph.push(line.slice(_c));
                }
                if(ow === 0) {
                    font.addGlyph(char, this.glyph(0, 0, ...glyph));
                } else {
                    font.addGlyph(char, this.glyph(_w, _h, ...glyph));
                }
            }
            return font;

        }
        static _from_0_0_1(_data) {
            const width = _data.shift();
            const height = _data.shift(); 
            const char_amount = _data.shift();
            const amount =  Math.ceil(width/8);
            const change = 8*amount-width;
            const font = new this(width, height);
            for(let _ = 0; _ < char_amount; _++) {
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
                font.addGlyph(char, this.glyph(0, 0, ...glyph));
            }
            return font;

        }
        /**
        * @param {Uint8Array} data
        * @returns this
        */
        static from(data) {
            const _data = Array.from(data);
            const chars = Array(3).fill().map(() => String.fromCharCode(_data.shift())).join("");
            console.log(chars);
            if(chars !== "BFF") {
                alert("not bff file");
                return;
            }
            const a = _data.shift();
            const b = _data.shift();
            const c = _data.shift();
            return this[`_from_${a}_${b}_${c}`](_data);
        }
        /**
            * @param {number} width 
            * @param {number} height 
            * @param {...string} args 
            * @returns {Glyph}
            */
        static glyph(width, height, ...args) {
            const v = [];
            for(const str of args) {
                const row = [];
                for(const char of str.split("")) {
                    row.push(char === "1");
                }
                v.push(row);
            }
            return {glyph: v, width, height};
        }
        /**
        * @returns {Glyph}
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
            return {glyph: v, width: 0, height: 0};
        }
    }
    return {Font};
})();
