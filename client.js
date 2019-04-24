$(function() {
  var url = '0.0.0.0:1024';
  var qs = Qs.parse(location.search.slice(1));
  var ignoreRemoteEvent = false;
  var socket = io(url, {
    query: { r: qs.r }
  });
  var pushEventsQueue = async.queue(function pushEventsQueue(data, callback) {
    console.log('emit')
    if (data.type === 'editor') {
      socket.emit('event', { event: data.task }, function(data) {
				callback();
			});
    }
  }, 1);


  require(["vs/editor/editor.main"], function () {
    editor = monaco.editor.create(document.getElementById('monaco'), {
      language: 'javascript',
      // theme: 'vs-dark',
    });
    editor.onDidChangeModelContent(function(change) {
      if (ignoreRemoteEvent) {
        return;
      }
      // pushEventsQueue.push({ type: 'editor', task: change }, function() {});
      socket.emit('event', { type: 'editor', task: change }, function(data) {
				callback();
			});
    });
    socket.on('event', function(data) {
      var event = data.task;
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