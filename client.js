$(function() {
  var url = '0.0.0.0:1024';
  var qs = Qs.parse(location.search.slice(1));
  var ignoreRemoteEvent = false;
  var events = [];
  var socket = io(url, {
    query: { r: qs.r }
  });

  // 这里要保留数据让编辑器加载完毕后进行初始化, 有更好的方式?
  socket.on('initEvents', function(result) {
    events = result;
  });
  require(["vs/editor/editor.main"], function () {
    editor = monaco.editor.create(document.getElementById('monaco'), {
      language: 'javascript',
      theme: 'vs-dark',
    });
    editor.onDidChangeModelContent(function(change) {
      if (ignoreRemoteEvent) {
        return;
      }
      socket.emit('event', { type: 'editor', event: change }, function(data) {
				callback();
			});
    });
    function initEvents() {
      const targetEventIndex = events.length - 1;
      // 0 -> end - 1
      for(var i = 0; i <= targetEventIndex; i++) {
        var item = events[i];
        var event = events[i].event;
        if (item.type === 'editor') {
          for(var j = 0; j < event.changes.length; j++) {
            var change = event.changes[j];
            // Refer to: https://github.com/Microsoft/monaco-editor/issues/432.
            try {
              ignoreRemoteEvent = true;
              console.log('!!! > ', change)
              executeEdits([
                {
                  identifier: 'playback',
                  range: new monaco.Range(
                    change.range.startLineNumber,
                    change.range.startColumn,
                    change.range.endLineNumber,
                    change.range.endColumn),
                  text: change.text
                }
              ]);
            } finally {
              ignoreRemoteEvent = false;
            }
          }
        }
      }
      ignoreRemoteEvent = false;
    }
    function executeEdits(edits, endCursorState) {
      editor.getModel().pushEditOperations(editor.getSelections(), edits, function() {
        return endCursorState ? endCursorState : null;
      });
      editor.getModel().pushStackElement();
      if (endCursorState) {
        editor.setSelections(endCursorState);
      }
    }

    setTimeout(() => {
      initEvents()
    }, 1000)
    socket.on('event', function(data) {
      var event = data.event;
      // 遍历所有monaco事件
      for(var i = 0; i < event.changes.length; i++) {
        var change = event.changes[i];
        // Refer to: https://github.com/Microsoft/monaco-editor/issues/432.
        try {
          ignoreRemoteEvent = true;
          editor.executeEdits("", [
            {
              identifier: 'remote',
              range: new monaco.Range(
                change.range.startLineNumber,
                change.range.startColumn,
                change.range.endLineNumber,
                change.range.endColumn),
              text: change.text
            }
            ]);
        } finally {
          ignoreRemoteEvent = false;
        }
      }
    });
  });
});