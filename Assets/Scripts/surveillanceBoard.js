const board = $.subNode("board");
const board1 = $.subNode("board (1)");
const board2 = $.subNode("board (2)");
const board3 = $.subNode("board (3)");
const boards = [board, board1, board2, board3];

$.onStart(() => {
  $.state.show_board = 0;

  boards.forEach((b, i) => {
    b.setEnabled(i === 0);
  });
});

$.onReceive((messageType, arg) => {
  if (messageType === "change") {
    boards[$.state.show_board].setEnabled(false);
    $.state.show_board = ($.state.show_board + 1) % boards.length;
    boards[$.state.show_board].setEnabled(true);
  }
});