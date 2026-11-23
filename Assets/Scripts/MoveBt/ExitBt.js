$.onInteract(player => {
  const pos = player.getPosition();
  player.setPosition(new Vector3(pos.x, pos.y + 3, pos.z));
});