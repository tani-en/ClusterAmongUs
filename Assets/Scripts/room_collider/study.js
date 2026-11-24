const MONITOR = $.worldItemReference("monitor");


$.onStart(() => {
  $.state.prev_num_player = -1;
});

$.onUpdate(deltaTime => {
  let overlaps = $.getOverlaps();
  let num_player = 0;

  for (let overlap of overlaps) {
    if (overlap.handle?.type === "player") {
      num_player += 1;
    }
  }

  if (num_player !== $.state.prev_num_player) {
    $.state.prev_num_player = num_player;

    MONITOR.send("room_collider", {
      room: "study",
      num_player: num_player
    });
  }
});