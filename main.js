let font = new BFF.Font();
function fill() {
    if(!($("#width").is(":valid") && $("#height").is(":valid"))) return;
    $("#height_var").value($("#height").value());
    $("#width_var").value($("#width").value());
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
                font.glyphs[$("#character").value()].glyph[y][x] = !self.is("[on]");
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

let variable = false;
$("#width_var").on("change", changed.bind(null, true));
$("#height_var").on("change", changed.bind(null, true));

$("#variable").on("change", () => {
    if($("#variable").checked()) {
        let variable = true;
        $.all(".var").forEach(v => {
            v.elt.removeAttribute("hidden")
            if(v.id() == "width_var") {
                v.value($("#width").value());
                font.glyphs[$("#character").value()].width = parseInt($("#width").value());
            } else {
                v.value($("#height").value());
                font.glyphs[$("#character").value()].height = parseInt($("#height").value())
            }
        });
        changed(true);
    } else {
        let variable = false;
        $.all(".var").props({
            hidden: "",
        });
        font.glyphs[$("#character").value()].width = 0;
        font.glyphs[$("#character").value()].height = 0;
        font.glyphs[$("#character").value()].glyph = font.emptyGlyph.glyph;
        changed();
    }
})

function changed(h = false) {
    if(!$("#character").value()) {
        for(let y = 0; y < font.height; y++) {
            for(let x = 0; x < font.width; x++) {
                $(`#container>[x="${x}"][y="${y}"]`).elt.removeAttribute("on");
            }
        } 
        return;
    }
    const glyph = font.glyphs[$("#character").value()];
    if(!(h===true)) {
        if(glyph.width !== 0) {
            variable = true;
            $("#height_var").value(glyph.height)
            $("#width_var").value(glyph.width)
        } else {
            variable = false;
            $("#height_var").value($("#height").value());
            $("#width_var").value($("#width").value());
        }
    }
    const width = parseInt($("#width_var").value());
    const height = parseInt($("#height_var").value());
    if(h===true) {
        glyph.width = width;
        glyph.height = height;
        glyph.glyph = (new BFF.Font(width, height)).emptyGlyph.glyph;
    } else {
        if(glyph.width === 0) {
            $("#variable").checked(false);
            variable = false;
            $.all(".var").props({
                hidden: "",
            });
        } else {
            $("#variable").checked(true);
            variable = true;
            $.all(".var").forEach(v => {
                v.elt.removeAttribute("hidden")
            });
        }
    }
    const v = $("#container");
    v.children.remove();
    for(let  y = 0; y < height; y++) {
        for(let x = 0; x < width; x++) {
            const b = $.create("button").class("pixel").on("mousedown", function () {
                const self = $.from(this);
                const x = parseInt(self.getProp("x"));
                const y = parseInt(self.getProp("y"));
                if(!$("#character").value()) return;
                font.glyphs[$("#character").value()].glyph[y][x] = !self.is("[on]");
                if(self.is("[on]")) {
                    self.elt.removeAttribute("on");
                } else {
                    self.props({on: ""});
                }
            }).props({
                x, y
            })
            if(!glyph.glyph[y]) {
                glyph.glyph[y] = x;
            }
            if(glyph.glyph[y][x]) {
                b.props({on:""})
            }
            v.child(b);
        }
        v.child($.create("br"));
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
    $("main").html($("main").html());
    const [name, arr] = await handleFileInput(e);
    const newfont = BFF.Font.from(arr);
    $("#name").value(name);
    $("#width").value(newfont.width);
    $("#height").value(newfont.height);
    font = newfont;
    fill(); 
    font = newfont;
    for(const value in font.glyphs) {
        $("#character").child($.create("option").value(value).text(value === " "? "-space-": value)).value(value);
    }
    changed();
});
$("#import").click(() => $("#file").click());

