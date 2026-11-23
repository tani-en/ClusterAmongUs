const MONITOR = $.worldItemReference("monitor");



$.onUpdate(deltaTime => {
  let overlaps = $.getOverlaps();
  let num_player = 0;

  for (let overlap of overlaps) {
    if (overlap.handle?.type === "player") {
      num_player += 1;
    }
  }

    MONITOR.send("room_collider", {
      room: "study",
      num_player: num_player
    });
});