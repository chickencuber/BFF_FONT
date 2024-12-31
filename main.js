let font = new BFF.Font();
function fill() {
    if(!($("#width").is(":valid") && $("#height").is(":valid"))) return;
    const width = parseInt($("#width").value());
    const height = parseInt($("#height").value());
    const v = $("#container");
    v.children.remove();
    for(let  y = 0; y < height; y++) {
        for(let x = 0; x < width; x++) {
            v.child($.create("button").class("pixel").on("mousedown", function () {
                const self = $.from(this);
                const x = parseInt(self.getProp("x"));
                const y = parseInt(self.getProp("y"));
                if(!$("#character").value()) return;
                font.glyphs[$("#character").value()][y][x] = !self.is("[on]");
                if(self.is("[on]")) {
                    self.elt.removeAttribute("on");
                } else {
                    self.props({on: ""});
                }
            }).props({
                x, y
            }));
        }
        v.child($.create("br"));
    }
    font = new BFF.Font(width, height);
    $("#character").children.remove();
}

fill();

$("#width").on("change", fill);
$("#height").on("change", fill);

$("#add").click(() => {
    const char = prompt("char");
    if(char.length !== 1 && char !== ".notdef") {
        alert("invalid name");
        return;
    }
    const value = char;
    const name =  char === " "? "-space-": char;
    if(font.glyphs[value]) {
        alert("glyph already exists");
        return;
    }

    $("#character").child($.create("option").value(value).text(name)).value(value);
    font.addGlyph(value, font.emptyGlyph);
    changed();
});

$("#delete").click(() => {
    if(confirm(`are you sure you want to delete '${$("#character").text()}'`)) {
        delete font.glyphs[$("#character").value()];
        $(`#character>[value="${$("#character").value()}"]`).remove();
        changed();
    }
});

function changed() {
    if(!$("#character").value()) {
        for(let y = 0; y < font.height; y++) {
            for(let x = 0; x < font.width; x++) {
                $(`#container>[x="${x}"][y="${y}"]`).elt.removeAttribute("on");
            }
        } 
        return;
    }
    const glyph = font.glyphs[$("#character").value()];
    for(let y = 0; y < font.height; y++) {
        for(let x = 0; x < font.width; x++) {
            if(glyph[y][x]) {
                $(`#container>[x="${x}"][y="${y}"]`).props({on:""});
            } else {
                $(`#container>[x="${x}"][y="${y}"]`).elt.removeAttribute("on");
            }
        }
    }
}

$("#character").on("change", changed);

function save(uint8Array, name, extension = "") {
    const blob = new Blob([uint8Array], { type: 'application/octet-stream' });

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name + extension;

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
}

function handleFileInput(event) {
    return new Promise((r) => {
        const file = event.target.files[0];
        if (!file) {
            alert("No file selected");
            return;
        }

        const fileName = file.name.slice(0, -4);

        const reader = new FileReader();

        reader.onload = function(e) {
            const arrayBuffer = e.target.result;
            const uint8Array = new Uint8Array(arrayBuffer);
            r([fileName, uint8Array]);
        };

        reader.readAsArrayBuffer(file);
    })
}

$("#export").click(() => {
    if(Object.keys(font.glyphs).length === 0 || !($("#width").is(":valid") && $("#height").is(":valid") && $("#name").is(":valid"))) return;
    save(font.compile(), $("#name").value(), ".bff"); 
});

$("#file").on("change", async (e) => {
    const [name, arr] = await handleFileInput(e);
    const newfont = BFF.Font.from(arr);
    $("#name").value(name);
    $("#width").value(newfont.width);
    $("#height").value(newfont.height);
    fill(); 
    font = newfont;
    for(const value in font.glyphs) {
        $("#character").child($.create("option").value(value).text(value === " "? "-space-": value)).value(value);
    }
    changed();
});
$("#import").click(() => $("#file").click());

