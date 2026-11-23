$.onInteract(player => {
  $.worldItemReference("gameManager").send("report", player);
});