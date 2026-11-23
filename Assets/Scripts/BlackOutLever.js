const GAMEMANAGER = $.worldItemReference("gameManager");

$.onInteract((player) => {
  GAMEMANAGER.send("sabotageFix", { player: player, kind: "blackout" });
});