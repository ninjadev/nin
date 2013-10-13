function initTextArea(){
    var textArea = document.getElementById("text-area");
    var codeMirror = CodeMirror.fromTextArea(textArea, {
        mode: "javascript",
        keyMap: "vim"
    });
}
